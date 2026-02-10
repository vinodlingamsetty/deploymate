import Link from 'next/link'
import { Calendar, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { MockRelease } from '@/types/app'
import { getReleaseTypeLabel, RELEASE_TYPE_COLORS } from '@/types/app'

interface ReleaseCardProps {
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

export function ReleaseCard({ release }: ReleaseCardProps) {
  const colors = RELEASE_TYPE_COLORS[release.releaseType]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: version info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold">
                v{release.version}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ({release.buildNumber})
              </span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {getReleaseTypeLabel(release.releaseType)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" aria-hidden="true" />
                {formatDate(release.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="size-3.5" aria-hidden="true" />
                {release.downloadCount} downloads
              </span>
              <span className="text-xs">{formatBytes(release.fileSize)}</span>
            </div>

            {release.releaseNotes && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {release.releaseNotes}
              </p>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex shrink-0 flex-col gap-2">
            <Button
              size="sm"
              style={{ backgroundColor: colors.bg, color: colors.text }}
              aria-label={`Download v${release.version}`}
            >
              <Download className="mr-1.5 size-3.5" aria-hidden="true" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              aria-label={`View details for v${release.version}`}
            >
              <Link href={`/releases/${release.id}`}>View Details</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
