import { auth } from '@/lib/auth'
import { verifyOtaToken } from '@/lib/ota-token'
import { errorResponse } from '@/lib/api-utils'
import { getStorageAdapter } from '@/lib/storage'

interface ReleaseWithApp {
  id: string
  version: string
  fileKey: string
  app: {
    platform: string
    name: string
  }
}

interface DownloadContext {
  token: string | null
  userId: string
  release: ReleaseWithApp
  buffer: Buffer
}

function buildDownloadHeaders(
  release: ReleaseWithApp,
  token: string | null,
  contentLength: number,
): Record<string, string> {
  const extension = release.app.platform === 'IOS' ? 'ipa' : 'apk'
  const safeName = release.app.name.replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `${safeName}-v${release.version}.${extension}`
  const isIosOtaTokenized = Boolean(token) && release.app.platform === 'IOS'

  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(contentLength),
  }

  if (isIosOtaTokenized) {
    headers['Accept-Ranges'] = 'bytes'
    headers['Cache-Control'] = 'no-store'
  } else {
    headers['Content-Disposition'] = `attachment; filename="${filename}"`
  }

  return headers
}

async function resolveDownloadContext(
  request: Request,
  { params }: { params: { id: string } },
): Promise<DownloadContext | Response> {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  let userId: string | null = null

  if (token) {
    userId = verifyOtaToken(token, params.id)
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Invalid or expired OTA token', 401)
    }
  } else {
    const session = await auth()
    if (!session?.user?.id) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    userId = session.user.id
  }

  const { db } = await import('@/lib/db')

  const release = await db.release.findUnique({
    where: { id: params.id },
    include: { app: true },
  })

  if (!release) {
    return errorResponse('NOT_FOUND', 'Release not found', 404)
  }

  const storage = getStorageAdapter()
  let buffer: Buffer
  try {
    buffer = await storage.getBuffer(release.fileKey)
  } catch {
    return errorResponse('NOT_FOUND', 'Release file not found in storage', 404)
  }

  return {
    token,
    userId,
    release,
    buffer,
  }
}

function isErrorResponse(value: DownloadContext | Response): value is Response {
  return value instanceof Response
}

async function logDownload(
  db: Awaited<typeof import('@/lib/db')>['db'],
  userId: string,
  releaseId: string,
  request: Request,
) {
  // Log download and increment count in a transaction
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent') ?? null

  // Public install tokens carry 'public-install' as userId which has no DB row.
  // Skip the DownloadLog FK insert for those but still increment the counter.
  if (userId === 'public-install') {
    await db.release.update({
      where: { id: releaseId },
      data: { downloadCount: { increment: 1 } },
    })
    return
  }

  await db.$transaction([
    db.downloadLog.create({
      data: {
        releaseId,
        userId,
        ipAddress,
        userAgent,
      },
    }),
    db.release.update({
      where: { id: releaseId },
      data: { downloadCount: { increment: 1 } },
    }),
  ])
}

export async function GET(
  request: Request,
  context: { params: { id: string } },
) {
  const resolved = await resolveDownloadContext(request, context)
  if (isErrorResponse(resolved)) return resolved

  const { db } = await import('@/lib/db')
  await logDownload(db, resolved.userId, resolved.release.id, request)

  const headers = buildDownloadHeaders(resolved.release, resolved.token, resolved.buffer.length)
  return new Response(new Uint8Array(resolved.buffer), { headers })
}

export async function HEAD(
  request: Request,
  context: { params: { id: string } },
) {
  const resolved = await resolveDownloadContext(request, context)
  if (isErrorResponse(resolved)) return resolved

  const headers = buildDownloadHeaders(resolved.release, resolved.token, resolved.buffer.length)
  return new Response(null, { headers })
}
