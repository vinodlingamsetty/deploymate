import { authenticateRequest } from '@/lib/auth-utils'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { requireAppAccess, requireAppRole } from '@/lib/permissions'
import { updateAppSchema } from '@/lib/validations'
import { getStorageAdapter } from '@/lib/storage'

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { authenticated, user } = await authenticateRequest(request)
  if (!authenticated || !user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const result = await requireAppAccess(params.id, user.id)
  if (result.error) return result.error

  const { db } = await import('@/lib/db')

  const app = await db.app.findUnique({
    where: { id: params.id },
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
      _count: {
        select: { releases: true },
      },
    },
  })

  if (!app) {
    return errorResponse('NOT_FOUND', 'App not found', 404)
  }

  // Get member count for the app's org
  const memberCount = await db.membership.count({
    where: { orgId: app.orgId },
  })

  // Get total downloads across all releases
  const downloadAgg = await db.release.aggregate({
    where: { appId: params.id },
    _sum: { downloadCount: true },
  })

  const data = {
    ...app,
    latestRelease: app.releases[0] ?? null,
    releaseCount: app._count.releases,
    memberCount,
    totalDownloads: downloadAgg._sum.downloadCount ?? 0,
    releases: undefined,
    _count: undefined,
  }

  return successResponse(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { authenticated, user } = await authenticateRequest(request)
  if (!authenticated || !user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const result = await requireAppRole(params.id, user.id, 'ADMIN', user.isSuperAdmin)
  if (result.error) return result.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = updateAppSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { db } = await import('@/lib/db')

  try {
    const app = await db.app.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    })

    return successResponse(app)
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { authenticated, user } = await authenticateRequest(request)
  if (!authenticated || !user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const result = await requireAppRole(params.id, user.id, 'ADMIN', user.isSuperAdmin)
  if (result.error) return result.error

  const { searchParams } = new URL(request.url)
  const confirm = searchParams.get('confirm')

  if (!confirm) {
    return errorResponse('BAD_REQUEST', 'Missing confirm parameter — pass ?confirm=AppName', 400)
  }

  if (confirm !== result.app.name) {
    return errorResponse(
      'BAD_REQUEST',
      'Confirmation name does not match. Must be an exact, case-sensitive match.',
      400,
    )
  }

  const { db } = await import('@/lib/db')

  // Delete release files from storage (tolerant of failures)
  const releases = await db.release.findMany({
    where: { appId: params.id },
    select: { fileKey: true },
  })

  const storage = getStorageAdapter()
  const fileKeys = releases.map((r) => r.fileKey)

  // Also delete app icon if present
  if (result.app.iconKey) {
    fileKeys.push(result.app.iconKey)
  }

  if (fileKeys.length > 0) {
    await Promise.allSettled(fileKeys.map((key) => storage.delete(key)))
  }

  // Prisma cascades handle dependent records
  await db.app.delete({ where: { id: params.id } })

  return successResponse({ deleted: true })
}
