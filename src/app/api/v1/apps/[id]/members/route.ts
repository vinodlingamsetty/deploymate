import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { isPrismaError } from '@/lib/db'
import { requireAppRole } from '@/lib/permissions'
import { z } from 'zod'

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['MANAGER', 'TESTER'], {
    error: 'Per-app role must be MANAGER or TESTER',
  }),
})

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const roleResult = await requireAppRole(params.id, session.user.id, 'ADMIN', session.user.isSuperAdmin)
  if (roleResult.error) return roleResult.error

  const { db } = await import('@/lib/db')

  const members = await db.appMembership.findMany({
    where: { appId: params.id },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return successResponse(
    members.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      createdAt: m.createdAt.toISOString(),
    })),
  )
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const roleResult = await requireAppRole(params.id, session.user.id, 'ADMIN', session.user.isSuperAdmin)
  if (roleResult.error) return roleResult.error
  const { app } = roleResult

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = addMemberSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid request', 400)
  }

  const { userId, role } = parsed.data
  const { db } = await import('@/lib/db')

  // Verify the target user is a member of this app's org
  const orgMembership = await db.membership.findUnique({
    where: { userId_orgId: { userId, orgId: app.orgId } },
  })
  if (!orgMembership) {
    return errorResponse('BAD_REQUEST', 'User is not a member of this organization', 400)
  }

  try {
    const member = await db.appMembership.create({
      data: { appId: params.id, userId, role },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    })

    return successResponse(
      {
        userId: member.user.id,
        email: member.user.email,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        avatarUrl: member.user.avatarUrl,
        role: member.role,
        createdAt: member.createdAt.toISOString(),
      },
      201,
    )
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2002')) {
      return errorResponse('CONFLICT', 'This user already has an app-level role override', 409)
    }
    throw err
  }
}
