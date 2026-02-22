export type OtaCheckStatus = 'pass' | 'warn' | 'fail'

export interface OtaDiagnosticCheck {
  key: string
  status: OtaCheckStatus
  message: string
}

export interface OtaDiagnosticsResult {
  ok: boolean
  checks: OtaDiagnosticCheck[]
  resolved: {
    manifestUrl: string | null
    downloadUrl: string | null
    originSource: 'request' | 'app_url' | null
    mismatch: boolean
  }
}

export function getFirstOtaFailure(result: OtaDiagnosticsResult): OtaDiagnosticCheck | undefined {
  return result.checks.find((check) => check.status === 'fail')
}

export function getOtaWarnings(result: OtaDiagnosticsResult): OtaDiagnosticCheck[] {
  return result.checks.filter((check) => check.status === 'warn')
}

function fallbackDiagnostics(message: string): OtaDiagnosticsResult {
  return {
    ok: false,
    checks: [{ key: 'request', status: 'fail', message }],
    resolved: {
      manifestUrl: null,
      downloadUrl: null,
      originSource: null,
      mismatch: false,
    },
  }
}

function isOtaDiagnosticsResult(value: unknown): value is OtaDiagnosticsResult {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<OtaDiagnosticsResult>
  return typeof candidate.ok === 'boolean' && Array.isArray(candidate.checks)
}

export async function fetchOtaDiagnostics(
  releaseId: string,
  otaToken: string,
): Promise<OtaDiagnosticsResult> {
  try {
    const response = await fetch(
      `/api/v1/releases/${releaseId}/ota-diagnostics?token=${encodeURIComponent(otaToken)}`,
      { cache: 'no-store' },
    )
    const body = await response.json().catch(() => null) as unknown
    if (isOtaDiagnosticsResult(body)) {
      return body
    }

    const message = (body as { error?: { message?: string } } | null)?.error?.message
      ?? `OTA diagnostics request failed (${response.status})`
    return fallbackDiagnostics(message)
  } catch {
    return fallbackDiagnostics('Unable to run iOS OTA readiness checks')
  }
}
