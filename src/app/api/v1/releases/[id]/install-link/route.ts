import { auth } from '@/lib/auth'
import { errorResponse, successResponse } from '@/lib/api-utils'
import { generateOtaToken } from '@/lib/ota-token'
import { resolveOtaPublicOrigin } from '@/lib/ota-origin'

const DEFAULT_LINK_TTL_SECONDS = 3600

function getLinkTtlSeconds(): number {
  const raw = process.env.OTA_LINK_TTL_SECONDS
  if (!raw) return DEFAULT_LINK_TTL_SECONDS

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LINK_TTL_SECONDS
  return Math.max(1, Math.floor(parsed))
}

function buildItmsServicesUrl(manifestUrl: string): string {
  return `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { db } = await import('@/lib/db')
  const release = await db.release.findUnique({
    where: { id: params.id },
    include: {
      app: {
        select: {
          id: true,
          name: true,
          orgId: true,
          platform: true,
        },
      },
    },
  })

  if (!release) {
    return errorResponse('NOT_FOUND', 'Release not found', 404)
  }

  if (!session.user.isSuperAdmin) {
    const membership = await db.membership.findUnique({
      where: {
        userId_orgId: {
          userId: session.user.id,
          orgId: release.app.orgId,
        },
      },
      select: { userId: true },
    })

    if (!membership) {
      return errorResponse('FORBIDDEN', 'Access denied to this release', 403)
    }
  }

  const originResult = resolveOtaPublicOrigin(request)
  if ('error' in originResult) {
    return errorResponse('CONFIGURATION_ERROR', originResult.error, 500)
  }

  const ttlSeconds = getLinkTtlSeconds()
  const token = generateOtaToken(release.id, session.user.id, ttlSeconds)
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
  const downloadUrl = `${originResult.origin}/api/v1/releases/${release.id}/download?token=${encodeURIComponent(token)}`

  if (release.app.platform === 'IOS') {
    const manifestUrl = `${originResult.origin}/api/v1/releases/${release.id}/manifest?token=${encodeURIComponent(token)}`
    const installUrl = buildItmsServicesUrl(manifestUrl)

    return successResponse({
      platform: 'IOS',
      installUrl,
      manifestUrl,
      expiresAt,
      ttlSeconds,
    })
  }

  return successResponse({
    platform: 'ANDROID',
    downloadUrl,
    expiresAt,
    ttlSeconds,
  })
}
