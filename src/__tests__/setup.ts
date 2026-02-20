/**
 * Integration test setup.
 * - Loads .env.test when DATABASE_URL is not set in the environment
 * - Creates a shared PrismaClient for test use
 * - Verifies DB connectivity before the test suite runs
 * - Truncates all tables before each test for isolation
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient, type User, Role, type Organization, type Membership } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Load .env.test if DATABASE_URL is not already set
if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), '.env.test') })
}

// Ensure AUTH_SECRET is always set for integration tests
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = 'integration-test-secret-32-chars-min'
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const testDb = new PrismaClient({ adapter })

// Tables in leaf-first order so FK constraints are satisfied by CASCADE
const TRUNCATE_ORDER = [
  'AuditLog',
  'DownloadLog',
  'Feedback',
  'ReleaseGroup',
  'AppGroupMember',
  'OrgGroupMember',
  'OrgGroupApp',
  'AppDistGroup',
  'OrgDistGroup',
  'AppMembership',
  'Release',
  'App',
  'ApiToken',
  'Invitation',
  'VerificationToken',
  'Membership',
  'User',
  'Organization',
]

beforeAll(async () => {
  // Verify connectivity
  await testDb.$queryRawUnsafe('SELECT 1')
})

afterAll(async () => {
  await testDb.$disconnect()
})

beforeEach(async () => {
  // Truncate all tables in order, restarting sequences for clean IDs
  for (const table of TRUNCATE_ORDER) {
    await testDb.$executeRawUnsafe(
      `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`
    )
  }
})

// ── Test Helper Factories ────────────────────────────────────────────────────

export interface TestUserOverrides {
  email?: string
  firstName?: string
  lastName?: string
  passwordHash?: string
  isSuperAdmin?: boolean
}

/**
 * Create a test user with a bcrypt-like placeholder hash.
 * Use `isSuperAdmin: true` to create a super-admin.
 */
export async function createTestUser(overrides: TestUserOverrides = {}): Promise<User> {
  const { hashPassword } = await import('@/lib/auth-utils')
  const passwordHash = overrides.passwordHash ?? (await hashPassword('TestPass1!'))

  return testDb.user.create({
    data: {
      email: overrides.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? 'User',
      passwordHash,
      isSuperAdmin: overrides.isSuperAdmin ?? false,
    },
  })
}

/**
 * Create an organization and add the given user as a member.
 */
export async function createTestOrg(
  userId: string,
  role: Role = Role.ADMIN,
): Promise<{ org: Organization; membership: Membership }> {
  const slug = `test-org-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const org = await testDb.organization.create({
    data: { name: `Test Org ${slug}`, slug },
  })

  const membership = await testDb.membership.create({
    data: { userId, orgId: org.id, role },
  })

  return { org, membership }
}

/**
 * Create a hashed API token in the database and return the raw token string
 * (the value the caller would send as `Bearer dm_...`).
 */
export async function createTestApiToken(
  userId: string,
  permissions = ['READ'],
): Promise<string> {
  const { generateApiToken } = await import('@/lib/api-token')
  const { token, prefix, hash } = generateApiToken()

  await testDb.apiToken.create({
    data: {
      userId,
      name: `Test token ${Date.now()}`,
      tokenHash: hash,
      tokenPrefix: prefix,
      permissions: permissions as never,
    },
  })

  return token
}
