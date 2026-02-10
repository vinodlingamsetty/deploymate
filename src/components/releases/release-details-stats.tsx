import { Calendar, Download, HardDrive, Smartphone } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { MockRelease } from '@/types/app'

interface ReleaseDetailsStatsProps {
  release: MockRelease
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ReleaseDetailsStats({ release }: ReleaseDetailsStatsProps) {
  return (
    <>
      {/* Desktop layout */}
      <div className="hidden sm:grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4 shrink-0" aria-hidden="true" />
              <span>Release Date</span>
            </div>
            <p className="mt-1 text-lg font-semibold">
              {formatDate(release.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Download className="size-4 shrink-0" aria-hidden="true" />
              <span>Downloads</span>
            </div>
            <p className="mt-1 text-lg font-semibold">{release.downloadCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HardDrive className="size-4 shrink-0" aria-hidden="true" />
              <span>Build Size</span>
            </div>
            <p className="mt-1 text-lg font-semibold">{formatBytes(release.fileSize)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="size-4 shrink-0" aria-hidden="true" />
              <span>Min OS Version</span>
            </div>
            <p className="mt-1 text-lg font-semibold">
              {release.minOSVersion ?? '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Release Date</span>
            </div>
            <p className="mt-1 text-sm font-semibold">
              {formatDate(release.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Download className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Downloads</span>
            </div>
            <p className="mt-1 text-sm font-semibold">{release.downloadCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HardDrive className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Build Size</span>
            </div>
            <p className="mt-1 text-sm font-semibold">{formatBytes(release.fileSize)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Smartphone className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Min OS</span>
            </div>
            <p className="mt-1 text-sm font-semibold">
              {release.minOSVersion ?? '—'}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
