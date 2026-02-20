/**
 * Idempotent demo seed script.
 * Run with: pnpm db:seed  (or: npx tsx prisma/seed.ts)
 *
 * Creates a predictable demo dataset for local development and demos.
 * Uses upsert throughout so re-runs are safe.
 */

import { PrismaClient, Role, Platform, ReleaseType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from '@node-rs/argon2'

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding demo data...')

  // ── Passwords ────────────────────────────────────────────────────────────────
  const adminHash = await hash('Admin1234!', ARGON2_OPTIONS)
  const userHash = await hash('User1234!', ARGON2_OPTIONS)

  // ── Users (5) ────────────────────────────────────────────────────────────────
  const adminUser = await db.user.upsert({
    where: { email: 'admin@acme.com' },
    create: {
      email: 'admin@acme.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'User',
      isSuperAdmin: true,
    },
    update: {},
  })

  const alice = await db.user.upsert({
    where: { email: 'alice@acme.com' },
    create: {
      email: 'alice@acme.com',
      passwordHash: userHash,
      firstName: 'Alice',
      lastName: 'Smith',
      isSuperAdmin: false,
    },
    update: {},
  })

  const bob = await db.user.upsert({
    where: { email: 'bob@acme.com' },
    create: {
      email: 'bob@acme.com',
      passwordHash: userHash,
      firstName: 'Bob',
      lastName: 'Jones',
      isSuperAdmin: false,
    },
    update: {},
  })

  const carol = await db.user.upsert({
    where: { email: 'carol@globex.com' },
    create: {
      email: 'carol@globex.com',
      passwordHash: userHash,
      firstName: 'Carol',
      lastName: 'Taylor',
      isSuperAdmin: false,
    },
    update: {},
  })

  const dave = await db.user.upsert({
    where: { email: 'dave@globex.com' },
    create: {
      email: 'dave@globex.com',
      passwordHash: userHash,
      firstName: 'Dave',
      lastName: 'Wilson',
      isSuperAdmin: false,
    },
    update: {},
  })

  console.log('  ✓ Users')

  // ── Organizations (2) ────────────────────────────────────────────────────────
  const acme = await db.organization.upsert({
    where: { slug: 'acme' },
    create: { name: 'Acme Mobile', slug: 'acme' },
    update: {},
  })

  const globex = await db.organization.upsert({
    where: { slug: 'globex' },
    create: { name: 'Globex Labs', slug: 'globex' },
    update: {},
  })

  console.log('  ✓ Organizations')

  // ── Memberships ──────────────────────────────────────────────────────────────
  // admin is ADMIN in both orgs
  for (const org of [acme, globex]) {
    await db.membership.upsert({
      where: { userId_orgId: { userId: adminUser.id, orgId: org.id } },
      create: { userId: adminUser.id, orgId: org.id, role: Role.ADMIN },
      update: {},
    })
  }

  // alice = ADMIN in acme
  await db.membership.upsert({
    where: { userId_orgId: { userId: alice.id, orgId: acme.id } },
    create: { userId: alice.id, orgId: acme.id, role: Role.ADMIN },
    update: {},
  })

  // bob = MANAGER in acme
  await db.membership.upsert({
    where: { userId_orgId: { userId: bob.id, orgId: acme.id } },
    create: { userId: bob.id, orgId: acme.id, role: Role.MANAGER },
    update: {},
  })

  // carol = ADMIN in globex
  await db.membership.upsert({
    where: { userId_orgId: { userId: carol.id, orgId: globex.id } },
    create: { userId: carol.id, orgId: globex.id, role: Role.ADMIN },
    update: {},
  })

  // dave = TESTER in globex
  await db.membership.upsert({
    where: { userId_orgId: { userId: dave.id, orgId: globex.id } },
    create: { userId: dave.id, orgId: globex.id, role: Role.TESTER },
    update: {},
  })

  console.log('  ✓ Memberships')

  // ── Apps (5) ─────────────────────────────────────────────────────────────────
  // Acme: 2 iOS + 1 Android
  const acmeIosApp = await db.app.upsert({
    where: { orgId_bundleId: { orgId: acme.id, bundleId: 'com.acme.mobile' } },
    create: {
      name: 'Acme Mobile',
      bundleId: 'com.acme.mobile',
      platform: Platform.IOS,
      orgId: acme.id,
    },
    update: {},
  })

  const acmeIosApp2 = await db.app.upsert({
    where: { orgId_bundleId: { orgId: acme.id, bundleId: 'com.acme.dashboard' } },
    create: {
      name: 'Acme Dashboard',
      bundleId: 'com.acme.dashboard',
      platform: Platform.IOS,
      orgId: acme.id,
    },
    update: {},
  })

  const acmeAndroidApp = await db.app.upsert({
    where: { orgId_bundleId: { orgId: acme.id, bundleId: 'com.acme.android' } },
    create: {
      name: 'Acme Android',
      bundleId: 'com.acme.android',
      platform: Platform.ANDROID,
      orgId: acme.id,
    },
    update: {},
  })

  // Globex: 1 iOS + 1 Android
  const globexIosApp = await db.app.upsert({
    where: { orgId_bundleId: { orgId: globex.id, bundleId: 'com.globex.labs' } },
    create: {
      name: 'Globex Labs iOS',
      bundleId: 'com.globex.labs',
      platform: Platform.IOS,
      orgId: globex.id,
    },
    update: {},
  })

  const globexAndroidApp = await db.app.upsert({
    where: { orgId_bundleId: { orgId: globex.id, bundleId: 'com.globex.android' } },
    create: {
      name: 'Globex Android',
      bundleId: 'com.globex.android',
      platform: Platform.ANDROID,
      orgId: globex.id,
    },
    update: {},
  })

  console.log('  ✓ Apps')

  // ── Releases (2 per app = 10 total) ──────────────────────────────────────────
  const releaseSeeds: Array<{
    appId: string
    version: string
    buildNumber: string
    releaseType: ReleaseType
  }> = [
    { appId: acmeIosApp.id, version: '1.0.0', buildNumber: '100', releaseType: ReleaseType.BETA },
    { appId: acmeIosApp.id, version: '1.1.0', buildNumber: '110', releaseType: ReleaseType.RELEASE_CANDIDATE },
    { appId: acmeIosApp2.id, version: '2.0.0', buildNumber: '200', releaseType: ReleaseType.ALPHA },
    { appId: acmeIosApp2.id, version: '2.1.0', buildNumber: '210', releaseType: ReleaseType.BETA },
    { appId: acmeAndroidApp.id, version: '1.0.0', buildNumber: '10', releaseType: ReleaseType.BETA },
    { appId: acmeAndroidApp.id, version: '1.2.0', buildNumber: '12', releaseType: ReleaseType.RELEASE_CANDIDATE },
    { appId: globexIosApp.id, version: '3.0.0', buildNumber: '300', releaseType: ReleaseType.ALPHA },
    { appId: globexIosApp.id, version: '3.1.0', buildNumber: '310', releaseType: ReleaseType.BETA },
    { appId: globexAndroidApp.id, version: '1.0.0', buildNumber: '1', releaseType: ReleaseType.BETA },
    { appId: globexAndroidApp.id, version: '1.0.1', buildNumber: '2', releaseType: ReleaseType.RELEASE_CANDIDATE },
  ]

  for (const seed of releaseSeeds) {
    await db.release.upsert({
      where: {
        appId_version_buildNumber: {
          appId: seed.appId,
          version: seed.version,
          buildNumber: seed.buildNumber,
        },
      },
      create: {
        appId: seed.appId,
        version: seed.version,
        buildNumber: seed.buildNumber,
        releaseType: seed.releaseType,
        fileKey: `demo/${seed.appId}/${seed.version}.bin`,
        fileSize: 1024 * 1024 * 10, // 10 MB dummy
        fileName: `app-${seed.version}.bin`,
        status: 'READY',
      },
      update: {},
    })
  }

  console.log('  ✓ Releases')
  console.log('')
  console.log('✅ Seed complete!')
  console.log('')
  console.log('Demo credentials:')
  console.log('  admin@acme.com   / Admin1234!  (SuperAdmin)')
  console.log('  alice@acme.com   / User1234!   (Acme Admin)')
  console.log('  bob@acme.com     / User1234!   (Acme Manager)')
  console.log('  carol@globex.com / User1234!   (Globex Admin)')
  console.log('  dave@globex.com  / User1234!   (Globex Tester)')
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
