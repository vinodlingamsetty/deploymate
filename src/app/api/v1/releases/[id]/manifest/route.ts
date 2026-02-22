import { verifyOtaToken } from '@/lib/ota-token'
import { errorResponse } from '@/lib/api-utils'

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  console.log('[ota/manifest] request url:', request.url)
  console.log('[ota/manifest] x-forwarded-proto:', request.headers.get('x-forwarded-proto'))

  if (!token) {
    console.log('[ota/manifest] missing token')
    return errorResponse('FORBIDDEN', 'Invalid or expired OTA token', 403)
  }

  const userId = verifyOtaToken(token, params.id)
  if (!userId) {
    console.log('[ota/manifest] invalid or expired token for releaseId:', params.id)
    return errorResponse('FORBIDDEN', 'Invalid or expired OTA token', 403)
  }
  console.log('[ota/manifest] token ok — userId:', userId, 'releaseId:', params.id)

  const { db } = await import('@/lib/db')

  const release = await db.release.findUnique({
    where: { id: params.id },
    include: { app: true },
  })

  if (!release) {
    console.log('[ota/manifest] release not found — id:', params.id)
    return errorResponse('NOT_FOUND', 'Release not found', 404)
  }
  console.log('[ota/manifest] release found — bundleId:', release.extractedBundleId ?? release.app.bundleId, 'app:', release.app.name)

  // Verify the token's user still has access to this release's organization.
  // Public install tokens use 'public-install' as userId — a valid signed token
  // is sufficient authorization for those (scoped to a single release, 1-hour expiry).
  if (userId !== 'public-install') {
    const [membership, user] = await Promise.all([
      db.membership.findUnique({
        where: { userId_orgId: { userId, orgId: release.app.orgId } },
      }),
      db.user.findUnique({
        where: { id: userId },
        select: { isSuperAdmin: true },
      }),
    ])

    if (!membership && !user?.isSuperAdmin) {
      return errorResponse('FORBIDDEN', 'Access denied', 403)
    }
  }

  const bundleId =
    release.extractedBundleId ?? release.app.bundleId ?? 'com.unknown'

  // Build the download URL — validate HTTPS in production (required for iOS OTA).
  // When running behind a reverse proxy (e.g. Cloudflare Tunnel) the server sees
  // plain HTTP, so we check x-forwarded-proto to get the true client-facing protocol.
  let rawOrigin: string
  if (process.env.APP_URL) {
    rawOrigin = process.env.APP_URL.replace(/\/$/, '')
  } else {
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
    if (forwardedProto) {
      url.protocol = forwardedProto + ':'
    }
    rawOrigin = url.origin
  }
  if (process.env.NODE_ENV === 'production') {
    try {
      const originUrl = new URL(rawOrigin)
      if (originUrl.protocol !== 'https:') {
        return errorResponse('SERVER_ERROR', 'APP_URL must use HTTPS for iOS OTA installs', 500)
      }
    } catch {
      return errorResponse('SERVER_ERROR', 'APP_URL is not a valid URL', 500)
    }
  }
  console.log('[ota/manifest] rawOrigin:', rawOrigin)
  const downloadUrl = `${rawOrigin}/api/v1/releases/${release.id}/download?token=${encodeURIComponent(token!)}`

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>items</key>
  <array>
    <dict>
      <key>assets</key>
      <array>
        <dict>
          <key>kind</key>
          <string>software-package</string>
          <key>url</key>
          <string>${escapeXml(downloadUrl)}</string>
        </dict>
      </array>
      <key>metadata</key>
      <dict>
        <key>bundle-identifier</key>
        <string>${escapeXml(bundleId)}</string>
        <key>bundle-version</key>
        <string>${escapeXml(release.version)}</string>
        <key>kind</key>
        <string>software</string>
        <key>title</key>
        <string>${escapeXml(release.app.name)}</string>
      </dict>
    </dict>
  </array>
</dict>
</plist>`

  console.log('[ota/manifest] serving plist — downloadUrl:', downloadUrl)
  return new Response(plist, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
