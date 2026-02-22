import { beforeEach, describe, expect, it, vi } from 'vitest'

const { verifyOtaTokenMock, releaseFindUniqueMock } = vi.hoisted(() => ({
  verifyOtaTokenMock: vi.fn(),
  releaseFindUniqueMock: vi.fn(),
}))

vi.mock('@/lib/ota-token', () => ({
  verifyOtaToken: verifyOtaTokenMock,
}))

vi.mock('@/lib/db', () => ({
  db: {
    release: {
      findUnique: releaseFindUniqueMock,
    },
  },
}))

import { GET } from '@/app/api/v1/releases/[id]/manifest/route'

describe('GET /api/v1/releases/:id/manifest', () => {
  const env = process.env as Record<string, string | undefined>

  beforeEach(() => {
    verifyOtaTokenMock.mockReset()
    releaseFindUniqueMock.mockReset()
    delete env.APP_URL
    delete env.NODE_ENV
  })

  it('returns plain-text 403 when token is missing', async () => {
    const res = await GET(
      new Request('https://deploymate.example.com/api/v1/releases/rel_1/manifest'),
      { params: { id: 'rel_1' } },
    )

    expect(res.status).toBe(403)
    expect(res.headers.get('content-type')).toContain('text/plain')
    expect(await res.text()).toContain('Invalid or expired OTA token')
  })

  it('returns plain-text 403 when token is invalid', async () => {
    verifyOtaTokenMock.mockReturnValue(null)

    const res = await GET(
      new Request('https://deploymate.example.com/api/v1/releases/rel_1/manifest?token=bad'),
      { params: { id: 'rel_1' } },
    )

    expect(res.status).toBe(403)
    expect(res.headers.get('content-type')).toContain('text/plain')
    expect(await res.text()).toContain('Invalid or expired OTA token')
  })

  it('returns XML plist with tokenized download URL for valid public-install token', async () => {
    verifyOtaTokenMock.mockReturnValue('public-install')
    releaseFindUniqueMock.mockResolvedValue({
      id: 'rel_1',
      version: '2.1.0',
      extractedBundleId: 'com.example.app',
      app: {
        name: 'Example App',
        bundleId: 'com.example.app',
        orgId: 'org_1',
      },
    })

    const token = 'signed-token'
    const res = await GET(
      new Request(`https://deploymate.example.com/api/v1/releases/rel_1/manifest?token=${token}`),
      { params: { id: 'rel_1' } },
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/xml')
    const body = await res.text()
    expect(body).toContain('<string>software-package</string>')
    expect(body).toContain(
      'https://deploymate.example.com/api/v1/releases/rel_1/download?token=signed-token',
    )
  })
})
