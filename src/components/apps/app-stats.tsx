import { Download, Tag, Users } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { MockApp } from '@/types/app'

interface AppStatsProps {
  app: MockApp
}

export function AppStats({ app }: AppStatsProps) {
  const latestVersion = app.latestRelease?.version ?? '—'

  return (
    <>
      {/* Desktop: 3-card grid */}
      <div className="hidden grid-cols-3 gap-4 sm:grid" aria-label="App statistics">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Tag className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Latest Version</p>
              <p className="font-mono text-sm font-semibold">
                {latestVersion !== '—' ? `v${latestVersion}` : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Users className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Members</p>
              <p className="text-sm font-semibold">{app.testerCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Download className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Downloads</p>
              <p className="text-sm font-semibold">{app.totalDownloads}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: compact list */}
      <div
        className="divide-y rounded-lg border sm:hidden"
        aria-label="App statistics"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="size-3.5" aria-hidden="true" />
            Latest Version
          </span>
          <span className="font-mono text-sm font-semibold">
            {latestVersion !== '—' ? `v${latestVersion}` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-3.5" aria-hidden="true" />
            Total Members
          </span>
          <span className="text-sm font-semibold">{app.testerCount}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Download className="size-3.5" aria-hidden="true" />
            Total Downloads
          </span>
          <span className="text-sm font-semibold">{app.totalDownloads}</span>
        </div>
      </div>
    </>
  )
}
