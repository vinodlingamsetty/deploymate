import { notFound } from 'next/navigation'
import { MOCK_APPS, MOCK_RELEASES, MOCK_RELEASE_GROUPS } from '@/lib/mock-data'
import { ReleaseDetailsContent } from '@/components/releases/release-details-content'
import { generateOtaToken } from '@/lib/ota-token'

interface ReleaseDetailsPageProps {
  params: { id: string }
}

export default async function ReleaseDetailsPage({ params }: ReleaseDetailsPageProps) {
  const release = MOCK_RELEASES.find((r) => r.id === params.id)
  if (!release) notFound()

  const app = MOCK_APPS.find((a) => a.id === release.appId)
  if (!app) notFound()

  const otaToken = app.platform === 'IOS' ? generateOtaToken(release.id) : undefined

  const releaseGroupMapping = MOCK_RELEASE_GROUPS.find((rg) => rg.releaseId === release.id)
  const distributionGroups = releaseGroupMapping
    ? releaseGroupMapping.groups.map((g) => ({
        id: g.id,
        name: g.name,
        memberCount: g.memberCount,
      }))
    : []

  return (
    <ReleaseDetailsContent
      release={release}
      appName={app.name}
      appId={app.id}
      platform={app.platform}
      otaToken={otaToken}
      distributionGroups={distributionGroups}
    />
  )
}
