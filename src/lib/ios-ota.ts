import type { Platform } from '@/types/app'

export function getIosOtaWarning(platform: Platform, signingType: string | null): string | null {
  if (platform !== 'IOS') return null

  if (signingType === 'appstore') {
    return 'App Store-signed builds cannot be installed over-the-air. Use an Ad Hoc or Enterprise signed IPA.'
  }

  if (!signingType) {
    return 'Signing profile was not detected. Verify this IPA is Ad Hoc or Enterprise signed for OTA install.'
  }

  return null
}

