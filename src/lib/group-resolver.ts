/**
 * Resolves unique user IDs from a list of app and org distribution groups.
 * Used after release creation to determine which users should be notified.
 */
export async function resolveGroupMembers(
  groups: Array<{ id: string; type: 'app' | 'org' }>,
): Promise<string[]> {
  if (groups.length === 0) return []

  const { db } = await import('@/lib/db')

  const appGroupIds = groups.filter((g) => g.type === 'app').map((g) => g.id)
  const orgGroupIds = groups.filter((g) => g.type === 'org').map((g) => g.id)

  const [appMembers, orgMembers] = await db.$transaction(async (tx) => {
    const app = appGroupIds.length > 0
      ? await tx.appGroupMember.findMany({
          where: { groupId: { in: appGroupIds } },
          select: { userId: true },
        })
      : []
    const org = orgGroupIds.length > 0
      ? await tx.orgGroupMember.findMany({
          where: { groupId: { in: orgGroupIds } },
          select: { userId: true },
        })
      : []
    return [app, org] as const
  })

  const uniqueUserIds = new Set([
    ...appMembers.map((m) => m.userId),
    ...orgMembers.map((m) => m.userId),
  ])

  return Array.from(uniqueUserIds)
}
