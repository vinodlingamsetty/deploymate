import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  authMock,
  generateOtaTokenMock,
  resolveOtaPublicOriginMock,
  releaseFindUniqueMock,
  membershipFindUniqueMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  generateOtaTokenMock: vi.fn(),
  resolveOtaPublicOriginMock: vi.fn(),
  releaseFindUniqueMock: vi.fn(),
  membershipFindUniqueMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: authMock,
}))

vi.mock('@/lib/ota-token', () => ({
  generateOtaToken: generateOtaTokenMock,
}))

vi.mock('@/lib/ota-origin', () => ({
  resolveOtaPublicOrigin: resolveOtaPublicOriginMock,
}))

vi.mock('@/lib/db', () => ({
  db: {
    release: {
      findUnique: releaseFindUniqueMock,
    },
    membership: {
      findUnique: membershipFindUniqueMock,
    },
  },
}))

import { POST } from '@/app/api/v1/releases/[id]/install-link/route'

describe('POST /api/v1/releases/:id/install-link', () => {
  beforeEach(() => {
    authMock.mockReset()
    generateOtaTokenMock.mockReset()
    resolveOtaPublicOriginMock.mockReset()
    releaseFindUniqueMock.mockReset()
    membershipFindUniqueMock.mockReset()

    generateOtaTokenMock.mockReturnValue('signed-token')
    resolveOtaPublicOriginMock.mockReturnValue({
      origin: 'https://deploymate.example.com',
      source: 'request',
    })
    delete process.env.OTA_LINK_TTL_SECONDS
  })

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null)

    const res = await POST(
      new Request('https://deploymate.example.com/api/v1/releases/rel_1/install-link', {
        method: 'POST',
      }),
      { params: { id: 'rel_1' } },
    )

    expect(res.status).toBe(401)
    const body = await res.json() as { error: { code: string } }
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 404 when release does not exist', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user_1', isSuperAdmin: false },
    })
    releaseFindUniqueMock.mockResolvedValue(null)

    const res = await POST(
      new Request('https://deploymate.example.com/api/v1/releases/rel_1/install-link', {
        method: 'POST',
      }),
      { params: { id: 'rel_1' } },
    )

    expect(res.status).toBe(404)
    const body = await res.json() as { error: { code: string } }
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('returns 403 when non-super-admin user has no org membership', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user_1', isSuperAdmin: false },
    })
    releaseFindUniqueMock.mockResolvedValue({
      id: 'rel_1',
      app: { id: 'app_1', name: 'Example App', orgId: 'org_1', platform: 'IOS' },
    })
    membershipFindUniqueMock.mockResolvedValue(null)

    const res = await POST(
      new Request('https://deploymate.example.com/api/v1/releases/rel_1/install-link', {
        method: 'POST',
      }),
      { params: { id: 'rel_1' } },
    )

    expect(res.status).toBe(403)
    const body = await res.json() as { error: { code: string } }
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('returns iOS itms-services URL and tokenized manifest URL', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user_1', isSuperAdmin: false },
    })
    releaseFindUniqueMock.mockResolvedValue({
      id: 'rel_1',
      app: { id: 'app_1', name: 'Example App', orgId: 'org_1', platform: 'IOS' },
    })
    membershipFindUniqueMock.mockResolvedValue({ userId: 'user_1' })

    const res = await POST(
      new Request('https://deploymate.example.com/api/v1/releases/rel_1/install-link', {
        method: 'POST',
      }),
      { params: { id: 'rel_1' } },
    )

    expect(res.status).toBe(200)
    const body = await res.json() as {
      data: { platform: string; installUrl: string; manifestUrl: string }
    }
    expect(body.data.platform).toBe('IOS')
    expect(body.data.manifestUrl).toContain('/api/v1/releases/rel_1/manifest?token=signed-token')
    expect(body.data.installUrl).toContain('itms-services://?action=download-manifest')
  })

  it('returns Android tokenized download URL', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user_1', isSuperAdmin: true },
    })
    releaseFindUniqueMock.mockResolvedValue({
      id: 'rel_android',
      app: { id: 'app_2', name: 'Android App', orgId: 'org_2', platform: 'ANDROID' },
    })

    const res = await POST(
      new Request('https://deploymate.example.com/api/v1/releases/rel_android/install-link', {
        method: 'POST',
      }),
      { params: { id: 'rel_android' } },
    )

    expect(res.status).toBe(200)
    const body = await res.json() as {
      data: { platform: string; downloadUrl: string }
    }
    expect(body.data.platform).toBe('ANDROID')
    expect(body.data.downloadUrl).toContain('/api/v1/releases/rel_android/download?token=signed-token')
  })

  it('clamps fractional TTL values to a minimum of 1 second', async () => {
    process.env.OTA_LINK_TTL_SECONDS = '0.5'
    authMock.mockResolvedValue({
      user: { id: 'user_1', isSuperAdmin: true },
    })
    releaseFindUniqueMock.mockResolvedValue({
      id: 'rel_1',
      app: { id: 'app_1', name: 'Example App', orgId: 'org_1', platform: 'IOS' },
    })

    const res = await POST(
      new Request('https://deploymate.example.com/api/v1/releases/rel_1/install-link', {
        method: 'POST',
      }),
      { params: { id: 'rel_1' } },
    )

    expect(res.status).toBe(200)
    expect(generateOtaTokenMock).toHaveBeenCalledWith('rel_1', 'user_1', 1)
    const body = await res.json() as {
      data: { ttlSeconds: number }
    }
    expect(body.data.ttlSeconds).toBe(1)
  })
})
