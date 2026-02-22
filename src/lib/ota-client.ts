function normalizeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null

  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:') return null
    return parsed.origin
  } catch {
    return null
  }
}

export function resolveClientOtaBaseUrl(
  windowOrigin: string | null | undefined,
  envBaseUrl: string | null | undefined,
): string | null {
  return normalizeHttpsUrl(windowOrigin) ?? normalizeHttpsUrl(envBaseUrl)
}

export function buildManifestUrl(baseUrl: string, releaseId: string, otaToken: string): string {
  return `${baseUrl}/api/v1/releases/${releaseId}/manifest?token=${encodeURIComponent(otaToken)}`
}

export function buildItmsServicesUrl(manifestUrl: string): string {
  return `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`
}

