import { NextResponse } from 'next/server'

/**
 * Dev-only route to check whether auth-related env vars are loaded.
 * Returns "set" or "not set" for each key — never the actual values.
 * Disabled in production.
 *
 * Usage: GET /api/debug-env
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production.' },
      { status: 404 },
    )
  }

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV ?? 'not set',
    AUTH_SECRET: process.env.AUTH_SECRET ? 'set' : 'not set',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'set' : 'not set',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'set' : 'not set',
  })
}
