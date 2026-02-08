import NextAuth, { type DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      isSuperAdmin: boolean
    } & DefaultSession['user']
  }

  interface User {
    isSuperAdmin: boolean
  }
}

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

const authSecret = getAuthSecret()

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/auth-error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = (credentials.email as string).trim().toLowerCase()
        const password = credentials.password as string

        // Dummy login for development (remove before production)
        const DUMMY_EMAIL = 'demo@deploymate.local'
        const DUMMY_PASSWORD = 'demo123'
        if (email === DUMMY_EMAIL && password === DUMMY_PASSWORD) {
          return {
            id: 'demo-user-id',
            email: DUMMY_EMAIL,
            name: 'Demo User',
            image: null,
            isSuperAdmin: false,
          }
        }

        // Dynamically import dependencies to avoid bundling issues
        const { db } = await import('@/lib/db')
        const { verifyPassword } = await import('@/lib/auth-utils')

        // Find user by email
        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user) {
          return null
        }

        // Verify password
        const isValidPassword = await verifyPassword(user.passwordHash, password)

        if (!isValidPassword) {
          return null
        }

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() },
        })

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email,
          image: user.avatarUrl,
          isSuperAdmin: user.isSuperAdmin,
        }
      },
    }),
  ],
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
})
