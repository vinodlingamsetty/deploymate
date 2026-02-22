interface OtaOriginResult {
  origin: string
}

interface OtaOriginError {
  error: string
}

function firstHeaderValue(request: Request, name: string): string | null {
  const value = request.headers.get(name)
  if (!value) return null
  const first = value.split(',')[0]?.trim()
  return first || null
}

function toValidatedOrigin(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).origin
  } catch {
    return null
  }
}

export function resolveOtaPublicOrigin(request: Request): OtaOriginResult | OtaOriginError {
  const requireHttps = process.env.NODE_ENV === 'production'
  const appUrl = process.env.APP_URL?.trim()

  if (appUrl) {
    const origin = toValidatedOrigin(appUrl)
    if (!origin) {
      return { error: 'APP_URL is not a valid URL' }
    }
    if (requireHttps && !origin.startsWith('https://')) {
      return { error: 'APP_URL must use HTTPS for iOS OTA installs' }
    }
    return { origin }
  }

  const requestUrl = new URL(request.url)
  const forwardedProto = firstHeaderValue(request, 'x-forwarded-proto')
  const forwardedHost = firstHeaderValue(request, 'x-forwarded-host')
  const proto = forwardedProto ?? requestUrl.protocol.replace(':', '')
  const host = forwardedHost ?? requestUrl.host

  const derivedOrigin = toValidatedOrigin(`${proto}://${host}`)
  if (!derivedOrigin) {
    return { error: 'Unable to resolve public origin for OTA manifest' }
  }
  if (requireHttps && !derivedOrigin.startsWith('https://')) {
    return { error: 'Public origin must use HTTPS for iOS OTA installs' }
  }

  return { origin: derivedOrigin }
}

