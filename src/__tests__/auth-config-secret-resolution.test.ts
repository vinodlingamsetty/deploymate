import { describe, expect, it } from 'vitest'
import {
  AUTH_SECRET_MISSING_ERROR,
  assertAuthSecretRuntime,
  isProductionBuildPhase,
  resolveAuthSecret,
} from '@/lib/auth.config'

describe('auth secret resolution', () => {
  it('uses configured AUTH_SECRET when present', () => {
    const secret = resolveAuthSecret({ AUTH_SECRET: 'configured-secret', NODE_ENV: 'production' })
    expect(secret).toBe('configured-secret')
  })

  it('treats next production build as build phase', () => {
    expect(isProductionBuildPhase({ NODE_ENV: 'production', NEXT_PHASE: 'phase-production-build' })).toBe(true)
    expect(isProductionBuildPhase({ NODE_ENV: 'production', npm_lifecycle_event: 'build' })).toBe(true)
  })

  it('uses build fallback in production build phase when secret is missing', () => {
    const secret = resolveAuthSecret({ NODE_ENV: 'production', NEXT_PHASE: 'phase-production-build' })
    expect(secret).toBe('build-only-auth-secret-do-not-use-in-production')
  })

  it('throws in production runtime when secret is missing', () => {
    expect(() => resolveAuthSecret({ NODE_ENV: 'production' })).toThrow(AUTH_SECRET_MISSING_ERROR)
    expect(() => assertAuthSecretRuntime({ NODE_ENV: 'production' })).toThrow(AUTH_SECRET_MISSING_ERROR)
  })

  it('allows runtime assertion during build phase without secret', () => {
    expect(() =>
      assertAuthSecretRuntime({ NODE_ENV: 'production', NEXT_PHASE: 'phase-production-build' })
    ).not.toThrow()
  })
})
