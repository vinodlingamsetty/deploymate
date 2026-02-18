import { Building2, Calendar, Download, HardDrive, Shield, Smartphone } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { MockRelease } from '@/types/app'
import { SIGNING_TYPE_LABELS } from '@/types/app'

interface ReleaseDetailsStatsProps {
  release: MockRelease
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ReleaseDetailsStats({ release }: ReleaseDetailsStatsProps) {
  const signingLabel = release.signingType ? SIGNING_TYPE_LABELS[release.signingType] : undefined

  return (
    <>
      {/* Desktop layout */}
      <div className={`hidden sm:grid gap-4 ${signingLabel ? 'grid-cols-3' : 'grid-cols-2'}`}>
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

        {signingLabel && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="size-4 shrink-0" aria-hidden="true" />
                  <span>Signing</span>
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {signingLabel?.label ?? 'Unknown'}
                </p>
                {release.provisioningExpiry && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Expires {formatDate(release.provisioningExpiry)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="size-4 shrink-0" aria-hidden="true" />
                  <span>Team</span>
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {release.teamName ?? '—'}
                </p>
                {release.provisioningName && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {release.provisioningName}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
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

        {signingLabel && (
          <>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>Signing</span>
                </div>
                <p className="mt-1 text-sm font-semibold">
                  {signingLabel?.label ?? 'Unknown'}
                </p>
                {release.provisioningExpiry && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Exp. {formatDate(release.provisioningExpiry)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>Team</span>
                </div>
                <p className="mt-1 text-sm font-semibold">
                  {release.teamName ?? '—'}
                </p>
                {release.provisioningName && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {release.provisioningName}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
