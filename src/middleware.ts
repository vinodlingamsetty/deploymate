import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

const publicPaths = ['/login', '/register', '/setup', '/auth-error', '/install']

const PUBLIC_API_PATTERNS = [
  /^\/api\/v1\/releases\/[^/]+\/manifest$/,
]

export default auth((req) => {
  const { pathname } = req.nextUrl

  const isPublic =
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    PUBLIC_API_PATTERNS.some((re) => re.test(pathname))

  // Redirect authenticated users away from login to dashboard
  if (req.auth && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Allow public paths without auth
  if (isPublic) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api/auth/* (NextAuth routes)
     * - static assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|api/auth/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
