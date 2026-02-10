import { NextResponse } from 'next/server'
import { z } from 'zod'

const setupBodySchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or less')
    .refine((val) => /[a-zA-Z]/.test(val), 'Password must contain at least one letter')
    .refine((val) => /\d/.test(val), 'Password must contain at least one number'),
  firstName: z.string().max(50, 'First name must be 50 characters or less').optional(),
  lastName: z.string().max(50, 'Last name must be 50 characters or less').optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = setupBodySchema.safeParse(body)

    if (!parsed.success) {
      const firstMessage =
        parsed.error.issues.map((i) => (typeof i.message === 'string' ? i.message : undefined)).find(Boolean) ??
        'Validation failed'
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: firstMessage } }, { status: 400 })
    }

    const { email, password, firstName, lastName } = parsed.data
    const emailLower = email.trim().toLowerCase()

    const { db } = await import('@/lib/db')
    const { hashPassword } = await import('@/lib/auth-utils')

    const passwordHash = await hashPassword(password)

    // Wrap count-check + create in a transaction to prevent TOCTOU race condition
    const result = await db.$transaction(async (tx) => {
      const userCount = await tx.user.count()
      if (userCount > 0) {
        return { alreadySetup: true }
      }
      await tx.user.create({
        data: {
          email: emailLower,
          passwordHash,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          isSuperAdmin: true,
        },
      })
      return { alreadySetup: false }
    })

    if (result.alreadySetup) {
      return NextResponse.json(
        { error: { code: 'SETUP_COMPLETE', message: 'Setup already completed. Please use the login page.' } },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: { success: true }, meta: {} })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Setup error:', message)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } },
      { status: 500 }
    )
  }
}
