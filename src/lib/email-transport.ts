import { createTransport, type Transporter } from 'nodemailer'
import logger from '@/lib/logger'

let transporter: Transporter | null = null

/**
 * Returns true if SMTP env vars are configured enough to send email.
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.EMAIL_FROM)
}

/**
 * Lazy-creates and caches a Nodemailer SMTP transporter.
 * Returns null when SMTP is not configured.
 */
export function getEmailTransporter(): Transporter | null {
  if (!isEmailConfigured()) {
    return null
  }

  if (!transporter) {
    transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    })

    logger.info({ host: process.env.SMTP_HOST }, 'SMTP transporter created')
  }

  return transporter
}
