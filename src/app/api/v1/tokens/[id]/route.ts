import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'

type RouteContext = { params: { id: string } }

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { db } = await import('@/lib/db')

  const token = await db.apiToken.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  })

  if (!token || token.userId !== session.user.id) {
    return errorResponse('NOT_FOUND', 'Token not found', 404)
  }

  await db.apiToken.delete({ where: { id: params.id } })

  return successResponse({ deleted: true })
}
