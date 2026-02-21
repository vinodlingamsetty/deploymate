import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { requireOrgMembership } from '@/lib/org-auth'

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const result = await requireOrgMembership(params.slug, session.user.id)
  if (result.error) return result.error

  const { org } = result

  const { db } = await import('@/lib/db')

  const groups = await db.orgDistGroup.findMany({
    where: { orgId: org.id },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const data = groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    memberCount: g._count.members,
    createdAt: g.createdAt.toISOString(),
  }))

  return successResponse(data)
}
