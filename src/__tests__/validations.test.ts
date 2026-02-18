import { describe, it, expect } from 'vitest'
import { paginationSchema, createAppSchema } from '@/lib/validations'

describe('paginationSchema', () => {
  it('applies defaults when no values provided', () => {
    const result = paginationSchema.parse({})
    expect(result).toEqual({ page: 1, limit: 20 })
  })

  it('coerces string values to numbers', () => {
    const result = paginationSchema.parse({ page: '3', limit: '50' })
    expect(result).toEqual({ page: 3, limit: 50 })
  })

  it('rejects page < 1', () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow()
  })

  it('rejects limit > 100', () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow()
  })

  it('rejects limit < 1', () => {
    expect(() => paginationSchema.parse({ limit: 0 })).toThrow()
  })
})

describe('createAppSchema', () => {
  const validApp = {
    name: 'My App',
    platform: 'IOS' as const,
    orgId: 'org_123',
  }

  it('accepts valid input with required fields only', () => {
    const result = createAppSchema.parse(validApp)
    expect(result.name).toBe('My App')
    expect(result.platform).toBe('IOS')
    expect(result.orgId).toBe('org_123')
  })

  it('accepts valid input with optional fields', () => {
    const result = createAppSchema.parse({
      ...validApp,
      bundleId: 'com.example.app',
      description: 'A test app',
    })
    expect(result.bundleId).toBe('com.example.app')
    expect(result.description).toBe('A test app')
  })

  it('rejects empty name', () => {
    expect(() => createAppSchema.parse({ ...validApp, name: '' })).toThrow()
  })

  it('rejects invalid platform', () => {
    expect(() => createAppSchema.parse({ ...validApp, platform: 'WINDOWS' })).toThrow()
  })

  it('accepts ANDROID platform', () => {
    const result = createAppSchema.parse({ ...validApp, platform: 'ANDROID' })
    expect(result.platform).toBe('ANDROID')
  })

  it('rejects missing orgId', () => {
    expect(() => createAppSchema.parse({ name: 'App', platform: 'IOS' })).toThrow()
  })
})
