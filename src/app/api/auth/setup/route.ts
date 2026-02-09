import { NextResponse } from 'next/server'
import { z } from 'zod'

const setupBodySchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
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
      return NextResponse.json({ error: firstMessage }, { status: 400 })
    }

    const { email, password, firstName, lastName } = parsed.data
    const emailLower = email.trim().toLowerCase()

    const { db } = await import('@/lib/db')
    const { hashPassword } = await import('@/lib/auth-utils')

    // Guard: setup is only allowed when no users exist
    const userCount = await db.user.count()
    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Setup already completed. Please use the login page.' },
        { status: 403 }
      )
    }

    const passwordHash = await hashPassword(password)

    await db.user.create({
      data: {
        email: emailLower,
        passwordHash,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        isSuperAdmin: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Setup error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
