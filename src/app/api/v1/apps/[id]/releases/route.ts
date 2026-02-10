import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { getStorageAdapter } from '@/lib/storage'
import { parseBinary } from '@/lib/binary-parser'
import { z } from 'zod'

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

  // Read file and extract metadata from the binary
  const fileBuffer = await storage.getBuffer(fileKey)
  const metadata = parseBinary(fileBuffer, app.platform)

  const version = metadata.version ?? '0.0.0'
  const buildNumber = metadata.buildNumber ?? '0'
  const fileName = fileKey.split('/').pop() ?? 'unknown'

  // Create the release record (and optionally link distribution groups)
  const release = await db.release.create({
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

  const { db } = await import('@/lib/db')

  const app = await db.app.findUnique({ where: { id: params.id } })
  if (!app) {
    return errorResponse('NOT_FOUND', 'App not found', 404)
  }

  const releases = await db.release.findMany({
    where: { appId: params.id },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(releases)
}
