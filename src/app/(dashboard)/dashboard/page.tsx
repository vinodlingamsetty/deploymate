import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { AppCard } from '@/components/dashboard/app-card'
import { AppListRow } from '@/components/dashboard/app-list-row'
import type { MockApp } from '@/types/app'

interface DashboardPageProps {
  searchParams: {
    org?: string
    platform?: string
    type?: string
    view?: string
    search?: string
  }
}

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return 'there'
  const first = fullName.trim().split(/\s+/)[0]
  return first || 'there'
}

function filterApps(
  apps: MockApp[],
  {
    org,
    platform,
    type,
    search,
  }: { org?: string; platform?: string; type?: string; search?: string }
): MockApp[] {
  let filtered = apps

  if (org) {
    filtered = filtered.filter((a) => a.org.slug === org)
  }
  if (platform) {
    filtered = filtered.filter((a) => a.platform === platform)
  }
  if (type) {
    filtered = filtered.filter((a) => a.latestRelease?.releaseType === type)
  }
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.org.name.toLowerCase().includes(q) ||
        (a.latestRelease?.version.toLowerCase().includes(q) ?? false)
    )
  }

  return filtered
}

async function DashboardContent({ searchParams }: DashboardPageProps) {
  const session = await auth()
  const firstName = getFirstName(session?.user?.name)

  const { org, platform, type, view, search } = searchParams

  const { db } = await import('@/lib/db')

  const memberships = await db.membership.findMany({
    where: { userId: session!.user.id },
    include: { org: { select: { id: true, name: true, slug: true } } },
    orderBy: { org: { name: 'asc' } },
  })
  const allOrgs = memberships.map((m) => ({ id: m.org.id, name: m.org.name, slug: m.org.slug }))

  const apps = await db.app.findMany({
    where: { organization: { memberships: { some: { userId: session!.user.id } } } },
    orderBy: { createdAt: 'desc' },
    include: {
      organization: { select: { name: true, slug: true } },
      releases: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { version: true, releaseType: true, createdAt: true },
      },
    },
  })

  const allApps: MockApp[] = apps.map((app) => ({
    id: app.id,
    name: app.name,
    platform: app.platform,
    iconUrl: app.iconUrl,
    org: { name: app.organization.name, slug: app.organization.slug },
    latestRelease: app.releases[0]
      ? {
          version: app.releases[0].version,
          releaseType: app.releases[0].releaseType,
          createdAt: app.releases[0].createdAt.toISOString(),
        }
      : null,
    testerCount: 0,
    totalDownloads: 0,
  }))

  const sanitizedSearch = search?.slice(0, 256)
  const filteredApps = filterApps(allApps, { org, platform, type, search: sanitizedSearch })

  const isListView = view === 'list'
  const hasActiveFilters = Boolean(org || platform || type || search)

  return (
    <div className="space-y-6">
      <DashboardHeader
        firstName={firstName}
        organizations={allOrgs}
        currentOrg={org ?? ''}
        currentPlatform={platform ?? ''}
        currentType={type ?? ''}
        currentView={view ?? 'grid'}
      />

      <p className="sr-only" aria-live="polite" role="status">
        {filteredApps.length} {filteredApps.length === 1 ? 'app' : 'apps'} found
      </p>

      {filteredApps.length === 0 ? (
        <EmptyState hasActiveFilters={hasActiveFilters} />
      ) : isListView ? (
        <AppListView apps={filteredApps} />
      ) : (
        <AppGridView apps={filteredApps} />
      )}
    </div>
  )
}

function AppGridView({ apps }: { apps: MockApp[] }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Apps grid"
    >
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  )
}

function AppListView({ apps }: { apps: MockApp[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full" aria-label="Apps list">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-sm font-medium text-muted-foreground">
            <th className="px-4 py-3">Name</th>
            <th className="hidden px-4 py-3 sm:table-cell">Org</th>
            <th className="hidden px-4 py-3 md:table-cell">Platform</th>
            <th className="hidden px-4 py-3 lg:table-cell">Version</th>
            <th className="hidden px-4 py-3 md:table-cell">Type</th>
            <th className="hidden px-4 py-3 lg:table-cell">Testers</th>
            <th className="px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <AppListRow key={app.id} app={app} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  if (hasActiveFilters) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-lg font-semibold">No apps found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No apps match your current filters. Try adjusting your search or filters.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <p className="text-lg font-semibold">No apps yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first app to start distributing builds to testers.
      </p>
    </div>
  )
}

export default function DashboardPage(props: DashboardPageProps) {
  return (
    <Suspense>
      <DashboardContent {...props} />
    </Suspense>
  )
}
