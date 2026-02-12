import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { requireOrgMembership } from '@/lib/org-auth'

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

  const memberships = await db.membership.findMany({
    where: { orgId: org.id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const members = memberships.map((membership) => ({
    id: membership.id,
    userId: membership.user.id,
    email: membership.user.email,
    firstName: membership.user.firstName,
    lastName: membership.user.lastName,
    avatarUrl: membership.user.avatarUrl,
    role: membership.role,
    createdAt: membership.createdAt,
  }))

  return successResponse(members)
}
