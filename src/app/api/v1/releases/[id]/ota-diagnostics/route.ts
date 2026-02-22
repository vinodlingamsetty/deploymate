import { verifyOtaToken } from '@/lib/ota-token'
import { resolveOtaPublicOrigin } from '@/lib/ota-origin'
import type { OtaDiagnosticCheck, OtaDiagnosticsResult } from '@/lib/ota-diagnostics'

function diagnosticsResponse(result: OtaDiagnosticsResult, status = 200): Response {
  return Response.json(result, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

function failureResult(
  key: string,
  message: string,
  originSource: 'request' | 'app_url' | null = null,
): OtaDiagnosticsResult {
  return {
    ok: false,
    checks: [{ key, status: 'fail', message }],
    resolved: {
      manifestUrl: null,
      downloadUrl: null,
      originSource,
      mismatch: false,
    },
  }
}

function addCheck(
  checks: OtaDiagnosticCheck[],
  key: string,
  status: OtaDiagnosticCheck['status'],
  message: string,
) {
  checks.push({ key, status, message })
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase()
  if (!normalized) return true
  if (normalized === 'localhost' || normalized.endsWith('.local')) return true
  if (normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  if (normalized.startsWith('fe80:')) return true

  const ipv4 = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!ipv4) return false
  const octets = ipv4.slice(1).map((part) => Number(part))
  if (octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return false

  if (octets[0] === 10) return true
  if (octets[0] === 127) return true
  if (octets[0] === 192 && octets[1] === 168) return true
  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true
  return false
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return diagnosticsResponse(failureResult('token', 'Invalid or expired OTA token'), 401)
  }

  const userId = verifyOtaToken(token, params.id)
  if (!userId) {
    return diagnosticsResponse(failureResult('token', 'Invalid or expired OTA token'), 401)
  }

  const { db } = await import('@/lib/db')
  const release = await db.release.findUnique({
    where: { id: params.id },
    include: { app: true },
  })

  if (!release) {
    return diagnosticsResponse(failureResult('release', 'Release not found'), 404)
  }

  if (userId !== 'public-install') {
    const [membership, user] = await Promise.all([
      db.membership.findUnique({
        where: { userId_orgId: { userId, orgId: release.app.orgId } },
      }),
      db.user.findUnique({
        where: { id: userId },
        select: { isSuperAdmin: true },
      }),
    ])

    if (!membership && !user?.isSuperAdmin) {
      return diagnosticsResponse(failureResult('authorization', 'Access denied'), 403)
    }
  }

  const checks: OtaDiagnosticCheck[] = []

  if (release.app.platform === 'IOS') {
    addCheck(checks, 'platform', 'pass', 'Release platform is iOS.')
  } else {
    addCheck(checks, 'platform', 'fail', 'OTA install is only supported for iOS releases.')
  }

  if (release.signingType === 'adhoc' || release.signingType === 'enterprise') {
    addCheck(checks, 'signing', 'pass', `Signing type is ${release.signingType}.`)
  } else if (release.signingType === 'appstore') {
    addCheck(
      checks,
      'signing',
      'fail',
      'App Store-signed builds cannot be installed via OTA. Use Ad Hoc or Enterprise signing.',
    )
  } else if (release.signingType === 'development') {
    addCheck(
      checks,
      'signing',
      'fail',
      'Development-signed builds are not supported for OTA install. Use Ad Hoc or Enterprise signing.',
    )
  } else {
    addCheck(
      checks,
      'signing',
      'fail',
      'Signing metadata was not detected. OTA install requires Ad Hoc or Enterprise signing.',
    )
  }

  if (release.provisioningExpiry) {
    if (release.provisioningExpiry.getTime() < Date.now()) {
      addCheck(
        checks,
        'provisioning-expiry',
        'fail',
        `Provisioning profile expired on ${release.provisioningExpiry.toISOString()}.`,
      )
    } else {
      addCheck(
        checks,
        'provisioning-expiry',
        'pass',
        `Provisioning profile is valid until ${release.provisioningExpiry.toISOString()}.`,
      )
    }
  } else {
    addCheck(checks, 'provisioning-expiry', 'warn', 'Provisioning expiry date is unavailable.')
  }

  const bundleId = release.extractedBundleId ?? release.app.bundleId
  if (!bundleId || !bundleId.trim()) {
    addCheck(checks, 'bundle-id', 'fail', 'Bundle identifier metadata is missing.')
  } else {
    addCheck(checks, 'bundle-id', 'pass', `Bundle identifier resolved as ${bundleId}.`)
  }

  const buildNumber = release.buildNumber?.trim()
  if (!buildNumber) {
    addCheck(checks, 'build-number', 'fail', 'Build number metadata is missing.')
  } else {
    addCheck(checks, 'build-number', 'pass', `Build number resolved as ${buildNumber}.`)
  }

  const originResult = resolveOtaPublicOrigin(request)
  let manifestUrl: string | null = null
  let downloadUrl: string | null = null
  let originSource: 'request' | 'app_url' | null = null
  let mismatch = false

  if ('error' in originResult) {
    addCheck(checks, 'origin', 'fail', originResult.error)
  } else {
    originSource = originResult.source
    mismatch = originResult.mismatch

    addCheck(
      checks,
      'origin',
      'pass',
      `Resolved OTA origin ${originResult.origin} from ${originResult.source}.`,
    )

    if (process.env.NODE_ENV === 'production') {
      const host = new URL(originResult.origin).hostname
      if (isPrivateOrLocalHost(host)) {
        addCheck(
          checks,
          'origin-host',
          'fail',
          `Resolved OTA host "${host}" is local/private and cannot be reached by iOS OTA installer.`,
        )
      }
    }

    if (originResult.mismatch) {
      addCheck(
        checks,
        'origin-mismatch',
        'warn',
        `Request origin and APP_URL differ. Using ${originResult.source} origin for OTA links.`,
      )
    }

    manifestUrl = `${originResult.origin}/api/v1/releases/${release.id}/manifest?token=${encodeURIComponent(token)}`
    downloadUrl = `${originResult.origin}/api/v1/releases/${release.id}/download?token=${encodeURIComponent(token)}`
    addCheck(checks, 'urls', 'pass', 'Manifest and download URLs were generated.')
  }

  const result: OtaDiagnosticsResult = {
    ok: checks.every((check) => check.status !== 'fail'),
    checks,
    resolved: {
      manifestUrl,
      downloadUrl,
      originSource,
      mismatch,
    },
  }

  return diagnosticsResponse(result)
}
