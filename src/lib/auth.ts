import NextAuth, { type DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth-utils'

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
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
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

        const email = credentials.email as string
        const password = credentials.password as string

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
