import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'

// POST /api/v1/group-invitations/[id]/accept
// Requires auth. The URL param `id` contains the token string.
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
    where: { token: params.id },
    include: {
      appGroup: { select: { name: true, app: { select: { name: true } } } },
      orgGroup: { select: { name: true, organization: { select: { name: true } } } },
    },
  })

  if (!invitation) {
    return errorResponse('NOT_FOUND', 'Invitation not found', 404)
  }

  if (invitation.status === 'REVOKED') {
    return errorResponse('GONE', 'This invitation has been revoked', 410)
  }

  if (invitation.expiresAt < new Date()) {
    return errorResponse('GONE', 'This invitation has expired', 410)
  }

  // Check email match
  if (session.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return errorResponse('FORBIDDEN', 'This invitation was sent to a different email address', 403)
  }

  const groupName = invitation.appGroup?.name ?? invitation.orgGroup?.name ?? 'Unknown Group'
  const contextName =
    invitation.appGroup?.app.name ??
    invitation.orgGroup?.organization.name ??
    'Unknown'

  if (invitation.status === 'ACCEPTED') {
    // Already accepted — idempotent success
    return successResponse({ groupName, contextName })
  }

  // Create group membership
  if (invitation.appGroupId) {
    await db.appGroupMember.upsert({
      where: { groupId_userId: { groupId: invitation.appGroupId, userId: session.user.id } },
      create: { groupId: invitation.appGroupId, userId: session.user.id, role: invitation.role },
      update: {},
    })
  } else if (invitation.orgGroupId) {
    await db.orgGroupMember.upsert({
      where: { groupId_userId: { groupId: invitation.orgGroupId, userId: session.user.id } },
      create: { groupId: invitation.orgGroupId, userId: session.user.id, role: invitation.role },
      update: {},
    })
  }

  // Mark invitation accepted
  await db.groupInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'ACCEPTED',
      acceptedById: session.user.id,
      acceptedAt: new Date(),
    },
  })

  return successResponse({ groupName, contextName })
}
