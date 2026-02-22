import type { Platform } from '@/types/app'

export function getIosOtaWarning(platform: Platform, signingType: string | null): string | null {
  if (platform !== 'IOS') return null

  if (signingType === 'appstore') {
    return 'App Store-signed builds cannot be installed over-the-air. OTA requires an Ad Hoc or Enterprise signed IPA.'
  }

  if (signingType === 'development') {
    return 'Development-signed builds are not supported for OTA install. OTA requires an Ad Hoc or Enterprise signed IPA.'
  }

  if (!signingType) {
    return 'Signing profile was not detected. OTA requires an Ad Hoc or Enterprise signed IPA.'
  }

  return null
}
