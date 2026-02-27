import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'

// DELETE /api/v1/group-invitations/[id]/revoke
// Requires auth. Looks up by invitation id (cuid).
export async function DELETE(
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
      appGroup: { select: { app: { select: { orgId: true } } } },
      orgGroup: { select: { orgId: true } },
    },
  })

  if (!invitation) {
    return errorResponse('NOT_FOUND', 'Invitation not found', 404)
  }

  if (invitation.status !== 'PENDING') {
    return errorResponse('BAD_REQUEST', 'Can only revoke pending invitations', 400)
  }

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

  await db.groupInvitation.update({
    where: { id: params.id },
    data: { status: 'REVOKED' },
  })

  return successResponse({ revoked: true })
}
