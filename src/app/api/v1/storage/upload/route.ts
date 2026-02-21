import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/api-utils'
import { getStorageAdapter } from '@/lib/storage'
import { NextResponse } from 'next/server'

const ALLOWED_KEY_PATTERN = /^(releases|icons)\//

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key) {
    return errorResponse('BAD_REQUEST', 'Missing key parameter', 400)
  }

  // Reject path traversal and disallow keys outside expected prefixes
  if (key.includes('..') || !ALLOWED_KEY_PATTERN.test(key)) {
    return errorResponse('FORBIDDEN', 'Invalid key', 403)
  }

  const contentType = request.headers.get('content-type') ?? 'application/octet-stream'

  const arrayBuffer = await request.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const storage = getStorageAdapter()
  await storage.upload(key, buffer, contentType)

  return new NextResponse(null, { status: 200 })
}
