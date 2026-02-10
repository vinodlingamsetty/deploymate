import { notFound } from 'next/navigation'
import { MOCK_APPS, MOCK_RELEASES } from '@/lib/mock-data'
import { ReleaseDetailsContent } from '@/components/releases/release-details-content'

interface ReleaseDetailsPageProps {
  params: { id: string }
}

export default async function ReleaseDetailsPage({ params }: ReleaseDetailsPageProps) {
  const release = MOCK_RELEASES.find((r) => r.id === params.id)
  if (!release) notFound()

  const app = MOCK_APPS.find((a) => a.id === release.appId)
  if (!app) notFound()

  return (
    <ReleaseDetailsContent
      release={release}
      appName={app.name}
      appId={app.id}
      platform={app.platform}
    />
  )
}
