import { notFound } from 'next/navigation'

import { MOCK_APPS, MOCK_RELEASES } from '@/lib/mock-data'
import { AppDetailsHeader } from '@/components/apps/app-details-header'
import { AppStats } from '@/components/apps/app-stats'
import { AppTabs } from '@/components/apps/app-tabs'

interface AppDetailsPageProps {
  params: { id: string }
}

export default async function AppDetailsPage({ params }: AppDetailsPageProps) {
  const app = MOCK_APPS.find((a) => a.id === params.id)

  if (!app) {
    notFound()
  }

  const releases = MOCK_RELEASES.filter((r) => r.appId === app.id)

  return (
    <div className="space-y-6">
      <AppDetailsHeader app={app} />
      <AppStats app={app} />
      <AppTabs releases={releases} appId={app.id} />
    </div>
  )
}
