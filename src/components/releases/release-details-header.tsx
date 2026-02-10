'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { InstallButton } from '@/components/releases/install-button'
import type { MockRelease, Platform } from '@/types/app'
import { getReleaseTypeLabel, RELEASE_TYPE_COLORS } from '@/types/app'

interface ReleaseDetailsHeaderProps {
  release: MockRelease
  appName: string
  appId: string
  platform: Platform
  otaToken?: string
}

export function ReleaseDetailsHeader({
  release,
  appName,
  appId,
  platform,
  otaToken,
}: ReleaseDetailsHeaderProps) {
  const colors = RELEASE_TYPE_COLORS[release.releaseType]

  return (
    <div className="flex items-start gap-3 sm:items-center">
      {/* Back button */}
      <Button variant="ghost" size="icon" asChild className="shrink-0">
        <Link href={`/apps/${appId}`} scroll={false} aria-label="Back to app">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
      </Button>

      {/* App name + version + badge */}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm text-muted-foreground"
          title={appName}
        >
          {appName}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xl font-bold">
            v{release.version}
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            ({release.buildNumber})
          </span>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {getReleaseTypeLabel(release.releaseType)}
          </span>
        </div>
      </div>

      {/* Install / Download button */}
      <InstallButton
        releaseId={release.id}
        platform={platform}
        otaToken={otaToken}
        colors={colors}
        className="shrink-0"
      />
    </div>
  )
}
