import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

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
  user: {
    id: string
    email: string
    isSuperAdmin: boolean
  } | null
}> {
  // Try session authentication first
  const session = await auth()
  
  if (session?.user) {
    return {
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email!,
        isSuperAdmin: session.user.isSuperAdmin,
      },
    }
  }

  // Try Bearer token authentication
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, user: null }
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  // Token format: dm_prefix_hash (e.g., dm_12345678_longhash)
  // We only store the hash in the database
  const tokenHash = await hashPassword(token)

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
    return { authenticated: false, user: null }
  }

  // Check if token is expired
  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
    return { authenticated: false, user: null }
  }

  // Update last used timestamp
  await db.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    authenticated: true,
    user: apiToken.user,
  }
}
