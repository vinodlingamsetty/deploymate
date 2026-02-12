import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { requireOrgMembership, requireOrgRole } from '@/lib/org-auth'
import { z } from 'zod'

const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

type RouteContext = { params: { slug: string } }

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const result = await requireOrgMembership(params.slug, session.user.id)
  if (result.error) return result.error

  const { org } = result

  const { db } = await import('@/lib/db')

  const orgWithCounts = await db.organization.findUnique({
    where: { id: org.id },
    include: {
      _count: {
        select: {
          memberships: true,
          apps: true,
        },
      },
    },
  })

  if (!orgWithCounts) {
    return errorResponse('NOT_FOUND', 'Organization not found', 404)
  }

  return successResponse({
    id: orgWithCounts.id,
    name: orgWithCounts.name,
    slug: orgWithCounts.slug,
    memberCount: orgWithCounts._count.memberships,
    appCount: orgWithCounts._count.apps,
    createdAt: orgWithCounts.createdAt,
    updatedAt: orgWithCounts.updatedAt,
  })
}

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

  const parsed = updateOrgSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { name } = parsed.data

  if (name === undefined) {
    return errorResponse('BAD_REQUEST', 'At least one field must be provided', 400)
  }

  const { db } = await import('@/lib/db')

  const updated = await db.organization.update({
    where: { id: org.id },
    data: { name },
    select: { id: true, name: true, slug: true, createdAt: true, updatedAt: true },
  })

  return successResponse(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  if (!session.user.isSuperAdmin) {
    return errorResponse('FORBIDDEN', 'Super Admin access required', 403)
  }

  const { searchParams } = new URL(request.url)
  if (searchParams.get('confirm') !== 'true') {
    return errorResponse('BAD_REQUEST', 'Must confirm deletion with ?confirm=true', 400)
  }

  const { db } = await import('@/lib/db')

  const org = await db.organization.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })

  if (!org) {
    return errorResponse('NOT_FOUND', 'Organization not found', 404)
  }

  await db.organization.delete({ where: { id: org.id } })

  return successResponse({ deleted: true })
}
