import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { isPrismaError } from '@/lib/db'

export async function DELETE(
  _request: Request,
  { params }: { params: { groupId: string; uid: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  if (!params.groupId.trim() || !params.uid.trim()) {
    return errorResponse('BAD_REQUEST', 'Invalid group ID or user ID', 400)
  }

  const { db } = await import('@/lib/db')

  // Verify group exists and user has access via org membership
  const group = await db.orgDistGroup.findUnique({
    where: { id: params.groupId },
    select: { id: true, orgId: true },
  })
  if (!group) {
    return errorResponse('NOT_FOUND', 'Group not found', 404)
  }

  const membership = await db.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId: group.orgId } },
  })
  if (!membership) {
    return errorResponse('FORBIDDEN', 'You do not have access to this group', 403)
  }

  try {
    await db.orgGroupMember.delete({
      where: {
        groupId_userId: {
          groupId: params.groupId,
          userId: params.uid,
        },
      },
    })
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2025')) {
      return errorResponse('NOT_FOUND', 'Member not found in this group', 404)
    }
    throw err
  }

  return successResponse({ deleted: true })
}
