import { auth } from '@/lib/auth'
import { verifyOtaToken } from '@/lib/ota-token'
import { errorResponse } from '@/lib/api-utils'
import { getStorageAdapter } from '@/lib/storage'

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  console.log('[ota/download] request url:', request.url)
  console.log('[ota/download] token present:', !!token)
  let userId: string | null = null

  if (token) {
    userId = verifyOtaToken(token, params.id)
    if (!userId) {
      console.log('[ota/download] error — invalid or expired OTA token')
      return errorResponse('UNAUTHORIZED', 'Invalid or expired OTA token', 401)
    }
  } else {
    const session = await auth()
    if (!session?.user?.id) {
      console.log('[ota/download] error — no session, authentication required')
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    userId = session.user.id
  }
  console.log('[ota/download] auth ok — userId:', userId, 'releaseId:', params.id)

  const { db } = await import('@/lib/db')

  const release = await db.release.findUnique({
    where: { id: params.id },
    include: { app: true },
  })

  if (!release) {
    console.log('[ota/download] error — release not found')
    return errorResponse('NOT_FOUND', 'Release not found', 404)
  }
  console.log('[ota/download] release found — fileKey:', release.fileKey)

  const storage = getStorageAdapter()
  let buffer: Buffer
  try {
    buffer = await storage.getBuffer(release.fileKey)
  } catch {
    console.log('[ota/download] error — file not found in storage')
    return errorResponse('NOT_FOUND', 'Release file not found in storage', 404)
  }
  console.log('[ota/download] file loaded — size:', buffer.length)

  // Log download and increment count in a transaction
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent') ?? null

  // Public install tokens carry 'public-install' as userId which has no DB row.
  // Skip the DownloadLog FK insert for those but still increment the counter.
  if (userId === 'public-install') {
    await db.release.update({
      where: { id: release.id },
      data: { downloadCount: { increment: 1 } },
    })
  } else {
    await db.$transaction([
      db.downloadLog.create({
        data: {
          releaseId: release.id,
          userId,
          ipAddress,
          userAgent,
        },
      }),
      db.release.update({
        where: { id: release.id },
        data: { downloadCount: { increment: 1 } },
      }),
    ])
  }

  const extension = release.app.platform === 'IOS' ? 'ipa' : 'apk'
  const safeName = release.app.name.replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `${safeName}-v${release.version}.${extension}`

  console.log('[ota/download] serving file —', filename)
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    },
  })
}
