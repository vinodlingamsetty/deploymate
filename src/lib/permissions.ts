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
 * Verify that a user holds at least `minimumRole` in the organization that
 * owns the app. Super-admins bypass the role check but the app must still exist.
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

  if (ROLE_LEVEL[membership.role] < ROLE_LEVEL[minimumRole]) {
    return { error: errorResponse('FORBIDDEN', 'Insufficient permissions', 403) }
  }

  return { app, membership }
}
