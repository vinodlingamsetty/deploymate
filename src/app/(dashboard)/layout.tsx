import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  // TODO: Replace with real org query when API is ready
  const organizations = [
    { name: 'Finance', slug: 'finance' },
    { name: 'Sales', slug: 'sales' },
    { name: 'Marketing', slug: 'marketing' },
  ]

  return (
    <DashboardShell
      user={session.user}
      organizations={organizations}
    >
      {children}
    </DashboardShell>
  )
}
