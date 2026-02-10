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

export function InstallButton({
  releaseId,
  platform,
  otaToken,
  colors,
  className,
}: InstallButtonProps) {
  const handleInstall = useCallback(() => {
    if (platform === 'IOS') {
      if (!isIosDevice()) {
        toast.warning('iOS install requires Safari on an iOS device')
        return
      }
      if (!otaToken) {
        toast.error('Unable to generate install link')
        return
      }
      const manifestUrl = `${window.location.origin}/api/v1/releases/${releaseId}/manifest?token=${otaToken}`
      window.location.href = `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`
    } else {
      window.location.href = `/api/v1/releases/${releaseId}/download`
    }
  }, [platform, releaseId, otaToken])

  const label = platform === 'IOS' ? 'Install' : 'Download APK'

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
