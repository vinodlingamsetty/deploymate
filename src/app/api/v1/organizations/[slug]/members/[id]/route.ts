import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { requireOrgRole } from '@/lib/org-auth'
import { z } from 'zod'

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'TESTER']),
})

type RouteContext = { params: { slug: string; id: string } }

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const result = await requireOrgRole(
    params.slug,
    session.user.id,
    'ADMIN',
    session.user.isSuperAdmin,
  )
  if (result.error) return result.error

  const { org } = result

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = updateRoleSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { db } = await import('@/lib/db')

  const targetMembership = await db.membership.findUnique({
    where: { id: params.id },
  })

  if (!targetMembership) {
    return errorResponse('NOT_FOUND', 'Member not found', 404)
  }

  if (targetMembership.orgId !== org.id) {
    return errorResponse('NOT_FOUND', 'Member not found', 404)
  }

  // Guard against demoting the last admin out of the ADMIN role
  if (parsed.data.role !== 'ADMIN' && targetMembership.role === 'ADMIN') {
    const adminCount = await db.membership.count({
      where: { orgId: org.id, role: 'ADMIN' },
    })
    if (adminCount <= 1) {
      return errorResponse(
        'BAD_REQUEST',
        'Cannot demote the last admin of this organization',
        400,
      )
    }
  }

  const updatedMembership = await db.membership.update({
    where: { id: params.id },
    data: { role: parsed.data.role },
  })

  return successResponse(updatedMembership)
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const result = await requireOrgRole(
    params.slug,
    session.user.id,
    'ADMIN',
    session.user.isSuperAdmin,
  )
  if (result.error) return result.error

  const { org } = result

  const { db } = await import('@/lib/db')

  const targetMembership = await db.membership.findUnique({
    where: { id: params.id },
  })

  if (!targetMembership) {
    return errorResponse('NOT_FOUND', 'Member not found', 404)
  }

  if (targetMembership.orgId !== org.id) {
    return errorResponse('NOT_FOUND', 'Member not found', 404)
  }

  // Guard against removing the last admin from the organization
  if (targetMembership.role === 'ADMIN') {
    const adminCount = await db.membership.count({
      where: { orgId: org.id, role: 'ADMIN' },
    })
    if (adminCount <= 1) {
      return errorResponse(
        'BAD_REQUEST',
        'Cannot remove the last admin of this organization',
        400,
      )
    }
  }

  // Remove the membership and clean up any distribution group memberships in one transaction
  await db.$transaction([
    db.orgGroupMember.deleteMany({
      where: {
        userId: targetMembership.userId,
        group: { orgId: org.id },
      },
    }),
    db.membership.delete({ where: { id: params.id } }),
  ])

  return successResponse({ removed: true })
}
