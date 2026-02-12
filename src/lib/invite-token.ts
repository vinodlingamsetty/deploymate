import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure invitation token.
 * Returns a 64-character lowercase hex string (256 bits of entropy).
 */
export function generateInviteToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Return a Date that is exactly 7 days from the current moment.
 * Used to set the `expiresAt` field on new Invitation records.
 */
export function getInvitationExpiryDate(): Date {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date
}
