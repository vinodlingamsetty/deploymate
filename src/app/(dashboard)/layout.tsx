import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import logger from '@/lib/logger'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  let organizations: Array<{ id: string; name: string; slug: string }> = []

  try {
    const { db } = await import('@/lib/db')
    const memberships = await db.membership.findMany({
      where: { userId: session.user.id },
      include: { org: { select: { id: true, name: true, slug: true } } },
      orderBy: { org: { name: 'asc' } },
    })
    organizations = memberships
      .filter((m) => m.org != null)
      .map((m) => ({ id: m.org.id, name: m.org.name, slug: m.org.slug }))
  } catch (error) {
    // If database is unavailable, show empty org list
    // This allows the dashboard to load without crashing
    logger.error({ err: String(error) }, 'Failed to fetch organizations')
    organizations = []
  }

  return (
    <DashboardShell
      user={session.user}
      organizations={organizations}
    >
      {children}
    </DashboardShell>
  )
}
