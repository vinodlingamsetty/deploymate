import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { requireOrgRole } from '@/lib/org-auth'

type RouteContext = { params: { id: string } }

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { db } = await import('@/lib/db')

  const invitation = await db.invitation.findUnique({ where: { id: params.id } })
  if (!invitation) {
    return errorResponse('NOT_FOUND', 'Invitation not found', 404)
  }

  // Resolve the org so we can look up the slug for requireOrgRole
  const orgRecord = await db.organization.findUnique({ where: { id: invitation.orgId } })
  if (!orgRecord) {
    return errorResponse('NOT_FOUND', 'Organization not found', 404)
  }

  const roleResult = await requireOrgRole(
    orgRecord.slug,
    session.user.id,
    'ADMIN',
    session.user.isSuperAdmin,
  )
  if (roleResult.error) return roleResult.error

  if (invitation.status !== 'PENDING') {
    return errorResponse('BAD_REQUEST', 'Only pending invitations can be revoked', 400)
  }

  await db.invitation.update({
    where: { id: params.id },
    data: { status: 'REVOKED' },
  })

  return successResponse({ revoked: true })
}
