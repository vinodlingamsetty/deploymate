'use client'

import { useCallback } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { Platform } from '@/types/app'

interface InstallButtonProps {
  releaseId: string
  platform: Platform
  otaToken?: string
  colors: { bg: string; text: string }
  className?: string
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function triggerDownload(releaseId: string): void {
  const a = document.createElement('a')
  a.href = `/api/v1/releases/${releaseId}/download`
  a.download = ''
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function getLabel(platform: Platform): string {
  if (platform === 'IOS') {
    return isIosDevice() ? 'Install' : 'Download IPA'
  }
  return 'Download APK'
}

export function InstallButton({
  releaseId,
  platform,
  otaToken,
  colors,
  className,
}: InstallButtonProps) {
  const handleInstall = useCallback(() => {
    if (platform === 'IOS' && isIosDevice()) {
      if (!otaToken) {
        toast.error('Unable to generate install link')
        return
      }
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      const manifestUrl = `${baseUrl}/api/v1/releases/${releaseId}/manifest?token=${otaToken}`
      window.location.href = `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`
    } else {
      triggerDownload(releaseId)
    }
  }, [platform, releaseId, otaToken])

  const label = getLabel(platform)

  return (
    <Button
      className={className}
      style={{ backgroundColor: colors.bg, color: colors.text }}
      onClick={handleInstall}
      aria-label={label}
    >
      <Download className="size-4 sm:mr-2" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
