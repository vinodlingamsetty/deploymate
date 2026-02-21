import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { AppDetailsHeader } from '@/components/apps/app-details-header'
import { AppStats } from '@/components/apps/app-stats'
import { AppTabs } from '@/components/apps/app-tabs'
import type { MockApp, MockRelease, Platform, ReleaseTypeName, MockAppDistGroup } from '@/types/app'

interface AppDetailsPageProps {
  params: { id: string }
}

export default async function AppDetailsPage({ params }: AppDetailsPageProps) {
  const session = await auth()
  if (!session?.user) {
    notFound()
  }

  const app = await db.app.findUnique({
    where: { id: params.id },
    include: {
      organization: { select: { name: true, slug: true } },
      releases: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          version: true,
          releaseType: true,
          createdAt: true,
        },
      },
    },
  })

  if (!app) {
    notFound()
  }

  // Check access
  const membership = await db.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId: app.orgId } },
  })

  if (!membership && !session.user.isSuperAdmin) {
    notFound()
  }

  const isAdmin = session.user.isSuperAdmin || membership?.role === 'ADMIN'

  // Fetch releases
  const dbReleases = await db.release.findMany({
    where: { appId: app.id },
    orderBy: { createdAt: 'desc' },
  })

  // Get total downloads
  const downloads = await db.release.aggregate({
    where: { appId: app.id },
    _sum: { downloadCount: true },
  })

  // Fetch app groups
  const appGroups = await db.appDistGroup.findMany({
    where: { appId: app.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { members: true } },
    },
  })

  // Adapt to MockApp interface
  const adaptedApp: MockApp = {
    id: app.id,
    name: app.name,
    platform: app.platform as Platform,
    iconUrl: app.iconUrl,
    org: { name: app.organization.name, slug: app.organization.slug },
    latestRelease: app.releases[0]
      ? {
          version: app.releases[0].version,
          releaseType: app.releases[0].releaseType as ReleaseTypeName,
          createdAt: app.releases[0].createdAt.toISOString(),
        }
      : null,
    testerCount: appGroups.reduce((sum, g) => sum + g._count.members, 0),
    totalDownloads: downloads._sum.downloadCount ?? 0,
  }

  // Adapt to MockRelease interface
  const adaptedReleases: MockRelease[] = dbReleases.map((r) => ({
    id: r.id,
    appId: r.appId,
    version: r.version,
    buildNumber: r.buildNumber,
    releaseType: r.releaseType as ReleaseTypeName,
    releaseNotes: r.releaseNotes ?? '',
    fileSize: r.fileSize,
    downloadCount: r.downloadCount,
    createdAt: r.createdAt.toISOString(),
    minOSVersion: r.minOSVersion,
    signingType: r.signingType,
    provisioningName: r.provisioningName,
    teamName: r.teamName,
    provisioningExpiry: r.provisioningExpiry ? r.provisioningExpiry.toISOString() : null,
  }))

  // Adapt to MockAppDistGroup interface
  const adaptedGroups: MockAppDistGroup[] = appGroups.map((g) => ({
    id: g.id,
    appId: g.appId,
    name: g.name,
    description: g.description,
    memberCount: g._count.members,
    createdAt: g.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <AppDetailsHeader app={adaptedApp} />
      <AppStats app={adaptedApp} />
      <AppTabs
        releases={adaptedReleases}
        appId={app.id}
        isAdmin={isAdmin}
        initialGroups={adaptedGroups}
      />
    </div>
  )
}
