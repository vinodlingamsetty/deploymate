import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'

// GET /api/v1/group-invitations/[id]
// Requires auth. Looks up a GroupInvitation by token.
// The URL param `id` contains the token string.
export async function GET(
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
      invitedBy: { select: { firstName: true, lastName: true, email: true } },
    },
  })

  if (!invitation) {
    return errorResponse('NOT_FOUND', 'Invitation not found', 404)
  }

  const groupName = invitation.appGroup?.name ?? invitation.orgGroup?.name ?? 'Unknown Group'
  const contextName =
    invitation.appGroup?.app.name ??
    invitation.orgGroup?.organization.name ??
    'Unknown'
  const inviterName =
    invitation.invitedBy.firstName && invitation.invitedBy.lastName
      ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`
      : invitation.invitedBy.email

  return successResponse({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    groupName,
    contextName,
    inviterName,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  })
}
