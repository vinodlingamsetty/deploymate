import { describe, expect, it } from 'vitest'

import {
  buildItmsServicesUrl,
  buildManifestUrl,
  resolveClientOtaBaseUrl,
} from '@/lib/ota-client'

describe('resolveClientOtaBaseUrl', () => {
  it('prefers browser origin when it is HTTPS', () => {
    const result = resolveClientOtaBaseUrl('https://browser.example.com', 'https://env.example.com')
    expect(result).toBe('https://browser.example.com')
  })

  it('falls back to env URL when browser origin is not HTTPS', () => {
    const result = resolveClientOtaBaseUrl('http://localhost:3000', 'https://env.example.com')
    expect(result).toBe('https://env.example.com')
  })

  it('returns null when no valid HTTPS URL is available', () => {
    const result = resolveClientOtaBaseUrl('http://localhost:3000', 'not-a-url')
    expect(result).toBeNull()
  })
})

describe('OTA URL builders', () => {
  it('builds a tokenized manifest URL', () => {
    const url = buildManifestUrl('https://deploymate.example.com', 'rel_1', 'token-value')
    expect(url).toBe(
      'https://deploymate.example.com/api/v1/releases/rel_1/manifest?token=token-value',
    )
  })

  it('builds itms-services URL from manifest URL', () => {
    const manifestUrl = 'https://deploymate.example.com/api/v1/releases/rel_1/manifest?token=abc'
    const otaUrl = buildItmsServicesUrl(manifestUrl)
    expect(otaUrl).toBe(
      'itms-services://?action=download-manifest&url=https%3A%2F%2Fdeploymate.example.com%2Fapi%2Fv1%2Freleases%2Frel_1%2Fmanifest%3Ftoken%3Dabc',
    )
  })
})

