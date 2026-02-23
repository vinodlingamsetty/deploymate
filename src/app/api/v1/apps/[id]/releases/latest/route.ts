import { authenticateRequest } from '@/lib/auth-utils'
import { requireApiPermission } from '@/lib/api-authz'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { requireAppAccess } from '@/lib/permissions'

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const authResult = await authenticateRequest(request)
  const { authenticated, user } = authResult
  if (!authenticated || !user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }
  const permissionError = requireApiPermission(authResult, 'READ')
  if (permissionError) return permissionError

  const result = await requireAppAccess(params.id, user.id)
  if (result.error) return result.error

  const { db } = await import('@/lib/db')

  const release = await db.release.findFirst({
    where: { appId: params.id },
    orderBy: { createdAt: 'desc' },
    include: {
      releaseGroups: {
        include: {
          appGroup: { select: { id: true, name: true } },
          orgGroup: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!release) {
    return errorResponse('NOT_FOUND', 'No releases found for this app', 404)
  }

  // Flatten distribution groups
  const distributionGroups = release.releaseGroups.map((rg) => {
    if (rg.appGroup) return { id: rg.appGroup.id, name: rg.appGroup.name, type: 'app' as const }
    if (rg.orgGroup) return { id: rg.orgGroup.id, name: rg.orgGroup.name, type: 'org' as const }
    return null
  }).filter(Boolean)

  const { releaseGroups: _, ...rest } = release

  return successResponse({ ...rest, distributionGroups })
}
