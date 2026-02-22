import { verifyOtaToken } from '@/lib/ota-token'
import { resolveOtaPublicOrigin } from '@/lib/ota-origin'

function otaErrorResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return otaErrorResponse('Invalid or expired OTA token', 403)
  }

  const userId = verifyOtaToken(token, params.id)
  if (!userId) {
    return otaErrorResponse('Invalid or expired OTA token', 403)
  }

  const { db } = await import('@/lib/db')

  const release = await db.release.findUnique({
    where: { id: params.id },
    include: { app: true },
  })

  if (!release) {
    return otaErrorResponse('Release not found', 404)
  }

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
      return otaErrorResponse('Access denied', 403)
    }
  }

  const bundleId =
    release.extractedBundleId ?? release.app.bundleId ?? 'com.unknown'

  const originResult = resolveOtaPublicOrigin(request)
  if ('error' in originResult) {
    return otaErrorResponse(originResult.error, 500)
  }
  const downloadUrl = `${originResult.origin}/api/v1/releases/${release.id}/download?token=${encodeURIComponent(token)}`

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
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-store',
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
