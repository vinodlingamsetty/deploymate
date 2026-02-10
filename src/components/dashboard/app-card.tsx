import Link from 'next/link'
import { Building2, Tag, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import type { MockApp } from '@/types/app'
import {
  getPlatformLabel,
  getReleaseTypeLabel,
  RELEASE_TYPE_COLORS,
} from '@/types/app'

interface AppCardProps {
  app: MockApp
}

export function AppCard({ app }: AppCardProps) {
  const badgeColors = app.latestRelease
    ? RELEASE_TYPE_COLORS[app.latestRelease.releaseType]
    : null

  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 p-4">
        {/* Top: icon + name + badges */}
        <div className="flex items-start gap-3">
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl"
            aria-hidden="true"
          >
            {app.platform === 'IOS' ? '🍎' : '🤖'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-tight">{app.name}</h3>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                {getPlatformLabel(app.platform)}
              </span>
              {app.latestRelease && badgeColors && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: badgeColors.bg,
                    color: badgeColors.text,
                  }}
                >
                  {getReleaseTypeLabel(app.latestRelease.releaseType)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle: metadata */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{app.org.name}</span>
          </div>
          {app.latestRelease && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="font-mono text-xs">v{app.latestRelease.version}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{app.testerCount} testers</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/apps/${app.id}`} scroll={false}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
