import { afterEach, describe, expect, it } from 'vitest'

import { resolveOtaPublicOrigin } from '@/lib/ota-origin'

describe('resolveOtaPublicOrigin', () => {
  const env = process.env as Record<string, string | undefined>

  afterEach(() => {
    delete env.APP_URL
    delete env.NODE_ENV
  })

  it('prefers request origin and reports mismatch when APP_URL differs', () => {
    env.APP_URL = 'https://deploymate.example.com/path'

    const result = resolveOtaPublicOrigin(
      new Request('http://localhost:3000/api/v1/releases/r1/manifest', {
        headers: {
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'ota-public.example.org',
        },
      }),
    )

    expect(result).toEqual({
      origin: 'https://ota-public.example.org',
      source: 'request',
      requestOrigin: 'https://ota-public.example.org',
      appUrlOrigin: 'https://deploymate.example.com',
      mismatch: true,
    })
  })

  it('derives origin from forwarded headers', () => {
    const result = resolveOtaPublicOrigin(
      new Request('http://localhost:3000/api/v1/releases/r1/manifest', {
        headers: {
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'pull-beside-signed-objects.trycloudflare.com',
        },
      }),
    )

    expect(result).toEqual({
      origin: 'https://pull-beside-signed-objects.trycloudflare.com',
      source: 'request',
      requestOrigin: 'https://pull-beside-signed-objects.trycloudflare.com',
      appUrlOrigin: null,
      mismatch: false,
    })
  })

  it('falls back to APP_URL when request origin is non-HTTPS in production', () => {
    env.NODE_ENV = 'production'
    env.APP_URL = 'https://deploymate.example.com'

    const result = resolveOtaPublicOrigin(
      new Request('http://localhost:3000/api/v1/releases/r1/manifest'),
    )

    expect(result).toEqual({
      origin: 'https://deploymate.example.com',
      source: 'app_url',
      requestOrigin: 'http://localhost:3000',
      appUrlOrigin: 'https://deploymate.example.com',
      mismatch: true,
    })
  })

  it('ignores invalid APP_URL when request origin is valid', () => {
    env.APP_URL = 'not-a-url'
    const result = resolveOtaPublicOrigin(
      new Request('http://localhost:3000/api/v1/releases/r1/manifest', {
        headers: {
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'deploymate.example.com',
        },
      }),
    )

    expect(result).toEqual({
      origin: 'https://deploymate.example.com',
      source: 'request',
      requestOrigin: 'https://deploymate.example.com',
      appUrlOrigin: null,
      mismatch: false,
    })
  })

  it('enforces HTTPS in production', () => {
    env.NODE_ENV = 'production'
    env.APP_URL = 'http://deploymate.internal'

    const result = resolveOtaPublicOrigin(
      new Request('http://localhost:3000/api/v1/releases/r1/manifest'),
    )

    expect(result).toEqual({ error: 'APP_URL must use HTTPS for iOS OTA installs' })
  })
})
