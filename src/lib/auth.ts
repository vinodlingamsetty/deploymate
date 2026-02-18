import NextAuth, { type DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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

        // Dummy login for development only — never runs in production
        if (process.env.NODE_ENV === 'development') {
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
    CredentialsProvider({
      id: 'email-otp',
      name: 'email-otp',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) {
          return null
        }

        const email = (credentials.email as string).trim().toLowerCase()
        const code = (credentials.code as string).trim()

        // Validate 6-digit format
        if (!/^\d{6}$/.test(code)) {
          return null
        }

        const { db } = await import('@/lib/db')
        const { hashOtp } = await import('@/lib/auth-utils')

        const tokenHash = hashOtp(code)

        // Look up matching token
        const verificationToken = await db.verificationToken.findFirst({
          where: {
            identifier: email,
            token: tokenHash,
          },
        })

        if (!verificationToken) {
          return null
        }

        // Check expiry
        if (verificationToken.expires < new Date()) {
          await db.verificationToken.delete({ where: { id: verificationToken.id } })
          return null
        }

        // Delete token (single-use)
        await db.verificationToken.delete({ where: { id: verificationToken.id } })

        // Find user
        const user = await db.user.findUnique({ where: { email } })
        if (!user) {
          return null
        }

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() },
        })

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
})
