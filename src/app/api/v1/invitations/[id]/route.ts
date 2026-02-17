import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { requireOrgRole } from '@/lib/org-auth'

type RouteContext = { params: { id: string } }

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const { db } = await import('@/lib/db')

  // params.id is the invitation token (consistent with the accept route)
  const invitation = await db.invitation.findUnique({
    where: { token: params.id },
    include: {
      organization: true,
      invitedBy: { select: { firstName: true, lastName: true, email: true } },
    },
  })

  if (!invitation) {
    return errorResponse('NOT_FOUND', 'Invitation not found', 404)
  }

  // Check terminal statuses first
  if (invitation.status === 'ACCEPTED') {
    return errorResponse('BAD_REQUEST', 'This invitation has already been accepted', 400)
  }
  if (invitation.status === 'REVOKED') {
    return errorResponse('BAD_REQUEST', 'This invitation has been revoked', 400)
  }
  if (invitation.status === 'EXPIRED') {
    return errorResponse('BAD_REQUEST', 'This invitation has expired', 400)
  }

  // Check wall-clock expiry even if the status hasn't been swept yet
  if (invitation.expiresAt < new Date()) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    })
    return errorResponse('BAD_REQUEST', 'This invitation has expired', 400)
  }

  const { invitedBy } = invitation
  const inviterName =
    invitedBy.firstName && invitedBy.lastName
      ? `${invitedBy.firstName} ${invitedBy.lastName}`
      : invitedBy.email

  return successResponse({
    email: invitation.email,
    orgName: invitation.organization.name,
    orgSlug: invitation.organization.slug,
    role: invitation.role,
    inviterName,
    expiresAt: invitation.expiresAt.toISOString(),
    status: invitation.status,
  })
}

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
