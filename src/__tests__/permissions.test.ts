import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Role } from '@prisma/client'

// Mock @/lib/db — Vitest intercepts dynamic imports too
vi.mock('@/lib/db', () => ({
  db: {
    app: { findUnique: vi.fn() },
    membership: { findUnique: vi.fn() },
    appMembership: { findUnique: vi.fn() },
  },
  isPrismaError: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { requireAppAccess, requireAppRole } from '@/lib/permissions'
import { db } from '@/lib/db'

// Use unknown cast to satisfy TypeScript when mocking the Prisma client
const mockDb = db as unknown as {
  app: { findUnique: ReturnType<typeof vi.fn> }
  membership: { findUnique: ReturnType<typeof vi.fn> }
  appMembership: { findUnique: ReturnType<typeof vi.fn> }
}

const FAKE_APP = {
  id: 'app-1',
  orgId: 'org-1',
  name: 'Test App',
  platform: 'IOS',
  bundleId: 'com.test.app',
  iconUrl: null,
  iconKey: null,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const FAKE_MEMBERSHIP = (role: Role) => ({
  id: 'mem-1',
  userId: 'user-1',
  orgId: 'org-1',
  role,
  createdAt: new Date(),
  updatedAt: new Date(),
})

beforeEach(() => {
  vi.clearAllMocks()
})

// ── requireAppAccess ──────────────────────────────────────────────────────────

describe('requireAppAccess', () => {
  it('returns app and membership for an org member', async () => {
    mockDb.app.findUnique.mockResolvedValue(FAKE_APP)
    mockDb.membership.findUnique.mockResolvedValue(FAKE_MEMBERSHIP(Role.TESTER))

    const result = await requireAppAccess('app-1', 'user-1')

    expect(result).not.toHaveProperty('error')
    const ok = result as { app: typeof FAKE_APP; membership: ReturnType<typeof FAKE_MEMBERSHIP> }
    expect(ok.app.id).toBe('app-1')
    expect(ok.membership.role).toBe(Role.TESTER)
  })

  it('returns 404 when the app does not exist', async () => {
    mockDb.app.findUnique.mockResolvedValue(null)

    const result = await requireAppAccess('missing-app', 'user-1')

    expect(result).toHaveProperty('error')
    const err = result as { error: Response }
    const body = await err.error.json() as { error: { code: string } }
    expect(body.error.code).toBe('NOT_FOUND')
    expect(err.error.status).toBe(404)
  })

  it('returns 403 when the user is not an org member', async () => {
    mockDb.app.findUnique.mockResolvedValue(FAKE_APP)
    mockDb.membership.findUnique.mockResolvedValue(null)

    const result = await requireAppAccess('app-1', 'outsider')

    expect(result).toHaveProperty('error')
    const err = result as { error: Response }
    expect(err.error.status).toBe(403)
  })
})

// ── requireAppRole ────────────────────────────────────────────────────────────

describe('requireAppRole', () => {
  it('super-admin bypasses org check (membership may be null)', async () => {
    mockDb.app.findUnique.mockResolvedValue(FAKE_APP)
    mockDb.membership.findUnique.mockResolvedValue(null) // not a member

    const result = await requireAppRole('app-1', 'super-user', Role.ADMIN, true)

    expect(result).not.toHaveProperty('error')
    const ok = result as { app: typeof FAKE_APP; membership: null }
    expect(ok.app.id).toBe('app-1')
    expect(ok.membership).toBeNull()
  })

  it('super-admin still gets 404 when app is missing', async () => {
    mockDb.app.findUnique.mockResolvedValue(null)

    const result = await requireAppRole('missing', 'super-user', Role.ADMIN, true)

    expect(result).toHaveProperty('error')
    const err = result as { error: Response }
    expect(err.error.status).toBe(404)
  })

  it('passes when user has exactly the minimum required role', async () => {
    mockDb.app.findUnique.mockResolvedValue(FAKE_APP)
    mockDb.membership.findUnique.mockResolvedValue(FAKE_MEMBERSHIP(Role.MANAGER))
    mockDb.appMembership.findUnique.mockResolvedValue(null)

    const result = await requireAppRole('app-1', 'user-1', Role.MANAGER, false)

    expect(result).not.toHaveProperty('error')
  })

  it('returns 403 when user role is below the minimum', async () => {
    mockDb.app.findUnique.mockResolvedValue(FAKE_APP)
    mockDb.membership.findUnique.mockResolvedValue(FAKE_MEMBERSHIP(Role.TESTER))
    mockDb.appMembership.findUnique.mockResolvedValue(null)

    const result = await requireAppRole('app-1', 'user-1', Role.MANAGER, false)

    expect(result).toHaveProperty('error')
    const err = result as { error: Response }
    expect(err.error.status).toBe(403)
  })

  it('AppMembership override trumps org role (TESTER org + ADMIN app override passes MANAGER check)', async () => {
    mockDb.app.findUnique.mockResolvedValue(FAKE_APP)
    mockDb.membership.findUnique.mockResolvedValue(FAKE_MEMBERSHIP(Role.TESTER))
    mockDb.appMembership.findUnique.mockResolvedValue({ appId: 'app-1', userId: 'user-1', role: Role.ADMIN })

    const result = await requireAppRole('app-1', 'user-1', Role.MANAGER, false)

    expect(result).not.toHaveProperty('error')
  })

  it('returns 403 when user has no org membership at all', async () => {
    mockDb.app.findUnique.mockResolvedValue(FAKE_APP)
    mockDb.membership.findUnique.mockResolvedValue(null)

    const result = await requireAppRole('app-1', 'user-1', Role.TESTER, false)

    expect(result).toHaveProperty('error')
    const err = result as { error: Response }
    expect(err.error.status).toBe(403)
  })
})
