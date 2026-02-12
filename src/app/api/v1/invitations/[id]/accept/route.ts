import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'

type RouteContext = { params: { id: string } }

export async function POST(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { db } = await import('@/lib/db')

  // The :id segment is the invitation token
  const invitation = await db.invitation.findUnique({
    where: { token: params.id },
    include: { organization: true },
  })

  if (!invitation) {
    return errorResponse('NOT_FOUND', 'Invitation not found', 404)
  }

  // Check terminal statuses before checking expiry so callers get precise errors
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

  // The invitation must have been sent to the authenticated user's email address
  if (session.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return errorResponse(
      'FORBIDDEN',
      'This invitation was sent to a different email address',
      403,
    )
  }

  // Idempotency: user is already a member — mark accepted and return success
  const existingMembership = await db.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId: invitation.orgId } },
  })
  if (existingMembership) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', acceptedById: session.user.id, acceptedAt: new Date() },
    })
    return successResponse({
      orgId: invitation.organization.id,
      orgName: invitation.organization.name,
      orgSlug: invitation.organization.slug,
      role: existingMembership.role,
    })
  }

  // Atomically create the membership and mark the invitation as accepted
  const [membership] = await db.$transaction([
    db.membership.create({
      data: {
        userId: session.user.id,
        orgId: invitation.orgId,
        role: invitation.role,
      },
    }),
    db.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', acceptedById: session.user.id, acceptedAt: new Date() },
    }),
  ])

  return successResponse({
    orgId: invitation.organization.id,
    orgName: invitation.organization.name,
    orgSlug: invitation.organization.slug,
    role: membership.role,
  })
}
