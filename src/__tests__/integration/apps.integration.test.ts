/**
 * Integration tests for GET/POST /api/v1/apps
 * Uses a real PostgreSQL test database (see .env.test).
 * Auth strategy: mock auth() to return null → authenticateRequest falls through to Bearer token.
 */

import { describe, it, expect, vi } from 'vitest'
import { testDb, createTestUser, createTestOrg, createTestApiToken } from '../setup'
import { Role, Platform } from '@prisma/client'

// Mock auth so the session path returns null — forces Bearer token auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}))

import { GET, POST } from '@/app/api/v1/apps/route'

function makeRequest(
  method: string,
  path: string,
  token: string,
  body?: Record<string, unknown>,
) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/v1/apps', () => {
  it('200: returns empty array when user has no orgs', async () => {
    const user = await createTestUser()
    const token = await createTestApiToken(user.id)

    const res = await GET(makeRequest('GET', '/api/v1/apps', token))
    const body = await res.json() as { data: unknown[] }

    expect(res.status).toBe(200)
    expect(body.data).toEqual([])
  })

  it('200: returns apps in the user\'s orgs', async () => {
    const user = await createTestUser()
    const { org } = await createTestOrg(user.id, Role.ADMIN)
    const token = await createTestApiToken(user.id)

    await testDb.app.create({
      data: { name: 'My App', platform: Platform.IOS, orgId: org.id },
    })

    const res = await GET(makeRequest('GET', '/api/v1/apps', token))
    const body = await res.json() as { data: Array<{ name: string }> }

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].name).toBe('My App')
  })

  it('200: does NOT return apps from orgs the user is not in', async () => {
    const user = await createTestUser()
    const otherUser = await createTestUser()
    const { org: otherOrg } = await createTestOrg(otherUser.id, Role.ADMIN)
    const token = await createTestApiToken(user.id)

    await testDb.app.create({
      data: { name: 'Other App', platform: Platform.ANDROID, orgId: otherOrg.id },
    })

    const res = await GET(makeRequest('GET', '/api/v1/apps', token))
    const body = await res.json() as { data: unknown[] }

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(0)
  })

  it('401: returns UNAUTHORIZED without auth', async () => {
    const res = await GET(
      new Request('http://localhost/api/v1/apps', { method: 'GET' })
    )
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('POST /api/v1/apps', () => {
  it('201: ADMIN creates an app successfully', async () => {
    const user = await createTestUser()
    const { org } = await createTestOrg(user.id, Role.ADMIN)
    const token = await createTestApiToken(user.id, ['READ', 'WRITE'])

    const res = await POST(
      makeRequest('POST', '/api/v1/apps', token, {
        name: 'New App',
        platform: 'IOS',
        orgId: org.id,
      })
    )
    const body = await res.json() as { data: { name: string; platform: string } }

    expect(res.status).toBe(201)
    expect(body.data.name).toBe('New App')
    expect(body.data.platform).toBe('IOS')
  })

  it('403: TESTER cannot create an app', async () => {
    const user = await createTestUser()
    const { org } = await createTestOrg(user.id, Role.TESTER)
    const token = await createTestApiToken(user.id, ['READ', 'WRITE'])

    const res = await POST(
      makeRequest('POST', '/api/v1/apps', token, {
        name: 'Blocked App',
        platform: 'IOS',
        orgId: org.id,
      })
    )
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('409: duplicate bundleId in the same org returns CONFLICT', async () => {
    const user = await createTestUser()
    const { org } = await createTestOrg(user.id, Role.ADMIN)
    const token = await createTestApiToken(user.id, ['READ', 'WRITE'])

    const appBody = { name: 'App A', platform: 'IOS', orgId: org.id, bundleId: 'com.test.app' }

    await POST(makeRequest('POST', '/api/v1/apps', token, appBody))
    const res = await POST(makeRequest('POST', '/api/v1/apps', token, appBody))
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(409)
    expect(body.error.code).toBe('CONFLICT')
  })

  it('400: invalid platform returns VALIDATION_ERROR', async () => {
    const user = await createTestUser()
    const { org } = await createTestOrg(user.id, Role.ADMIN)
    const token = await createTestApiToken(user.id, ['READ', 'WRITE'])

    const res = await POST(
      makeRequest('POST', '/api/v1/apps', token, {
        name: 'App',
        platform: 'WINDOWS',
        orgId: org.id,
      })
    )
    const body = await res.json() as { error: { code: string } }

    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })
})
