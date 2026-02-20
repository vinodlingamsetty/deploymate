/**
 * Integration tests for POST /api/auth/register
 * Uses a real PostgreSQL test database (see .env.test).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testDb } from '../setup'

// Mock the rate-limit module so registration tests never hit the cap
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 9, resetAt: Date.now() + 900_000 }),
  getRateLimitKey: vi.fn().mockReturnValue('register:test'),
}))

// Mock auth to avoid next-auth trying to load session cookies in node env
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}))

import { POST } from '@/app/api/auth/register/route'

function makeRegisterRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'TestPass1!',
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    delete process.env.DISABLE_REGISTRATION
  })

  it('200: valid registration creates a user in the DB', async () => {
    const res = await POST(makeRegisterRequest(VALID_BODY))
    const body = await res.json() as { data: { success: boolean } }

    expect(res.status).toBe(200)
    expect(body.data.success).toBe(true)

    const user = await testDb.user.findUnique({ where: { email: 'test@example.com' } })
    expect(user).not.toBeNull()
    expect(user?.firstName).toBe('Test')
  })

  it('200: first user automatically gets isSuperAdmin=true', async () => {
    await POST(makeRegisterRequest(VALID_BODY))
    const user = await testDb.user.findUnique({ where: { email: 'test@example.com' } })
    expect(user?.isSuperAdmin).toBe(true)
  })

  it('200: second user does NOT get isSuperAdmin', async () => {
    await POST(makeRegisterRequest(VALID_BODY))

    const secondBody = { ...VALID_BODY, email: 'second@example.com' }
    await POST(makeRegisterRequest(secondBody))

    const user = await testDb.user.findUnique({ where: { email: 'second@example.com' } })
    expect(user?.isSuperAdmin).toBe(false)
  })

  it('409: duplicate email returns EMAIL_TAKEN', async () => {
    await POST(makeRegisterRequest(VALID_BODY))
    const res = await POST(makeRegisterRequest(VALID_BODY))
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(409)
    expect(body.error.code).toBe('EMAIL_TAKEN')
  })

  it('400: missing fields returns VALIDATION_ERROR', async () => {
    const res = await POST(makeRegisterRequest({ email: 'x@y.com' }))
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('400: password without digit fails validation', async () => {
    const res = await POST(makeRegisterRequest({ ...VALID_BODY, password: 'NoDigitsHere!' }))
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('403: when DISABLE_REGISTRATION=true, returns FORBIDDEN', async () => {
    process.env.DISABLE_REGISTRATION = 'true'
    const res = await POST(makeRegisterRequest(VALID_BODY))
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
  })
})
