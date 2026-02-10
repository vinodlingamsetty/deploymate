import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/api-utils'
import { getStorageAdapter } from '@/lib/storage'

export async function GET(
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

  // Log download and increment count in a transaction
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent') ?? null

  await db.$transaction([
    db.downloadLog.create({
      data: {
        releaseId: release.id,
        userId: session.user.id,
        ipAddress,
        userAgent,
      },
    }),
    db.release.update({
      where: { id: release.id },
      data: { downloadCount: { increment: 1 } },
    }),
  ])

  const extension = release.app.platform === 'IOS' ? 'ipa' : 'apk'
  const safeName = release.app.name.replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `${safeName}-v${release.version}.${extension}`

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    },
  })
}
