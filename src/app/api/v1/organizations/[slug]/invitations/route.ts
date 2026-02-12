import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { requireOrgRole } from '@/lib/org-auth'
import { generateInviteToken, getInvitationExpiryDate } from '@/lib/invite-token'
import { sendInvitationEmail } from '@/lib/email'
import { z } from 'zod'

class ConflictError extends Error {}

const sendInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'TESTER']).default('TESTER'),
})

type RouteContext = { params: { slug: string } }

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const roleResult = await requireOrgRole(
    params.slug,
    session.user.id,
    'ADMIN',
    session.user.isSuperAdmin,
  )
  if (roleResult.error) return roleResult.error

  const { org } = roleResult

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = sendInvitationSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const email = parsed.data.email.toLowerCase().trim()

  const { db } = await import('@/lib/db')

  const token = generateInviteToken()
  const expiresAt = getInvitationExpiryDate()

  let invitation: Awaited<ReturnType<typeof db.invitation.create>>
  try {
    invitation = await db.$transaction(async (tx) => {
      // Check if a user with this email is already a member of this org
      const existingUser = await tx.user.findUnique({ where: { email } })
      if (existingUser) {
        const existingMembership = await tx.membership.findUnique({
          where: { userId_orgId: { userId: existingUser.id, orgId: org.id } },
        })
        if (existingMembership) {
          throw new ConflictError('User is already a member of this organization')
        }
      }

      // Check if a pending invitation already exists for this email and org
      const existingInvitation = await tx.invitation.findFirst({
        where: { email, orgId: org.id, status: 'PENDING' },
      })
      if (existingInvitation) {
        throw new ConflictError('A pending invitation already exists for this email')
      }

      return tx.invitation.create({
        data: {
          email,
          orgId: org.id,
          role: parsed.data.role,
          invitedById: session.user.id,
          token,
          expiresAt,
        },
      })
    })
  } catch (e) {
    if (e instanceof ConflictError) {
      return errorResponse('CONFLICT', e.message, 409)
    }
    throw e
  }

  await sendInvitationEmail({
    to: email,
    organizationName: org.name,
    inviterName: session.user.email ?? 'Unknown',
    role: parsed.data.role,
    acceptUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/invitations/${token}/accept`,
  }).catch((err) => {
    console.error(`Failed to send invitation email to ${email}:`, String(err))
  })

  return successResponse(
    {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    },
    201,
  )
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const roleResult = await requireOrgRole(
    params.slug,
    session.user.id,
    'ADMIN',
    session.user.isSuperAdmin,
  )
  if (roleResult.error) return roleResult.error

  const { org } = roleResult

  const { db } = await import('@/lib/db')

  // Batch-expire any invitations whose deadline has passed before returning results
  await db.invitation.updateMany({
    where: { orgId: org.id, status: 'PENDING', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  })

  const invitations = await db.invitation.findMany({
    where: { orgId: org.id, status: 'PENDING' },
    include: {
      invitedBy: { select: { email: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    invitedBy: {
      email: inv.invitedBy.email,
      firstName: inv.invitedBy.firstName,
      lastName: inv.invitedBy.lastName,
    },
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
  }))

  return successResponse(data)
}
