import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
})

export async function GET(): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { db } = await import('@/lib/db')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      isSuperAdmin: true,
      createdAt: true,
    },
  })

  if (!user) {
    return errorResponse('NOT_FOUND', 'User not found', 404)
  }

  return successResponse(user)
}

export async function PATCH(request: NextRequest): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { db } = await import('@/lib/db')

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      isSuperAdmin: true,
      createdAt: true,
    },
  })

  return successResponse(updated)
}
