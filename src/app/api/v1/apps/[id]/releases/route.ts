import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { requireAppRole, requireAppAccess } from '@/lib/permissions'
import { getStorageAdapter } from '@/lib/storage'
import { parseBinary } from '@/lib/binary-parser'
import { resolveGroupMembers } from '@/lib/group-resolver'
import { isRedisAvailable } from '@/lib/redis'
import { getBinaryParsingQueue, getNotificationQueue } from '@/lib/queue'
import { z } from 'zod'
import logger from '@/lib/logger'
import { createAuditLog, extractRequestMeta } from '@/lib/audit'

const distributionGroupSchema = z.object({
  id: z.string(),
  type: z.enum(['app', 'org']),
})

const createReleaseSchema = z.object({
  fileKey: z.string().min(1),
  releaseNotes: z.string().optional(),
  releaseType: z.enum(['ALPHA', 'BETA', 'RELEASE_CANDIDATE']),
  distributionGroups: z.array(distributionGroupSchema).optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const roleResult = await requireAppRole(params.id, session.user.id, 'MANAGER', session.user.isSuperAdmin)
  if (roleResult.error) return roleResult.error
  const { app } = roleResult

  const { db } = await import('@/lib/db')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = createReleaseSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { fileKey, releaseNotes, releaseType, distributionGroups } = parsed.data

  // Verify the uploaded file exists in storage
  const storage = getStorageAdapter()
  const fileExists = await storage.exists(fileKey)
  if (!fileExists) {
    return errorResponse('NOT_FOUND', 'Uploaded file not found', 404)
  }

  const fileName = fileKey.split('/').pop() ?? 'unknown'
  const useQueue = isRedisAvailable()

  let release

  if (useQueue) {
    // Queue mode — create release with PROCESSING status, enqueue background jobs
    release = await db.release.create({
      data: {
        appId: params.id,
        version: '0.0.0',
        buildNumber: '0',
        releaseType,
        releaseNotes: releaseNotes ?? null,
        fileKey,
        fileSize: 0,
        fileName,
        status: 'PROCESSING',
        ...(distributionGroups && distributionGroups.length > 0
          ? {
              releaseGroups: {
                create: distributionGroups.map((g) => ({
                  ...(g.type === 'app' ? { appGroupId: g.id } : { orgGroupId: g.id }),
                })),
              },
            }
          : {}),
      },
    })

    const binaryQueue = getBinaryParsingQueue()
    if (binaryQueue) {
      await binaryQueue.add('parse', {
        releaseId: release.id,
        fileKey,
        platform: app.platform,
      })
    }

    if (distributionGroups && distributionGroups.length > 0) {
      const notifQueue = getNotificationQueue()
      if (notifQueue) {
        await notifQueue.add('notify', {
          releaseId: release.id,
          appName: app.name,
          version: '0.0.0',
          distributionGroups,
        })
      }
    }

    logger.info({ releaseId: release.id, mode: 'queue' }, 'Release created with background processing')
  } else {
    // Inline mode — parse synchronously (zero-Redis deployments)
    const fileBuffer = await storage.getBuffer(fileKey)
    const metadata = parseBinary(fileBuffer, app.platform)

    const version = metadata.version ?? '0.0.0'
    const buildNumber = metadata.buildNumber ?? '0'

    release = await db.release.create({
      data: {
        appId: params.id,
        version,
        buildNumber,
        releaseType,
        releaseNotes: releaseNotes ?? null,
        fileKey,
        fileSize: fileBuffer.length,
        fileName,
        minOSVersion: metadata.minOSVersion,
        extractedBundleId: metadata.bundleId,
        signingType: metadata.signingType,
        provisioningName: metadata.provisioningName,
        teamName: metadata.teamName,
        provisioningExpiry: metadata.provisioningExpiry,
        status: 'READY',
        ...(distributionGroups && distributionGroups.length > 0
          ? {
              releaseGroups: {
                create: distributionGroups.map((g) => ({
                  ...(g.type === 'app' ? { appGroupId: g.id } : { orgGroupId: g.id }),
                })),
              },
            }
          : {}),
      },
    })

    if (distributionGroups && distributionGroups.length > 0) {
      const resolvedUserIds = await resolveGroupMembers(distributionGroups)
      logger.info(
        { releaseId: release.id, userCount: resolvedUserIds.length, groupCount: distributionGroups.length },
        'Resolved group members for release notification',
      )
    }

    logger.info({ releaseId: release.id, mode: 'inline' }, 'Release created with inline processing')
  }

  const { ipAddress, userAgent } = extractRequestMeta(request)
  void createAuditLog({
    userId: session.user.id,
    orgId: app.orgId,
    action: 'create',
    entityType: 'release',
    entityId: release.id,
    newValue: { version: release.version, buildNumber: release.buildNumber, releaseType, appId: params.id },
    ipAddress,
    userAgent,
  })

  return successResponse(release, 201)
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const accessResult = await requireAppAccess(params.id, session.user.id)
  if (accessResult.error) return accessResult.error

  const { db } = await import('@/lib/db')

  const releases = await db.release.findMany({
    where: { appId: params.id },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(releases)
}
