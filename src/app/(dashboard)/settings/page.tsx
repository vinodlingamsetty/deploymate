import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SettingsContent } from '@/components/settings/settings-content'
import logger from '@/lib/logger'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  let user = {
    id: session.user.id,
    email: session.user.email ?? '',
    firstName: null as string | null,
    lastName: null as string | null,
    avatarUrl: null as string | null,
    isSuperAdmin: session.user.isSuperAdmin,
  }

  let memberships: Array<{
    id: string
    role: string
    org: { id: string; name: string; slug: string }
  }> = []

  try {
    const { db } = await import('@/lib/db')

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isSuperAdmin: true,
      },
    })

    if (dbUser) {
      user = dbUser
    }

    const dbMemberships = await db.membership.findMany({
      where: { userId: session.user.id },
      include: {
        org: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { org: { name: 'asc' } },
    })

    memberships = dbMemberships.map((m) => ({
      id: m.id,
      role: m.role,
      org: m.org,
    }))
  } catch (error) {
    logger.error({ err: String(error) }, 'Failed to fetch user data')
  }

  return (
    <SettingsContent
      user={user}
      memberships={memberships}
      isSuperAdmin={user.isSuperAdmin}
    />
  )
}
