import { authenticateRequest } from '@/lib/auth-utils'
import { requireApiPermission } from '@/lib/api-authz'
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from '@/lib/api-utils'
import {
  parsePagination,
  createAppSchema,
  appSortSchema,
  sortOrderSchema,
} from '@/lib/validations'
import { type Prisma } from '@prisma/client'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request)
  const { authenticated, user } = authResult
  if (!authenticated || !user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }
  const permissionError = requireApiPermission(authResult, 'READ')
  if (permissionError) return permissionError

  const { db } = await import('@/lib/db')
  const { searchParams } = new URL(request.url)

  const { page, limit } = parsePagination(searchParams)
  const sort = appSortSchema.parse(searchParams.get('sort') ?? undefined)
  const order = sortOrderSchema.parse(searchParams.get('order') ?? undefined)

  // Build where clause — only apps in orgs the user is a member of
  const where: Prisma.AppWhereInput = {
    organization: {
      memberships: { some: { userId: user.id } },
    },
  }

  // Optional filters
  const orgId = searchParams.get('orgId')
  if (orgId) {
    where.orgId = orgId
  }

  const platform = searchParams.get('platform')?.toUpperCase()
  if (platform === 'IOS' || platform === 'ANDROID') {
    where.platform = platform
  }

  const search = searchParams.get('search')
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { bundleId: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [apps, total] = await Promise.all([
    db.app.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        releases: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            version: true,
            buildNumber: true,
            releaseType: true,
            createdAt: true,
          },
        },
        _count: { select: { releases: true } },
      },
    }),
    db.app.count({ where }),
  ])

  const data = apps.map((app) => ({
    ...app,
    latestRelease: app.releases[0] ?? null,
    releaseCount: app._count.releases,
    releases: undefined,
    _count: undefined,
  }))

  return paginatedResponse(data, { page, limit, total })
}

export async function POST(request: Request) {
  const authResult = await authenticateRequest(request)
  const { authenticated, user } = authResult
  if (!authenticated || !user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }
  const permissionError = requireApiPermission(authResult, 'WRITE')
  if (permissionError) return permissionError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = createAppSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { name, platform, orgId, bundleId, description } = parsed.data
  const { db } = await import('@/lib/db')

  // Verify org exists
  const org = await db.organization.findUnique({ where: { id: orgId } })
  if (!org) {
    return errorResponse('NOT_FOUND', 'Organization not found', 404)
  }

  // Check ADMIN role (super-admins bypass)
  if (!user.isSuperAdmin) {
    const membership = await db.membership.findUnique({
      where: { userId_orgId: { userId: user.id, orgId } },
    })

    if (!membership) {
      return errorResponse('FORBIDDEN', 'You are not a member of this organization', 403)
    }

    if (membership.role !== 'ADMIN') {
      return errorResponse('FORBIDDEN', 'Admin role required to create apps', 403)
    }
  }

  try {
    const app = await db.app.create({
      data: {
        name,
        platform,
        orgId,
        bundleId: bundleId ?? null,
        description: description ?? null,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    })

    const { ipAddress, userAgent } = extractRequestMeta(request)
    void createAuditLog({
      userId: user.id,
      orgId,
      action: 'create',
      entityType: 'app',
      entityId: app.id,
      newValue: { name, platform, orgId, bundleId },
      ipAddress,
      userAgent,
    })

    return successResponse(app, 201)
  } catch (err: unknown) {
    const { Prisma } = await import('@prisma/client')
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return errorResponse(
        'CONFLICT',
        'An app with this bundle ID already exists in the organization',
        409,
      )
    }
    throw err
  }
}
