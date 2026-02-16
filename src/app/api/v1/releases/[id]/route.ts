import { authenticateRequest } from '@/lib/auth-utils'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { requireAppAccess, requireAppRole } from '@/lib/permissions'
import { getStorageAdapter } from '@/lib/storage'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { authenticated, user } = await authenticateRequest(request)
  if (!authenticated || !user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { db } = await import('@/lib/db')

  const release = await db.release.findUnique({
    where: { id: params.id },
    include: {
      app: {
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      },
      releaseGroups: {
        include: {
          appGroup: { select: { id: true, name: true } },
          orgGroup: { select: { id: true, name: true } },
        },
      },
      _count: { select: { downloadLogs: true } },
    },
  })

  if (!release) {
    return errorResponse('NOT_FOUND', 'Release not found', 404)
  }

  // Verify user has access to the app's org
  const accessResult = await requireAppAccess(release.appId, user.id)
  if (accessResult.error) return accessResult.error

  // Flatten distribution groups
  const distributionGroups = release.releaseGroups.map((rg) => {
    if (rg.appGroup) return { id: rg.appGroup.id, name: rg.appGroup.name, type: 'app' as const }
    if (rg.orgGroup) return { id: rg.orgGroup.id, name: rg.orgGroup.name, type: 'org' as const }
    return null
  }).filter(Boolean)

  const { releaseGroups: _, _count, ...rest } = release

  return successResponse({
    ...rest,
    distributionGroups,
    downloadCount: _count.downloadLogs,
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { authenticated, user } = await authenticateRequest(request)
  if (!authenticated || !user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { db } = await import('@/lib/db')

  const release = await db.release.findUnique({
    where: { id: params.id },
    select: { id: true, appId: true, fileKey: true },
  })

  if (!release) {
    return errorResponse('NOT_FOUND', 'Release not found', 404)
  }

  // Check MANAGER+ role in the app's org
  const roleResult = await requireAppRole(
    release.appId,
    user.id,
    'MANAGER',
    user.isSuperAdmin,
  )
  if (roleResult.error) return roleResult.error

  // Delete file from storage (tolerant of failures)
  const storage = getStorageAdapter()
  await storage.delete(release.fileKey).catch(() => {
    // Storage deletion failure should not block DB cleanup
  })

  // Prisma cascades handle releaseGroups, downloadLogs, feedback
  await db.release.delete({ where: { id: params.id } })

  const { ipAddress, userAgent } = extractRequestMeta(request)
  void createAuditLog({
    userId: user.id,
    action: 'delete',
    entityType: 'release',
    entityId: params.id,
    oldValue: { appId: release.appId, fileKey: release.fileKey },
    ipAddress,
    userAgent,
  })

  return successResponse({ deleted: true })
}
