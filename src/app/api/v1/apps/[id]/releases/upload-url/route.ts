import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { getStorageAdapter } from '@/lib/storage'
import { z } from 'zod'

const uploadUrlSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  contentType: z.string().min(1),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { db } = await import('@/lib/db')

  const app = await db.app.findUnique({ where: { id: params.id } })
  if (!app) {
    return errorResponse('NOT_FOUND', 'App not found', 404)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = uploadUrlSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { fileName, fileSize: _fileSize, contentType } = parsed.data

  // Validate file extension matches app platform
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (app.platform === 'IOS' && ext !== 'ipa') {
    return errorResponse('VALIDATION_ERROR', 'iOS apps require .ipa files', 400)
  }
  if (app.platform === 'ANDROID' && ext !== 'apk') {
    return errorResponse('VALIDATION_ERROR', 'Android apps require .apk files', 400)
  }

  const fileId = crypto.randomUUID()
  const fileKey = `releases/${params.id}/${fileId}.${ext}`

  const storage = getStorageAdapter()
  const uploadUrl = await storage.getSignedUploadUrl(fileKey, contentType, { expiresIn: 3600 })
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()

  return successResponse({ uploadUrl, fileKey, expiresAt })
}
