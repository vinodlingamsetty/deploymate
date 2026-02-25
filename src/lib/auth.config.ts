import type { NextAuthConfig } from 'next-auth'

// Auth.js v5 requires AUTH_SECRET or NEXTAUTH_SECRET for JWT/session signing.
// Without it, /api/auth/error shows "There is a problem with the server configuration."
const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret-do-not-use-in-production'
const BUILD_FALLBACK_SECRET = 'build-only-auth-secret-do-not-use-in-production'

export const AUTH_SECRET_MISSING_ERROR =
  '[NextAuth] AUTH_SECRET or NEXTAUTH_SECRET is not set. ' +
  'Set one of these environment variables in .env in the project root ' +
  '(same directory as package.json) and restart the server. ' +
  'Generate a value with: openssl rand -base64 32'

export type AuthEnv = Record<string, string | undefined>

let didWarnDevFallback = false

function getConfiguredSecret(env: AuthEnv): string | null {
  return env.AUTH_SECRET ?? env.NEXTAUTH_SECRET ?? null
}

export function isProductionBuildPhase(env: AuthEnv = process.env): boolean {
  return (
    env.NODE_ENV === 'production' &&
    (env.NEXT_PHASE === 'phase-production-build' || env.npm_lifecycle_event === 'build')
  )
}

export function assertAuthSecretRuntime(env: AuthEnv = process.env): void {
  if (getConfiguredSecret(env)) return
  if (env.NODE_ENV !== 'production') return
  if (isProductionBuildPhase(env)) return
  throw new Error(AUTH_SECRET_MISSING_ERROR)
}

export function resolveAuthSecret(env: AuthEnv = process.env): string {
  const secret = getConfiguredSecret(env)

  if (secret) {
    return secret
  }

  if (env.NODE_ENV === 'production' && isProductionBuildPhase(env)) {
    // Build-only fallback allows Next to evaluate route modules during `next build`.
    // Runtime still enforces a real secret via assertAuthSecretRuntime()/entrypoint checks.
    return BUILD_FALLBACK_SECRET
  }

  if (env.NODE_ENV !== 'production') {
    if (!didWarnDevFallback) {
      // Development fallback — allows the app to start without .env but warns loudly
      // Note: console.warn used here instead of pino — this file must be Edge-safe (middleware)
      console.warn(
        '[NextAuth] AUTH_SECRET / NEXTAUTH_SECRET is not set. ' +
        'Using an insecure dev-only fallback. Login will work but sessions ' +
        'will not survive restarts. Set AUTH_SECRET in .env and restart.',
      )
      didWarnDevFallback = true
    }
    return DEV_FALLBACK_SECRET
  }

  throw new Error(AUTH_SECRET_MISSING_ERROR)
}

/**
 * Edge-safe auth configuration. No Node.js-only providers here.
 * Used by middleware (Edge Runtime) and extended by the full auth config.
 */
export const authConfig = {
  secret: resolveAuthSecret(),
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/auth-error',
  },
  providers: [], // Providers are added in the full auth.ts (Node.js only)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isSuperAdmin = user.isSuperAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // Prefer token.id; fall back to token.sub (NextAuth always sets sub = user.id on sign-in)
        session.user.id = (token.id ?? token.sub) as string
        session.user.isSuperAdmin = (token.isSuperAdmin as boolean | undefined) ?? false
      }
      return session
    },
  },
} satisfies NextAuthConfig
