import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ReleaseDetailsContent } from '@/components/releases/release-details-content'
import { generateOtaToken } from '@/lib/ota-token'
import { isValidPlatform, isValidReleaseType } from '@/types/app'
import type { MockRelease, MockDistributionGroup } from '@/types/app'

interface ReleaseDetailsPageProps {
  params: { id: string }
}

export default async function ReleaseDetailsPage({ params }: ReleaseDetailsPageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const release = await db.release.findUnique({
    where: { id: params.id },
    include: {
      app: {
        include: {
          organization: { select: { name: true, slug: true } },
        },
      },
      releaseGroups: {
        include: {
          appGroup: {
            include: { _count: { select: { members: true } } },
          },
          orgGroup: {
            include: { _count: { select: { members: true } } },
          },
        },
      },
    },
  })

  if (!release) notFound()

  // Check org membership
  const membership = await db.membership.findUnique({
    where: {
      userId_orgId: { userId: session.user.id, orgId: release.app.orgId },
    },
  })

  if (!membership && !session.user.isSuperAdmin) {
    notFound()
  }

  if (!isValidReleaseType(release.releaseType) || !isValidPlatform(release.app.platform)) {
    notFound()
  }

  const otaToken =
    release.app.platform === 'IOS' ? generateOtaToken(release.id, session.user.id) : undefined

  // Adapt release to MockRelease interface
  const adaptedRelease: MockRelease = {
    id: release.id,
    appId: release.appId,
    version: release.version,
    buildNumber: release.buildNumber,
    releaseType: release.releaseType,
    releaseNotes: release.releaseNotes ?? '',
    fileSize: release.fileSize,
    downloadCount: release.downloadCount,
    createdAt: release.createdAt.toISOString(),
    minOSVersion: release.minOSVersion,
    signingType: release.signingType,
    provisioningName: release.provisioningName,
    teamName: release.teamName,
    provisioningExpiry: release.provisioningExpiry
      ? release.provisioningExpiry.toISOString()
      : null,
  }

  // Build distribution groups from release groups
  const distributionGroups: MockDistributionGroup[] = release.releaseGroups.flatMap((rg) => {
    const groups: MockDistributionGroup[] = []
    if (rg.appGroup) {
      groups.push({
        id: rg.appGroup.id,
        name: rg.appGroup.name,
        memberCount: rg.appGroup._count.members,
      })
    }
    if (rg.orgGroup) {
      groups.push({
        id: rg.orgGroup.id,
        name: rg.orgGroup.name,
        memberCount: rg.orgGroup._count.members,
      })
    }
    return groups
  })

  return (
    <ReleaseDetailsContent
      release={adaptedRelease}
      appName={release.app.name}
      appId={release.app.id}
      platform={release.app.platform}
      otaToken={otaToken}
      distributionGroups={distributionGroups}
    />
  )
}
