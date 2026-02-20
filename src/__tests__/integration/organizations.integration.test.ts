/**
 * Integration tests for GET/POST /api/v1/organizations
 * Uses a real PostgreSQL test database (see .env.test).
 * Auth strategy: mock auth() per-test with a session that maps to a real DB user.
 */

import { describe, it, expect, vi } from 'vitest'
import { createTestUser, createTestOrg } from '../setup'
import { Role } from '@prisma/client'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { GET, POST } from '@/app/api/v1/organizations/route'
import { auth } from '@/lib/auth'

const mockAuth = vi.mocked(auth)

function makeSession(userId: string, email: string, isSuperAdmin = false) {
  return {
    user: { id: userId, email, isSuperAdmin, name: null, image: null },
    expires: new Date(Date.now() + 3600_000).toISOString(),
  }
}

describe('GET /api/v1/organizations', () => {
  it('200: returns orgs the user belongs to with role', async () => {
    const user = await createTestUser()
    const { org } = await createTestOrg(user.id, Role.ADMIN)
    mockAuth.mockResolvedValue(makeSession(user.id, user.email) as never)

    const res = await GET()
    const body = await res.json() as { data: Array<{ id: string; role: string }> }

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe(org.id)
    expect(body.data[0].role).toBe(Role.ADMIN)
  })

  it('200: returns empty array when user has no memberships', async () => {
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

describe('POST /api/v1/organizations', () => {
  function makePostRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/v1/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as import('next/server').NextRequest
  }

  it('201: super-admin creates org and auto-generates slug', async () => {
    const user = await createTestUser({ isSuperAdmin: true })
    mockAuth.mockResolvedValue(makeSession(user.id, user.email, true) as never)

    const res = await POST(makePostRequest({ name: 'Test Org Alpha' }))
    const body = await res.json() as { data: { name: string; slug: string } }

    expect(res.status).toBe(201)
    expect(body.data.name).toBe('Test Org Alpha')
    expect(typeof body.data.slug).toBe('string')
    expect(body.data.slug.length).toBeGreaterThan(0)
  })

  it('403: non-super-admin cannot create org', async () => {
    const user = await createTestUser()
    mockAuth.mockResolvedValue(makeSession(user.id, user.email, false) as never)

    const res = await POST(makePostRequest({ name: 'Sneaky Org' }))
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('409: duplicate slug returns CONFLICT', async () => {
    const user = await createTestUser({ isSuperAdmin: true })
    mockAuth.mockResolvedValue(makeSession(user.id, user.email, true) as never)

    await POST(makePostRequest({ name: 'Dup Org', slug: 'dup-slug' }))
    const res = await POST(makePostRequest({ name: 'Another Org', slug: 'dup-slug' }))
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(409)
    expect(body.error.code).toBe('CONFLICT')
  })
})
