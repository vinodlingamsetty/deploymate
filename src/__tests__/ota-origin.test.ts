import { afterEach, describe, expect, it } from 'vitest'

import { resolveOtaPublicOrigin } from '@/lib/ota-origin'

describe('resolveOtaPublicOrigin', () => {
  const env = process.env as Record<string, string | undefined>

  afterEach(() => {
    delete env.APP_URL
    delete env.NODE_ENV
  })

  it('uses APP_URL when provided', () => {
    env.APP_URL = 'https://deploymate.example.com/path'

    const result = resolveOtaPublicOrigin(
      new Request('http://localhost:3000/api/v1/releases/r1/manifest'),
    )

    expect(result).toEqual({ origin: 'https://deploymate.example.com' })
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

    expect(result).toEqual({ origin: 'https://pull-beside-signed-objects.trycloudflare.com' })
  })

  it('returns an error when APP_URL is invalid', () => {
    env.APP_URL = 'not-a-url'
    const result = resolveOtaPublicOrigin(
      new Request('http://localhost:3000/api/v1/releases/r1/manifest'),
    )

    expect(result).toEqual({ error: 'APP_URL is not a valid URL' })
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
