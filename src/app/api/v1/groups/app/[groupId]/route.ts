import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { isPrismaError } from '@/lib/db'
import { z } from 'zod'

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
})

// Shared helper: look up an app group + verify membership
async function loadGroupAndCheckAccess(
  groupId: string,
  userId: string,
  isSuperAdmin: boolean,
  requireManager = false,
) {
  if (!groupId.trim()) return { error: errorResponse('BAD_REQUEST', 'Invalid group ID', 400) }

  const { db } = await import('@/lib/db')

  const group = await db.appDistGroup.findUnique({
    where: { id: groupId },
    include: { app: { select: { orgId: true } } },
  })
  if (!group) return { error: errorResponse('NOT_FOUND', 'Group not found', 404) }

  if (!isSuperAdmin) {
    const membership = await db.membership.findUnique({
      where: { userId_orgId: { userId, orgId: group.app.orgId } },
    })
    if (!membership) return { error: errorResponse('FORBIDDEN', 'You do not have access to this group', 403) }
    if (requireManager && membership.role === 'TESTER') {
      return { error: errorResponse('FORBIDDEN', 'Insufficient permissions', 403) }
    }
  }

  return { group, db }
}

export async function GET(
  _request: Request,
  { params }: { params: { groupId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const result = await loadGroupAndCheckAccess(params.groupId, session.user.id, session.user.isSuperAdmin)
  if ('error' in result) return result.error
  const { db } = result

  const [group, pendingInvitations] = await Promise.all([
    db.appDistGroup.findUnique({
      where: { id: params.groupId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    }),
    db.groupInvitation.findMany({
      where: { appGroupId: params.groupId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 100,
    }),
  ])

  if (!group) {
    return errorResponse('NOT_FOUND', 'Group not found', 404)
  }

  return successResponse({
    id: group.id,
    name: group.name,
    description: group.description,
    appId: group.appId,
    createdAt: group.createdAt.toISOString(),
    members: group.members.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
    })),
    pendingInvitations: pendingInvitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
    })),
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: { groupId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const result = await loadGroupAndCheckAccess(params.groupId, session.user.id, session.user.isSuperAdmin, true)
  if ('error' in result) return result.error
  const { db } = result

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = updateGroupSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  try {
    const updated = await db.appDistGroup.update({
      where: { id: params.groupId },
      data: parsed.data,
    })

    return successResponse({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      appId: updated.appId,
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2002')) {
      return errorResponse('CONFLICT', 'A group with this name already exists for this app', 409)
    }
    throw err
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { groupId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const result = await loadGroupAndCheckAccess(params.groupId, session.user.id, session.user.isSuperAdmin, true)
  if ('error' in result) return result.error
  const { db } = result

  try {
    await db.appDistGroup.delete({ where: { id: params.groupId } })
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2025')) {
      return errorResponse('NOT_FOUND', 'Group not found', 404)
    }
    throw err
  }

  return successResponse({ deleted: true })
}
