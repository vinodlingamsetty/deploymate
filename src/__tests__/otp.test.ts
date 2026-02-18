import { describe, it, expect, beforeAll, vi } from 'vitest'

// Mock the auth module to avoid pulling in next-auth at import time
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { hashOtp } from '@/lib/auth-utils'

beforeAll(() => {
  // Provide a deterministic secret for tests
  process.env.AUTH_SECRET = 'test-secret-for-otp-hashing'
})

describe('hashOtp', () => {
  it('returns a hex string', () => {
    const hash = hashOtp('123456')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic — same input yields same output', () => {
    const a = hashOtp('654321')
    const b = hashOtp('654321')
    expect(a).toBe(b)
  })

  it('produces different hashes for different codes', () => {
    const a = hashOtp('111111')
    const b = hashOtp('222222')
    expect(a).not.toBe(b)
  })

  it('throws when AUTH_SECRET is not set', () => {
    const original = process.env.AUTH_SECRET
    delete process.env.AUTH_SECRET
    delete process.env.NEXTAUTH_SECRET
    expect(() => hashOtp('123456')).toThrow('AUTH_SECRET is not set')
    process.env.AUTH_SECRET = original
  })
})

describe('OTP format validation', () => {
  const sixDigitRegex = /^\d{6}$/

  it('accepts valid 6-digit codes', () => {
    expect(sixDigitRegex.test('000000')).toBe(true)
    expect(sixDigitRegex.test('123456')).toBe(true)
    expect(sixDigitRegex.test('999999')).toBe(true)
  })

  it('rejects non-6-digit strings', () => {
    expect(sixDigitRegex.test('12345')).toBe(false)   // too short
    expect(sixDigitRegex.test('1234567')).toBe(false)  // too long
    expect(sixDigitRegex.test('abcdef')).toBe(false)   // letters
    expect(sixDigitRegex.test('12 34 56')).toBe(false) // spaces
    expect(sixDigitRegex.test('')).toBe(false)          // empty
  })
})
