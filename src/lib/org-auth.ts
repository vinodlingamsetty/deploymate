import { Role, type Membership, type Organization } from '@prisma/client'
import { errorResponse } from '@/lib/api-utils'

const ROLE_LEVEL: Record<Role, number> = {
  ADMIN: 3,
  MANAGER: 2,
  TESTER: 1,
}

type OrgMembershipResult =
  | { org: Organization; membership: Membership; error?: never }
  | { org?: never; membership?: never; error: ReturnType<typeof errorResponse> }

type OrgRoleResult =
  | { org: Organization; membership: Membership | null; error?: never }
  | { org?: never; membership?: never; error: ReturnType<typeof errorResponse> }

/**
 * Verify that a user is a member of the organization identified by `slug`.
 * Returns the org and membership on success, or a typed error response.
 */
export async function requireOrgMembership(
  slug: string,
  userId: string,
): Promise<OrgMembershipResult> {
  const { db } = await import('@/lib/db')

  const org = await db.organization.findUnique({ where: { slug } })

  if (!org) {
    return { error: errorResponse('NOT_FOUND', 'Organization not found', 404) }
  }

  const membership = await db.membership.findUnique({
    where: { userId_orgId: { userId, orgId: org.id } },
  })

  if (!membership) {
    return {
      error: errorResponse('FORBIDDEN', 'You are not a member of this organization', 403),
    }
  }

  return { org, membership }
}

/**
 * Verify that a user holds at least `minimumRole` in the organization identified
 * by `slug`. Super-admins bypass the role check but still require the org to exist.
 * Returns the org and membership (null for super-admins without explicit membership)
 * on success, or a typed error response.
 */
export async function requireOrgRole(
  slug: string,
  userId: string,
  minimumRole: Role,
  isSuperAdmin: boolean,
): Promise<OrgRoleResult> {
  const { db } = await import('@/lib/db')

  if (isSuperAdmin) {
    const org = await db.organization.findUnique({ where: { slug } })

    if (!org) {
      return { error: errorResponse('NOT_FOUND', 'Organization not found', 404) }
    }

    const membership = await db.membership.findUnique({
      where: { userId_orgId: { userId, orgId: org.id } },
    })

    // membership may be null — super-admins do not need explicit membership
    return { org, membership: membership ?? null }
  }

  const result = await requireOrgMembership(slug, userId)

  if (result.error) {
    return { error: result.error }
  }

  const { org, membership } = result

  if (ROLE_LEVEL[membership.role] < ROLE_LEVEL[minimumRole]) {
    return { error: errorResponse('FORBIDDEN', 'Insufficient permissions', 403) }
  }

  return { org, membership }
}
