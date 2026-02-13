import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { z } from 'zod'

const createTokenSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z
    .array(z.enum(['READ', 'WRITE']))
    .min(1)
    .refine(
      (perms) => perms.includes('READ'),
      { message: 'Permissions must include READ' },
    ),
})

export async function GET(): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { db } = await import('@/lib/db')

  const tokens = await db.apiToken.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      tokenPrefix: true,
      permissions: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(tokens)
}

export async function POST(request: NextRequest): Promise<Response> {
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

  const parsed = createTokenSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { generateApiToken } = await import('@/lib/api-token')
  const { token, prefix, hash } = generateApiToken()

  const { db } = await import('@/lib/db')

  const created = await db.apiToken.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      tokenHash: hash,
      tokenPrefix: prefix,
      permissions: parsed.data.permissions,
    },
    select: {
      id: true,
      name: true,
      tokenPrefix: true,
      permissions: true,
      createdAt: true,
    },
  })

  const response = successResponse(
    {
      ...created,
      token, // shown once — never logged or cached
    },
    201,
  )
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  return response
}
