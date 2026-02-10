'use client'

import { useEffect } from 'react'

import { Separator } from '@/components/ui/separator'
import { MOCK_DISTRIBUTION_GROUPS } from '@/lib/mock-data'
import type { MockRelease, Platform } from '@/types/app'
import { ReleaseDetailsHeader } from './release-details-header'
import { ReleaseDetailsStats } from './release-details-stats'

interface ReleaseDetailsContentProps {
  release: MockRelease
  appName: string
  appId: string
  platform: Platform
  otaToken?: string
}

export function ReleaseDetailsContent({
  release,
  appName,
  appId,
  platform,
  otaToken,
}: ReleaseDetailsContentProps) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [release.id])

  return (
    <div className="px-4 py-6 sm:px-6">
      <ReleaseDetailsHeader
        release={release}
        appName={appName}
        appId={appId}
        platform={platform}
        otaToken={otaToken}
      />

      <div className="mt-6">
        <ReleaseDetailsStats release={release} />
      </div>

      <Separator className="mt-6" />

      {/* Release Notes */}
      <div className="mt-6">
        <h2 className="text-base font-semibold">Release Notes</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
          {release.releaseNotes || 'No release notes provided.'}
        </p>
      </div>

      <Separator className="mt-6" />

      {/* Distribution Groups */}
      <div className="mt-6">
        <h2 className="text-base font-semibold">Distribution Groups</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {MOCK_DISTRIBUTION_GROUPS.map((group) => (
            <span
              key={group.id}
              className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
            >
              {group.name}
              <span className="ml-1.5 text-muted-foreground">
                {group.memberCount}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
