import { createHmac } from 'crypto'

const DEFAULT_EXPIRY_SECONDS = 3600 // 1 hour

function getSecret(): string {
  const secret = process.env.OTA_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('OTA_SECRET, AUTH_SECRET, or NEXTAUTH_SECRET must be set')
  }
  return secret
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString('base64url')
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, 'base64url').toString()
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function generateOtaToken(
  releaseId: string,
  expiresInSeconds = DEFAULT_EXPIRY_SECONDS,
): string {
  const secret = getSecret()
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds
  const payload = base64UrlEncode(JSON.stringify({ releaseId, exp }))
  const signature = sign(payload, secret)
  return `${payload}.${signature}`
}

export function verifyOtaToken(token: string, releaseId: string): boolean {
  try {
    const secret = getSecret()
    const [payload, signature] = token.split('.')
    if (!payload || !signature) return false

    const expectedSignature = sign(payload, secret)
    if (signature !== expectedSignature) return false

    const decoded = JSON.parse(base64UrlDecode(payload)) as {
      releaseId: string
      exp: number
    }
    if (decoded.releaseId !== releaseId) return false

    const now = Math.floor(Date.now() / 1000)
    if (decoded.exp < now) return false

    return true
  } catch {
    return false
  }
}
