import { randomBytes } from 'crypto'
import { hashApiToken } from '@/lib/auth-utils'

/**
 * Generate a new API token with a human-readable prefix.
 * Format: dm_{first8hex}_{remaining}
 * Returns the raw token (shown once), its prefix, and the HMAC hash for storage.
 */
export function generateApiToken(): {
  token: string
  prefix: string
  hash: string
} {
  const bytes = randomBytes(32)
  const hex = bytes.toString('hex')
  const prefix = `dm_${hex.slice(0, 8)}`
  const token = `${prefix}_${hex.slice(8)}`
  const hash = hashApiToken(token)

  return { token, prefix, hash }
}
