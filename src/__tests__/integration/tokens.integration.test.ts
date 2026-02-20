/**
 * Integration tests for GET/POST /api/v1/tokens
 * Uses a real PostgreSQL test database (see .env.test).
 * Auth strategy: mock auth() per-test with a session that maps to a real DB user.
 */

import { describe, it, expect, vi } from 'vitest'
import { createTestUser } from '../setup'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { GET, POST } from '@/app/api/v1/tokens/route'
import { auth } from '@/lib/auth'

const mockAuth = vi.mocked(auth)

function makeSession(userId: string, email: string) {
  return {
    user: { id: userId, email, isSuperAdmin: false, name: null, image: null },
    expires: new Date(Date.now() + 3600_000).toISOString(),
  }
}

function makePostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/v1/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as import('next/server').NextRequest
}

describe('GET /api/v1/tokens', () => {
  it('200: returns empty array for a new user with no tokens', async () => {
    const user = await createTestUser()
    mockAuth.mockResolvedValue(makeSession(user.id, user.email) as never)

    const res = await GET()
    const body = await res.json() as { data: unknown[] }

    expect(res.status).toBe(200)
    expect(body.data).toEqual([])
  })

  it('401: returns UNAUTHORIZED when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET()
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('POST /api/v1/tokens', () => {
  it('201: creates token, returns raw dm_... value once with Cache-Control: no-store', async () => {
    const user = await createTestUser()
    mockAuth.mockResolvedValue(makeSession(user.id, user.email) as never)

    const res = await POST(makePostRequest({ name: 'CI Token', permissions: ['READ'] }))
    const body = await res.json() as { data: { token: string; tokenPrefix: string } }

    expect(res.status).toBe(201)
    expect(body.data.token).toMatch(/^dm_[0-9a-f]{8}_[0-9a-f]+$/)
    expect(typeof body.data.tokenPrefix).toBe('string')
    expect(res.headers.get('Cache-Control')).toContain('no-store')
  })

  it('after create: GET lists the token but without the raw value', async () => {
    const user = await createTestUser()
    mockAuth.mockResolvedValue(makeSession(user.id, user.email) as never)

    await POST(makePostRequest({ name: 'List Test Token', permissions: ['READ'] }))

    const getRes = await GET()
    const getBody = await getRes.json() as { data: Array<Record<string, unknown>> }

    expect(getRes.status).toBe(200)
    expect(getBody.data).toHaveLength(1)
    expect(getBody.data[0].name).toBe('List Test Token')
    // Raw token must NOT appear in list response
    expect('token' in getBody.data[0]).toBe(false)
    expect(typeof getBody.data[0].tokenPrefix).toBe('string')
  })

  it('400: empty permissions array is rejected', async () => {
    const user = await createTestUser()
    mockAuth.mockResolvedValue(makeSession(user.id, user.email) as never)

    const res = await POST(makePostRequest({ name: 'Bad Token', permissions: [] }))
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('400: missing READ permission is rejected', async () => {
    const user = await createTestUser()
    mockAuth.mockResolvedValue(makeSession(user.id, user.email) as never)

    const res = await POST(makePostRequest({ name: 'Write Only', permissions: ['WRITE'] }))
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })
})
