import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { isPrismaError } from '@/lib/db'
import { requireAppRole } from '@/lib/permissions'
import { z } from 'zod'

const updateMemberSchema = z.object({
  role: z.enum(['MANAGER', 'TESTER']),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; userId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const roleResult = await requireAppRole(params.id, session.user.id, 'ADMIN', session.user.isSuperAdmin)
  if (roleResult.error) return roleResult.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = updateMemberSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid request', 400)
  }

  const { db } = await import('@/lib/db')

  try {
    const updated = await db.appMembership.update({
      where: { appId_userId: { appId: params.id, userId: params.userId } },
      data: { role: parsed.data.role },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    })

    return successResponse({
      userId: updated.user.id,
      email: updated.user.email,
      firstName: updated.user.firstName,
      lastName: updated.user.lastName,
      avatarUrl: updated.user.avatarUrl,
      role: updated.role,
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2025')) {
      return errorResponse('NOT_FOUND', 'App role override not found for this user', 404)
    }
    throw err
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; userId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const roleResult = await requireAppRole(params.id, session.user.id, 'ADMIN', session.user.isSuperAdmin)
  if (roleResult.error) return roleResult.error

  const { db } = await import('@/lib/db')

  try {
    await db.appMembership.delete({
      where: { appId_userId: { appId: params.id, userId: params.userId } },
    })
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2025')) {
      return errorResponse('NOT_FOUND', 'App role override not found for this user', 404)
    }
    throw err
  }

  return successResponse({ deleted: true })
}
