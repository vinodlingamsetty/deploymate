import { verifyOtaToken } from '@/lib/ota-token'
import { errorResponse } from '@/lib/api-utils'

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return errorResponse('FORBIDDEN', 'Invalid or expired OTA token', 403)
  }

  const userId = verifyOtaToken(token, params.id)
  if (!userId) {
    return errorResponse('FORBIDDEN', 'Invalid or expired OTA token', 403)
  }

  const { db } = await import('@/lib/db')

  const release = await db.release.findUnique({
    where: { id: params.id },
    include: { app: true },
  })

  if (!release) {
    return errorResponse('NOT_FOUND', 'Release not found', 404)
  }

  // Verify the token's user still has access to this release's organization
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

  const bundleId =
    release.extractedBundleId ?? release.app.bundleId ?? 'com.unknown'

  // Build the download URL — validate HTTPS in production (required for iOS OTA)
  const rawOrigin = process.env.APP_URL ?? url.origin
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
  const downloadUrl = `${rawOrigin}/api/v1/releases/${release.id}/download`

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

  return new Response(plist, {
    headers: {
      'Content-Type': 'application/xml',
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
