import type { TokenPermission } from '@prisma/client'
import { errorResponse } from '@/lib/api-utils'

type AuthContext = {
  authType: 'session' | 'token' | null
  tokenPermissions: TokenPermission[] | null
}

export type ApiPermission = 'READ' | 'WRITE'

function hasApiPermission(
  permissions: TokenPermission[],
  required: ApiPermission,
): boolean {
  if (permissions.includes('ADMIN')) return true
  if (required === 'READ') {
    return permissions.includes('READ') || permissions.includes('WRITE')
  }
  return permissions.includes('WRITE')
}

export function requireApiPermission(
  context: AuthContext,
  required: ApiPermission,
): Response | null {
  // Session-authenticated requests are governed by RBAC checks.
  if (context.authType !== 'token') return null

  const permissions = context.tokenPermissions ?? []
  if (hasApiPermission(permissions, required)) return null

  return errorResponse(
    'FORBIDDEN',
    `API token requires ${required} permission`,
    403,
  )
}
