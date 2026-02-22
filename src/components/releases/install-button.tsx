'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { Platform } from '@/types/app'
import { buildItmsServicesUrl, buildManifestUrl, resolveClientOtaBaseUrl } from '@/lib/ota-client'

interface InstallButtonProps {
  releaseId: string
  platform: Platform
  otaToken?: string
  colors: { bg: string; text: string }
  className?: string
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  // iPhone, iPod, and older iPad (pre-iPadOS 13)
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true
  // iPad on iPadOS 13+ requests the desktop site and shows "Macintosh" in the UA.
  // Detect it by checking for a Mac platform with touch support.
  if (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) return true
  return false
}

async function triggerDownload(releaseId: string, platform: Platform): Promise<void> {
  const response = await fetch(`/api/v1/releases/${releaseId}/download`)

  if (!response.ok) {
    let message = 'Download failed'
    try {
      const body = await response.json() as { error?: { message?: string } }
      if (body.error?.message) {
        message = body.error.message
      }
    } catch {
      // Response wasn't JSON — use status text
      message = `Download failed (${response.status} ${response.statusText})`
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const ext = platform === 'IOS' ? 'ipa' : 'apk'
  const a = document.createElement('a')
  a.href = url
  a.download = `release.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function InstallButton({
  releaseId,
  platform,
  otaToken,
  colors,
  className,
}: InstallButtonProps) {
  const [downloading, setDownloading] = useState(false)
  const [iosDevice, setIosDevice] = useState(false)

  useEffect(() => {
    setIosDevice(isIosDevice())
  }, [])

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      await triggerDownload(releaseId, platform)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }, [releaseId, platform])

  const browserOrigin = typeof window !== 'undefined' ? window.location.origin : null
  const baseUrl = resolveClientOtaBaseUrl(browserOrigin, process.env.NEXT_PUBLIC_APP_URL)
  const otaHref = iosDevice && platform === 'IOS' && otaToken
    ? (baseUrl
        ? buildItmsServicesUrl(buildManifestUrl(baseUrl, releaseId, otaToken))
        : null)
    : null

  const httpsError = iosDevice && platform === 'IOS' && !!otaToken && !baseUrl

  const label = platform === 'IOS' && iosDevice ? 'Install' : platform === 'IOS' ? 'Download IPA' : 'Download APK'

  const buttonStyle = { backgroundColor: colors.bg, color: colors.text }
  const icon = downloading
    ? <Loader2 className="size-4 sm:mr-2 animate-spin" aria-hidden="true" />
    : <Download className="size-4 sm:mr-2" aria-hidden="true" />
  const labelText = <span className="hidden sm:inline">{downloading ? 'Downloading…' : label}</span>

  // iOS with valid OTA token over HTTPS: render as native <a> so the browser/OS
  // handles the itms-services:// scheme.
  if (otaHref) {
    return (
      <Button asChild className={className} style={buttonStyle} aria-label={label}>
        <a href={otaHref}>
          {icon}
          {labelText}
        </a>
      </Button>
    )
  }

  // iOS OTA requires HTTPS — NEXT_PUBLIC_APP_URL is missing or HTTP
  if (httpsError) {
    return (
      <Button
        className={className}
        style={buttonStyle}
        onClick={() => toast.error('iOS OTA install requires an HTTPS public URL.')}
        aria-label={label}
      >
        {icon}
        {labelText}
      </Button>
    )
  }

  // iOS device but missing token: show error on tap
  if (iosDevice && platform === 'IOS') {
    return (
      <Button
        className={className}
        style={buttonStyle}
        onClick={() => toast.error('Unable to generate install link')}
        aria-label={label}
      >
        {icon}
        {labelText}
      </Button>
    )
  }

  // Non-iOS: download via fetch
  return (
    <Button
      className={className}
      style={buttonStyle}
      onClick={handleDownload}
      disabled={downloading}
      aria-label={label}
    >
      {icon}
      {labelText}
    </Button>
  )
}
