import { handlers } from '@/lib/auth'
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { type NextRequest, NextResponse } from 'next/server'

export const { GET } = handlers

export async function POST(req: NextRequest): Promise<Response> {
  // Rate-limit credential login attempts
  if (new URL(req.url).pathname.endsWith('/callback/credentials')) {
    const rl = checkRateLimit(getRateLimitKey(req, 'login'), { windowMs: 15 * 60 * 1000, max: 10 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many login attempts.' } },
        { status: 429 }
      )
    }
  }
  return handlers.POST(req)
}
