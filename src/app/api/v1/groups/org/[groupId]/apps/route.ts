import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { z } from 'zod'

const addAppsSchema = z.object({
  appIds: z.array(z.string().min(1)).min(1),
})

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  if (!params.groupId.trim()) {
    return errorResponse('BAD_REQUEST', 'Invalid group ID', 400)
  }

  const { db } = await import('@/lib/db')

  const group = await db.orgDistGroup.findUnique({
    where: { id: params.groupId },
    select: { id: true, orgId: true },
  })
  if (!group) {
    return errorResponse('NOT_FOUND', 'Group not found', 404)
  }

  // Verify user belongs to this org
  const membership = await db.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId: group.orgId } },
  })
  if (!membership) {
    return errorResponse('FORBIDDEN', 'You do not have access to this group', 403)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = addAppsSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { appIds } = parsed.data

  // Verify all apps belong to the same org as the group
  const apps = await db.app.findMany({
    where: { id: { in: appIds }, orgId: group.orgId },
    select: { id: true },
  })

  if (apps.length !== appIds.length) {
    return errorResponse(
      'BAD_REQUEST',
      'One or more apps do not belong to this organization',
      400,
    )
  }

  await db.orgGroupApp.createMany({
    data: appIds.map((appId) => ({
      groupId: params.groupId,
      appId,
    })),
    skipDuplicates: true,
  })

  return successResponse({ added: appIds.length }, 201)
}
