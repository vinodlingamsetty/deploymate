import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})

export async function POST(request: NextRequest): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const rl = checkRateLimit(getRateLimitKey(request, 'change-password'), { windowMs: 15 * 60 * 1000, max: 5 })
  if (!rl.allowed) {
    return errorResponse('RATE_LIMITED', 'Too many requests.', 429)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { db } = await import('@/lib/db')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  })

  if (!user) {
    return errorResponse('NOT_FOUND', 'User not found', 404)
  }

  const { verifyPassword, hashPassword } = await import('@/lib/auth-utils')

  const isValid = await verifyPassword(user.passwordHash, parsed.data.currentPassword)
  if (!isValid) {
    return errorResponse('BAD_REQUEST', 'Current password is incorrect', 400)
  }

  const newHash = await hashPassword(parsed.data.newPassword)

  await db.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  })

  return successResponse({ success: true })
}
