import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authenticateRequestMock } = vi.hoisted(() => ({
  authenticateRequestMock: vi.fn(),
}))

vi.mock('@/lib/auth-utils', () => ({
  authenticateRequest: authenticateRequestMock,
}))

import { POST as uploadUrlPost } from '@/app/api/v1/apps/[id]/releases/upload-url/route'
import {
  GET as listReleasesGet,
  POST as createReleasePost,
} from '@/app/api/v1/apps/[id]/releases/route'

const tokenUser = {
  id: 'user_1',
  email: 'user@example.com',
  isSuperAdmin: false,
}

describe('Release API token permissions', () => {
  beforeEach(() => {
    authenticateRequestMock.mockReset()
  })

  it('upload-url rejects read-only tokens', async () => {
    authenticateRequestMock.mockResolvedValue({
      authenticated: true,
      authType: 'token',
      tokenPermissions: ['READ'],
      user: tokenUser,
    })

    const res = await uploadUrlPost(
      new Request('http://localhost/api/v1/apps/app_1/releases/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'Example.ipa',
          fileSize: 1024,
          contentType: 'application/octet-stream',
        }),
      }),
      { params: { id: 'app_1' } },
    )

    const body = (await res.json()) as { error: { code: string; message: string } }
    expect(res.status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
    expect(body.error.message).toContain('WRITE')
  })

  it('create release rejects read-only tokens', async () => {
    authenticateRequestMock.mockResolvedValue({
      authenticated: true,
      authType: 'token',
      tokenPermissions: ['READ'],
      user: tokenUser,
    })

    const res = await createReleasePost(
      new Request('http://localhost/api/v1/apps/app_1/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileKey: 'releases/app_1/build.ipa',
          releaseType: 'BETA',
          releaseNotes: 'Test build',
        }),
      }),
      { params: { id: 'app_1' } },
    )

    const body = (await res.json()) as { error: { code: string; message: string } }
    expect(res.status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
    expect(body.error.message).toContain('WRITE')
  })

  it('list releases rejects token without READ permission', async () => {
    authenticateRequestMock.mockResolvedValue({
      authenticated: true,
      authType: 'token',
      tokenPermissions: [],
      user: tokenUser,
    })

    const res = await listReleasesGet(
      new Request('http://localhost/api/v1/apps/app_1/releases', {
        method: 'GET',
      }),
      { params: { id: 'app_1' } },
    )

    const body = (await res.json()) as { error: { code: string; message: string } }
    expect(res.status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
    expect(body.error.message).toContain('READ')
  })
})
