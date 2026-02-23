import { createHmac } from 'crypto'
import type { TokenPermission } from '@prisma/client'
import { auth } from '@/lib/auth'

/**
 * Hash a password using Argon2
 * Uses dynamic import to avoid loading native module at build time
 */
export async function hashPassword(password: string): Promise<string> {
  const { hash } = await import('@node-rs/argon2')
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })
}

/**
 * Verify a password against an Argon2 hash
 * Uses dynamic import to avoid loading native module at build time
 */
export async function verifyPassword(hashValue: string, password: string): Promise<boolean> {
  const { verify } = await import('@node-rs/argon2')
  return verify(hashValue, password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })
}

/**
 * Hash a 6-digit OTP code using HMAC-SHA256 for deterministic, fast lookup.
 */
export function hashOtp(code: string): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET is not set — cannot hash OTP')
  }
  return createHmac('sha256', secret).update(code).digest('hex')
}

/**
 * Hash an API token using HMAC-SHA256 for deterministic, fast lookup.
 * Unlike Argon2, HMAC is safe here because API tokens are high-entropy random values.
 */
export function hashApiToken(token: string): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET is not set — cannot hash API token')
  }
  return createHmac('sha256', secret).update(token).digest('hex')
}

/**
 * Get the current session on the server
 * Use this in Server Components and API routes
 */
export async function getServerAuthSession() {
  return await auth()
}

/**
 * Authenticate a request using either session or Bearer token
 * Use this in API routes to support both web and API authentication
 */
export async function authenticateRequest(request: Request): Promise<{
  authenticated: boolean
  authType: 'session' | 'token' | null
  tokenPermissions: TokenPermission[] | null
  user: {
    id: string
    email: string
    isSuperAdmin: boolean
  } | null
}> {
  // Try session authentication first
  const session = await auth()
  
  if (session?.user) {
    if (!session.user.email) {
      return { authenticated: false, authType: null, tokenPermissions: null, user: null }
    }
    return {
      authenticated: true,
      authType: 'session',
      tokenPermissions: null,
      user: {
        id: session.user.id,
        email: session.user.email,
        isSuperAdmin: session.user.isSuperAdmin,
      },
    }
  }

  // Try Bearer token authentication
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, authType: null, tokenPermissions: null, user: null }
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  // Dynamically import db to avoid bundling issues
  const { db } = await import('@/lib/db')

  // Token format: dm_prefix_hash (e.g., dm_12345678_longhash)
  // We only store the HMAC-SHA256 hash in the database
  const tokenHash = hashApiToken(token)

  const apiToken = await db.apiToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isSuperAdmin: true,
        },
      },
    },
  })

  if (!apiToken) {
    return { authenticated: false, authType: null, tokenPermissions: null, user: null }
  }

  // Check if token is expired
  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
    return { authenticated: false, authType: null, tokenPermissions: null, user: null }
  }

  // Update last used timestamp
  await db.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    authenticated: true,
    authType: 'token',
    tokenPermissions: apiToken.permissions,
    user: apiToken.user,
  }
}
