import { NextResponse } from 'next/server'
import { z } from 'zod'

const registerBodySchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be 50 characters or less'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be 50 characters or less'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or less')
    .refine((val) => /[a-zA-Z]/.test(val), 'Password must contain at least one letter')
    .refine((val) => /\d/.test(val), 'Password must contain at least one number'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerBodySchema.safeParse(body)

    if (!parsed.success) {
      const firstMessage =
        parsed.error.issues.map((i) => (typeof i.message === 'string' ? i.message : undefined)).find(Boolean) ??
        'Validation failed'
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: firstMessage } }, { status: 400 })
    }

    const { firstName, lastName, email, password } = parsed.data
    const emailLower = email.trim().toLowerCase()

    const { db } = await import('@/lib/db')
    const { hashPassword } = await import('@/lib/auth-utils')

    const existing = await db.user.findUnique({
      where: { email: emailLower },
    })

    if (existing) {
      return NextResponse.json(
        { error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists.' } },
        { status: 409 }
      )
    }

    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    const isSuperAdmin = superAdminEmails.includes(emailLower)

    const passwordHash = await hashPassword(password)

    await db.user.create({
      data: {
        email: emailLower,
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isSuperAdmin,
      },
    })

    return NextResponse.json({ data: { success: true }, meta: {} })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Registration error:', message)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } },
      { status: 500 }
    )
  }
}
