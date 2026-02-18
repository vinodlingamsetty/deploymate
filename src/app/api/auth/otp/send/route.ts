import { NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { z } from 'zod'
import logger from '@/lib/logger'

const bodySchema = z.object({
  email: z.string().email(),
})

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 3
const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid email address' } },
        { status: 400 },
      )
    }

    const email = parsed.data.email.trim().toLowerCase()

    const { db } = await import('@/lib/db')

    // Rate limit: count tokens for this email in last 15 minutes
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
    const recentCount = await db.verificationToken.count({
      where: { identifier: email, createdAt: { gte: windowStart } },
    })

    if (recentCount >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
        { status: 429 },
      )
    }

    // Check if user exists — respond the same either way (prevent enumeration)
    const user = await db.user.findUnique({ where: { email } })

    if (user) {
      // Delete any existing tokens for this email
      await db.verificationToken.deleteMany({ where: { identifier: email } })

      // Generate 6-digit code
      const code = String(randomInt(100000, 999999))

      // Hash and store
      const { hashOtp } = await import('@/lib/auth-utils')
      const tokenHash = hashOtp(code)

      await db.verificationToken.create({
        data: {
          identifier: email,
          token: tokenHash,
          expires: new Date(Date.now() + OTP_TTL_MS),
        },
      })

      // Send code via email
      const { sendOtpEmail } = await import('@/lib/email')
      await sendOtpEmail(email, code)

      logger.info({ email }, 'OTP code sent')
    } else {
      logger.info({ email }, 'OTP requested for non-existent user (no-op)')
    }

    return NextResponse.json({ data: { sent: true } })
  } catch (err) {
    logger.error({ err }, 'OTP send error')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    )
  }
}
