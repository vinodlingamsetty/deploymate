'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { MockDistributionGroup, MockRelease, Platform } from '@/types/app'
import { getIosOtaWarning } from '@/lib/ios-ota'
import { fetchOtaDiagnostics } from '@/lib/ota-diagnostics'
import type { OtaDiagnosticsResult } from '@/lib/ota-diagnostics'
import { ReleaseDetailsHeader } from './release-details-header'
import { ReleaseDetailsStats } from './release-details-stats'

interface ReleaseDetailsContentProps {
  release: MockRelease
  appName: string
  appId: string
  platform: Platform
  otaToken?: string
  distributionGroups: MockDistributionGroup[]
}

export function ReleaseDetailsContent({
  release,
  appName,
  appId,
  platform,
  otaToken,
  distributionGroups,
}: ReleaseDetailsContentProps) {
  const otaWarning = getIosOtaWarning(platform, release.signingType)
  const [otaReadiness, setOtaReadiness] = useState<OtaDiagnosticsResult | null>(null)
  const [otaReadinessLoading, setOtaReadinessLoading] = useState(false)
  const [otaReadinessError, setOtaReadinessError] = useState<string | null>(null)
  const [otaReadinessExpanded, setOtaReadinessExpanded] = useState(false)
  const showOtaReadiness = platform === 'IOS' && Boolean(otaToken)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [release.id])

  useEffect(() => {
    if (!showOtaReadiness || !otaToken) {
      setOtaReadiness(null)
      setOtaReadinessLoading(false)
      setOtaReadinessError(null)
      return
    }

    let cancelled = false
    setOtaReadinessLoading(true)
    setOtaReadinessError(null)

    void fetchOtaDiagnostics(release.id, otaToken)
      .then((result) => {
        if (cancelled) return
        setOtaReadiness(result)
      })
      .catch(() => {
        if (cancelled) return
        setOtaReadinessError('Unable to load iOS OTA readiness checks.')
      })
      .finally(() => {
        if (cancelled) return
        setOtaReadinessLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [showOtaReadiness, otaToken, release.id])

  async function handleCopyOtaDiagnostics() {
    const payload = {
      copiedAt: new Date().toISOString(),
      release: {
        id: release.id,
        version: release.version,
        buildNumber: release.buildNumber,
        platform,
        signingType: release.signingType,
      },
      readiness: otaReadiness,
      error: otaReadinessError,
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      toast.success('OTA diagnostics copied to clipboard')
    } catch {
      toast.error('Unable to copy diagnostics to clipboard')
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <ReleaseDetailsHeader
        release={release}
        appName={appName}
        appId={appId}
        platform={platform}
        otaToken={otaToken}
      />

      {otaWarning && (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          {otaWarning}
        </div>
      )}

      <div className="mt-6">
        <ReleaseDetailsStats release={release} platform={platform} />
      </div>

      <Separator className="mt-6" />

      {showOtaReadiness && (
        <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 font-semibold text-left"
              onClick={() => setOtaReadinessExpanded((value) => !value)}
              aria-expanded={otaReadinessExpanded}
              aria-label="Toggle iOS OTA readiness details"
            >
              <ChevronDown
                className={`size-4 transition-transform ${otaReadinessExpanded ? 'rotate-0' : '-rotate-90'}`}
                aria-hidden="true"
              />
              iOS OTA Readiness
            </button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => void handleCopyOtaDiagnostics()}
              disabled={otaReadinessLoading}
              aria-label="Copy OTA diagnostics"
            >
              <Copy className="size-3.5" aria-hidden="true" />
              Copy diagnostics
            </Button>
          </div>
          {otaReadinessExpanded && (
            <>
              {otaReadinessLoading && (
                <p className="mt-2 text-muted-foreground">Checking OTA prerequisites...</p>
              )}
              {otaReadinessError && (
                <p className="mt-2 text-rose-600 dark:text-rose-400">{otaReadinessError}</p>
              )}
              {!otaReadinessLoading && otaReadiness && (
                <div className="mt-2 space-y-1">
                  {otaReadiness.checks.map((check) => (
                    <p
                      key={check.key}
                      className={
                        check.status === 'fail'
                          ? 'text-rose-600 dark:text-rose-400'
                          : check.status === 'warn'
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-emerald-700 dark:text-emerald-300'
                      }
                    >
                      {check.message}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

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
          {distributionGroups.length > 0 ? (
            distributionGroups.map((group) => (
              <span
                key={group.id}
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
              >
                {group.name}
                <span className="ml-1.5 text-muted-foreground">
                  {group.memberCount}
                </span>
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No distribution groups assigned.</p>
          )}
        </div>
      </div>
    </div>
  )
}
