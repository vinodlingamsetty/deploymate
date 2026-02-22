import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  verifyOtaTokenMock,
  releaseFindUniqueMock,
  membershipFindUniqueMock,
  userFindUniqueMock,
} = vi.hoisted(() => ({
  verifyOtaTokenMock: vi.fn(),
  releaseFindUniqueMock: vi.fn(),
  membershipFindUniqueMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
}))

vi.mock('@/lib/ota-token', () => ({
  verifyOtaToken: verifyOtaTokenMock,
}))

vi.mock('@/lib/db', () => ({
  db: {
    release: {
      findUnique: releaseFindUniqueMock,
    },
    membership: {
      findUnique: membershipFindUniqueMock,
    },
    user: {
      findUnique: userFindUniqueMock,
    },
  },
}))

import { GET } from '@/app/api/v1/releases/[id]/ota-diagnostics/route'

describe('GET /api/v1/releases/:id/ota-diagnostics', () => {
  const env = process.env as Record<string, string | undefined>

  beforeEach(() => {
    verifyOtaTokenMock.mockReset()
    releaseFindUniqueMock.mockReset()
    membershipFindUniqueMock.mockReset()
    userFindUniqueMock.mockReset()
    delete env.APP_URL
    delete env.NODE_ENV
  })

  it('returns 401 when token is missing', async () => {
    const res = await GET(
      new Request('https://deploymate.example.com/api/v1/releases/rel_1/ota-diagnostics'),
      { params: { id: 'rel_1' } },
    )

    expect(res.status).toBe(401)
    const body = await res.json() as { ok: boolean; checks: Array<{ message: string }> }
    expect(body.ok).toBe(false)
    expect(body.checks[0]?.message).toContain('Invalid or expired OTA token')
  })

  it('returns ok=true for valid Ad Hoc iOS OTA configuration', async () => {
    verifyOtaTokenMock.mockReturnValue('public-install')
    releaseFindUniqueMock.mockResolvedValue({
      id: 'rel_1',
      buildNumber: '42',
      extractedBundleId: 'com.example.app',
      signingType: 'adhoc',
      provisioningExpiry: new Date('2030-01-01T00:00:00Z'),
      app: {
        platform: 'IOS',
        bundleId: 'com.example.app',
        orgId: 'org_1',
      },
    })

    const res = await GET(
      new Request('https://deploymate.example.com/api/v1/releases/rel_1/ota-diagnostics?token=signed-token', {
        headers: {
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'deploymate.example.com',
        },
      }),
      { params: { id: 'rel_1' } },
    )

    expect(res.status).toBe(200)
    const body = await res.json() as {
      ok: boolean
      checks: Array<{ status: 'pass' | 'warn' | 'fail' }>
      resolved: { originSource: string | null; manifestUrl: string | null }
    }
    expect(body.ok).toBe(true)
    expect(body.checks.some((check) => check.status === 'fail')).toBe(false)
    expect(body.resolved.originSource).toBe('request')
    expect(body.resolved.manifestUrl).toContain('/api/v1/releases/rel_1/manifest?token=signed-token')
  })

  it('returns signing failure for development signed builds', async () => {
    verifyOtaTokenMock.mockReturnValue('public-install')
    releaseFindUniqueMock.mockResolvedValue({
      id: 'rel_1',
      buildNumber: '42',
      extractedBundleId: 'com.example.app',
      signingType: 'development',
      provisioningExpiry: new Date('2030-01-01T00:00:00Z'),
      app: {
        platform: 'IOS',
        bundleId: 'com.example.app',
        orgId: 'org_1',
      },
    })

    const res = await GET(
      new Request('https://deploymate.example.com/api/v1/releases/rel_1/ota-diagnostics?token=signed-token'),
      { params: { id: 'rel_1' } },
    )

    const body = await res.json() as { ok: boolean; checks: Array<{ key: string; message: string }> }
    expect(body.ok).toBe(false)
    const signingCheck = body.checks.find((check) => check.key === 'signing')
    expect(signingCheck?.message).toContain('Development-signed builds are not supported')
  })

  it('returns provisioning failure for expired profile', async () => {
    verifyOtaTokenMock.mockReturnValue('public-install')
    releaseFindUniqueMock.mockResolvedValue({
      id: 'rel_1',
      buildNumber: '42',
      extractedBundleId: 'com.example.app',
      signingType: 'adhoc',
      provisioningExpiry: new Date('2020-01-01T00:00:00Z'),
      app: {
        platform: 'IOS',
        bundleId: 'com.example.app',
        orgId: 'org_1',
      },
    })

    const res = await GET(
      new Request('https://deploymate.example.com/api/v1/releases/rel_1/ota-diagnostics?token=signed-token'),
      { params: { id: 'rel_1' } },
    )

    const body = await res.json() as { ok: boolean; checks: Array<{ key: string; status: string }> }
    expect(body.ok).toBe(false)
    expect(
      body.checks.find((check) => check.key === 'provisioning-expiry' && check.status === 'fail'),
    ).toBeTruthy()
  })

  it('returns origin host failure for private host in production', async () => {
    env.NODE_ENV = 'production'
    verifyOtaTokenMock.mockReturnValue('public-install')
    releaseFindUniqueMock.mockResolvedValue({
      id: 'rel_1',
      buildNumber: '42',
      extractedBundleId: 'com.example.app',
      signingType: 'adhoc',
      provisioningExpiry: new Date('2030-01-01T00:00:00Z'),
      app: {
        platform: 'IOS',
        bundleId: 'com.example.app',
        orgId: 'org_1',
      },
    })

    const res = await GET(
      new Request('https://deploymate.example.com/api/v1/releases/rel_1/ota-diagnostics?token=signed-token', {
        headers: {
          'x-forwarded-proto': 'https',
          'x-forwarded-host': '192.168.1.15',
        },
      }),
      { params: { id: 'rel_1' } },
    )

    const body = await res.json() as { ok: boolean; checks: Array<{ key: string; status: string }> }
    expect(body.ok).toBe(false)
    expect(body.checks.find((check) => check.key === 'origin-host' && check.status === 'fail')).toBeTruthy()
  })
})
