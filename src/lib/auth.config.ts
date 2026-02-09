import type { NextAuthConfig } from 'next-auth'

// Auth.js v5 requires AUTH_SECRET or NEXTAUTH_SECRET for JWT/session signing.
// Without it, /api/auth/error shows "There is a problem with the server configuration."
const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret-do-not-use-in-production'

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

  if (secret) {
    return secret
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[NextAuth] AUTH_SECRET or NEXTAUTH_SECRET is not set. ' +
      'Set one of these environment variables in .env in the project root ' +
      '(same directory as package.json) and restart the server. ' +
      'Generate a value with: openssl rand -base64 32'
    )
  }

  // Development fallback — allows the app to start without .env but warns loudly
  console.warn(
    '\x1b[33m%s\x1b[0m', // yellow
    '[NextAuth] WARNING: AUTH_SECRET / NEXTAUTH_SECRET is not set. ' +
    'Using an insecure dev-only fallback. Login will work but sessions ' +
    'will not survive restarts. Set AUTH_SECRET in .env and restart.'
  )
  return DEV_FALLBACK_SECRET
}

/**
 * Edge-safe auth configuration. No Node.js-only providers here.
 * Used by middleware (Edge Runtime) and extended by the full auth config.
 */
export const authConfig = {
  secret: getAuthSecret(),
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
        session.user.id = token.id as string
        session.user.isSuperAdmin = token.isSuperAdmin as boolean
      }
      return session
    },
  },
} satisfies NextAuthConfig
