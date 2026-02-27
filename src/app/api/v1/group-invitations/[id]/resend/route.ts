import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { generateInviteToken, getInvitationExpiryDate } from '@/lib/invite-token'
import { sendGroupInvitationEmail } from '@/lib/email'

// POST /api/v1/group-invitations/[id]/resend
// Requires auth. Looks up by invitation id (cuid).
export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { db } = await import('@/lib/db')

  const invitation = await db.groupInvitation.findUnique({
    where: { id: params.id },
    include: {
      appGroup: { select: { name: true, app: { select: { orgId: true, name: true } } } },
      orgGroup: { select: { name: true, orgId: true, organization: { select: { name: true } } } },
    },
  })

  if (!invitation) {
    return errorResponse('NOT_FOUND', 'Invitation not found', 404)
  }

  if (invitation.status !== 'PENDING') {
    return errorResponse('BAD_REQUEST', 'Can only resend pending invitations', 400)
  }

  // Verify user has access to the group's org
  const orgId = invitation.appGroup?.app.orgId ?? invitation.orgGroup?.orgId
  if (!orgId) {
    return errorResponse('BAD_REQUEST', 'Invitation has no associated group', 400)
  }

  if (!session.user.isSuperAdmin) {
    const membership = await db.membership.findUnique({
      where: { userId_orgId: { userId: session.user.id, orgId } },
    })
    if (!membership || membership.role === 'TESTER') {
      return errorResponse('FORBIDDEN', 'Insufficient permissions', 403)
    }
  }

  const token = generateInviteToken()
  const expiresAt = getInvitationExpiryDate()

  await db.groupInvitation.update({
    where: { id: params.id },
    data: { token, expiresAt },
  })

  const inviter = await db.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, email: true },
  })
  const inviterName =
    inviter?.firstName && inviter?.lastName
      ? `${inviter.firstName} ${inviter.lastName}`
      : (inviter?.email ?? 'Someone')

  const groupName = invitation.appGroup?.name ?? invitation.orgGroup?.name ?? 'Unknown Group'
  const contextName =
    invitation.appGroup?.app.name ??
    invitation.orgGroup?.organization.name ??
    'Unknown'

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const acceptUrl = `${baseUrl}/invitations/group/${token}/accept`

  await sendGroupInvitationEmail({
    to: invitation.email,
    groupName,
    contextName,
    inviterName,
    role: invitation.role.charAt(0) + invitation.role.slice(1).toLowerCase(),
    acceptUrl,
  })

  return successResponse({ resent: true })
}
