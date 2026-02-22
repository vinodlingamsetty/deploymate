export interface OtaOriginResult {
  origin: string
  source: 'request' | 'app_url'
  requestOrigin: string | null
  appUrlOrigin: string | null
  mismatch: boolean
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
  const requestUrl = new URL(request.url)
  const forwardedProto = firstHeaderValue(request, 'x-forwarded-proto')
  const forwardedHost = firstHeaderValue(request, 'x-forwarded-host')
  const proto = forwardedProto ?? requestUrl.protocol.replace(':', '')
  const host = forwardedHost ?? requestUrl.host
  const requestOrigin = toValidatedOrigin(`${proto}://${host}`)

  let appUrlOrigin: string | null = null
  if (appUrl) {
    appUrlOrigin = toValidatedOrigin(appUrl)
    if (!appUrlOrigin && !requestOrigin) {
      return { error: 'APP_URL is not a valid URL' }
    }
    if (appUrlOrigin && requireHttps && !appUrlOrigin.startsWith('https://') && !requestOrigin) {
      return { error: 'APP_URL must use HTTPS for iOS OTA installs' }
    }
  }

  if (requestOrigin && (!requireHttps || requestOrigin.startsWith('https://'))) {
    return {
      origin: requestOrigin,
      source: 'request',
      requestOrigin,
      appUrlOrigin,
      mismatch: Boolean(appUrlOrigin && appUrlOrigin !== requestOrigin),
    }
  }

  if (appUrlOrigin) {
    if (requireHttps && !appUrlOrigin.startsWith('https://')) {
      return { error: 'APP_URL must use HTTPS for iOS OTA installs' }
    }
    return {
      origin: appUrlOrigin,
      source: 'app_url',
      requestOrigin,
      appUrlOrigin,
      mismatch: Boolean(requestOrigin && requestOrigin !== appUrlOrigin),
    }
  }

  if (!requestOrigin) {
    return { error: 'Unable to resolve public origin for OTA manifest' }
  }
  if (requireHttps && !requestOrigin.startsWith('https://')) {
    return { error: 'Public origin must use HTTPS for iOS OTA installs' }
  }

  return {
    origin: requestOrigin,
    source: 'request',
    requestOrigin,
    appUrlOrigin,
    mismatch: false,
  }
}
