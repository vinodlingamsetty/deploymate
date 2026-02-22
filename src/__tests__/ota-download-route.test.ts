import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  authMock,
  verifyOtaTokenMock,
  getBufferMock,
  releaseFindUniqueMock,
  releaseUpdateMock,
  transactionMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  verifyOtaTokenMock: vi.fn(),
  getBufferMock: vi.fn(),
  releaseFindUniqueMock: vi.fn(),
  releaseUpdateMock: vi.fn(),
  transactionMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: authMock,
}))

vi.mock('@/lib/ota-token', () => ({
  verifyOtaToken: verifyOtaTokenMock,
}))

vi.mock('@/lib/storage', () => ({
  getStorageAdapter: () => ({
    getBuffer: getBufferMock,
  }),
}))

vi.mock('@/lib/db', () => ({
  db: {
    release: {
      findUnique: releaseFindUniqueMock,
      update: releaseUpdateMock,
    },
    downloadLog: {
      create: vi.fn(),
    },
    $transaction: transactionMock,
  },
}))

import { GET, HEAD } from '@/app/api/v1/releases/[id]/download/route'

describe('GET /api/v1/releases/:id/download', () => {
  beforeEach(() => {
    authMock.mockReset()
    verifyOtaTokenMock.mockReset()
    getBufferMock.mockReset()
    releaseFindUniqueMock.mockReset()
    releaseUpdateMock.mockReset()
    transactionMock.mockReset()
  })

  it('omits Content-Disposition for iOS tokenized OTA download', async () => {
    verifyOtaTokenMock.mockReturnValue('public-install')
    getBufferMock.mockResolvedValue(Buffer.from('ipa-bytes'))
    releaseFindUniqueMock.mockResolvedValue({
      id: 'rel_ios',
      app: { platform: 'IOS', name: 'My App' },
      version: '1.2.3',
      fileKey: 'releases/app/1.2.3.ipa',
    })
    releaseUpdateMock.mockResolvedValue({ id: 'rel_ios' })

    const res = await GET(
      new Request('https://deploymate.example.com/api/v1/releases/rel_ios/download?token=ota-token'),
      { params: { id: 'rel_ios' } },
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/octet-stream')
    expect(res.headers.get('content-disposition')).toBeNull()
    expect(res.headers.get('accept-ranges')).toBe('bytes')
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('keeps Content-Disposition for non-iOS tokenized download', async () => {
    verifyOtaTokenMock.mockReturnValue('public-install')
    getBufferMock.mockResolvedValue(Buffer.from('apk-bytes'))
    releaseFindUniqueMock.mockResolvedValue({
      id: 'rel_android',
      app: { platform: 'ANDROID', name: 'My Droid App' },
      version: '2.0.0',
      fileKey: 'releases/app/2.0.0.apk',
    })
    releaseUpdateMock.mockResolvedValue({ id: 'rel_android' })

    const res = await GET(
      new Request('https://deploymate.example.com/api/v1/releases/rel_android/download?token=ota-token'),
      { params: { id: 'rel_android' } },
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/octet-stream')
    expect(res.headers.get('content-disposition')).toContain('attachment; filename=')
    expect(res.headers.get('accept-ranges')).toBeNull()
    expect(res.headers.get('cache-control')).toBeNull()
  })

  it('returns download headers for HEAD without incrementing download counts', async () => {
    verifyOtaTokenMock.mockReturnValue('public-install')
    getBufferMock.mockResolvedValue(Buffer.from('ipa-bytes'))
    releaseFindUniqueMock.mockResolvedValue({
      id: 'rel_ios',
      app: { platform: 'IOS', name: 'My App' },
      version: '1.2.3',
      fileKey: 'releases/app/1.2.3.ipa',
    })

    const res = await HEAD(
      new Request('https://deploymate.example.com/api/v1/releases/rel_ios/download?token=ota-token'),
      { params: { id: 'rel_ios' } },
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/octet-stream')
    expect(res.headers.get('content-disposition')).toBeNull()
    expect(res.headers.get('accept-ranges')).toBe('bytes')
    expect(releaseUpdateMock).not.toHaveBeenCalled()
    expect(transactionMock).not.toHaveBeenCalled()
    expect(await res.text()).toBe('')
  })
})
