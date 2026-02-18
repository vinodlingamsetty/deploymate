import { Role, type App, type Membership } from '@prisma/client'
import { errorResponse } from '@/lib/api-utils'

const ROLE_LEVEL: Record<Role, number> = {
  ADMIN: 3,
  MANAGER: 2,
  TESTER: 1,
}

type AppAccessResult =
  | { app: App; membership: Membership; error?: never }
  | { app?: never; membership?: never; error: ReturnType<typeof errorResponse> }

type AppRoleResult =
  | { app: App; membership: Membership | null; error?: never }
  | { app?: never; membership?: never; error: ReturnType<typeof errorResponse> }

/**
 * Verify that a user is a member of the organization that owns the app.
 * Any org member can access (read) the app.
 */
export async function requireAppAccess(
  appId: string,
  userId: string,
): Promise<AppAccessResult> {
  const { db } = await import('@/lib/db')

  const app = await db.app.findUnique({ where: { id: appId } })

  if (!app) {
    return { error: errorResponse('NOT_FOUND', 'App not found', 404) }
  }

  const membership = await db.membership.findUnique({
    where: { userId_orgId: { userId, orgId: app.orgId } },
  })

  if (!membership) {
    return {
      error: errorResponse('FORBIDDEN', 'You do not have access to this app', 403),
    }
  }

  return { app, membership }
}

/**
 * Verify that a user holds at least `minimumRole` for the given app.
 *
 * Resolution order:
 *  1. Super-admins bypass all checks (app must still exist).
 *  2. AppMembership — if the user has an explicit per-app role override, that
 *     role is used for the permission check.
 *  3. Org-level Membership — fallback when no app-specific override exists.
 *
 * Note: The returned `membership` is always the org-level Membership record
 * (or null for super-admins not in the org). Callers that need the effective
 * role should rely on the permission check performed here rather than reading
 * `result.membership.role` directly.
 */
export async function requireAppRole(
  appId: string,
  userId: string,
  minimumRole: Role,
  isSuperAdmin: boolean,
): Promise<AppRoleResult> {
  const { db } = await import('@/lib/db')

  const app = await db.app.findUnique({ where: { id: appId } })

  if (!app) {
    return { error: errorResponse('NOT_FOUND', 'App not found', 404) }
  }

  if (isSuperAdmin) {
    const membership = await db.membership.findUnique({
      where: { userId_orgId: { userId, orgId: app.orgId } },
    })
    return { app, membership: membership ?? null }
  }

  const membership = await db.membership.findUnique({
    where: { userId_orgId: { userId, orgId: app.orgId } },
  })

  if (!membership) {
    return {
      error: errorResponse('FORBIDDEN', 'You do not have access to this app', 403),
    }
  }

  // Check for a per-app role override; fall back to the org-level role.
  const appMembership = await db.appMembership.findUnique({
    where: { appId_userId: { appId, userId } },
  })
  const resolvedRole = appMembership?.role ?? membership.role

  if (ROLE_LEVEL[resolvedRole] < ROLE_LEVEL[minimumRole]) {
    return { error: errorResponse('FORBIDDEN', 'Insufficient permissions', 403) }
  }

  return { app, membership }
}
