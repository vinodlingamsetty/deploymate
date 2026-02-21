import { Award, Calendar, Download, HardDrive, Shield, Smartphone } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { MockRelease, Platform } from '@/types/app'
import { SIGNING_TYPE_LABELS } from '@/types/app'

interface ReleaseDetailsStatsProps {
  release: MockRelease
  platform: Platform
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

function getCertificateType(signingType: string | null): string {
  switch (signingType) {
    case 'development':
      return 'Development'
    case 'adhoc':
    case 'appstore':
      return 'Distribution'
    case 'enterprise':
      return 'Enterprise'
    default:
      return 'Unknown'
  }
}

export function ReleaseDetailsStats({ release, platform }: ReleaseDetailsStatsProps) {
  const signingLabel = release.signingType ? SIGNING_TYPE_LABELS[release.signingType] : undefined
  const showSigningInfo = platform === 'IOS'

  return (
    <>
      {/* Desktop layout */}
      <div className={`hidden sm:grid gap-4 ${showSigningInfo ? 'grid-cols-3' : 'grid-cols-2'}`}>
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

        {showSigningInfo && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="size-4 shrink-0" aria-hidden="true" />
                  <span>Profile</span>
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {signingLabel?.label ?? 'Not Signed'}
                </p>
                {release.provisioningName && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate" title={release.provisioningName}>
                    {release.provisioningName}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="size-4 shrink-0" aria-hidden="true" />
                  <span>Certificate</span>
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {getCertificateType(release.signingType)}
                </p>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  <p className="truncate" title={release.teamName ?? '—'}>{release.teamName ?? '—'}</p>
                  {release.provisioningExpiry && (
                    <p>Expires {formatDate(release.provisioningExpiry)}</p>
                  )}
                </div>
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

        {showSigningInfo && (
          <>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>Profile</span>
                </div>
                <p className="mt-1 text-sm font-semibold">
                  {signingLabel?.label ?? 'Not Signed'}
                </p>
                {release.provisioningName && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate" title={release.provisioningName}>
                    {release.provisioningName}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Award className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>Certificate</span>
                </div>
                <p className="mt-1 text-sm font-semibold">
                  {getCertificateType(release.signingType)}
                </p>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  <p className="truncate" title={release.teamName ?? '—'}>{release.teamName ?? '—'}</p>
                  {release.provisioningExpiry && (
                    <p>Exp. {formatDate(release.provisioningExpiry)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
