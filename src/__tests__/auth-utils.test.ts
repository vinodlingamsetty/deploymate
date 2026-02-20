import { describe, it, expect, beforeAll, vi } from 'vitest'

// Mock the auth module to avoid pulling in next-auth at import time
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { hashApiToken } from '@/lib/auth-utils'
import { isPrismaError } from '@/lib/db'

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-for-auth-utils-tests'
})

describe('hashApiToken', () => {
  it('returns a 64-character hex string', () => {
    const hash = hashApiToken('dm_12345678_abcdef')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic — same input yields same output', () => {
    const a = hashApiToken('dm_aabbccdd_some_token_value')
    const b = hashApiToken('dm_aabbccdd_some_token_value')
    expect(a).toBe(b)
  })

  it('produces different hashes for different inputs', () => {
    const a = hashApiToken('dm_token_one_111')
    const b = hashApiToken('dm_token_two_222')
    expect(a).not.toBe(b)
  })

  it('throws when AUTH_SECRET is not set', () => {
    const original = process.env.AUTH_SECRET
    delete process.env.AUTH_SECRET
    delete process.env.NEXTAUTH_SECRET
    expect(() => hashApiToken('dm_any_token')).toThrow('AUTH_SECRET is not set')
    process.env.AUTH_SECRET = original
  })
})

describe('isPrismaError', () => {
  it('returns true when error has matching code', () => {
    const err = { code: 'P2002', message: 'Unique constraint failed' }
    expect(isPrismaError(err, 'P2002')).toBe(true)
  })

  it('returns false when error has a different code', () => {
    const err = { code: 'P2025', message: 'Record not found' }
    expect(isPrismaError(err, 'P2002')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isPrismaError(null, 'P2002')).toBe(false)
  })

  it('returns false for a plain string', () => {
    expect(isPrismaError('P2002', 'P2002')).toBe(false)
  })

  it('returns false for an object without a code property', () => {
    expect(isPrismaError({ message: 'some error' }, 'P2002')).toBe(false)
  })
})
