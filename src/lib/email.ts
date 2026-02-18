import logger from '@/lib/logger'
import { getEmailTransporter, isEmailConfigured } from '@/lib/email-transport'

const FROM = process.env.EMAIL_FROM ?? 'DeployMate <noreply@deploymate.local>'

interface InvitationEmailParams {
  to: string
  organizationName: string
  inviterName: string
  role: string
  acceptUrl: string
}

/**
 * Send an invitation email to a prospective organization member.
 */
export async function sendInvitationEmail(params: InvitationEmailParams): Promise<void> {
  const subject = `You're invited to join ${params.organizationName} on DeployMate`
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0077b6;">You've been invited!</h2>
      <p><strong>${params.inviterName}</strong> invited you to join <strong>${params.organizationName}</strong> as a <strong>${params.role}</strong>.</p>
      <a href="${params.acceptUrl}" style="display: inline-block; padding: 12px 24px; background: #0077b6; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
      <p style="color: #666; font-size: 14px;">If you didn't expect this email, you can safely ignore it.</p>
    </div>
  `

  await sendMail(params.to, subject, html)
}

/**
 * Send a 6-digit OTP code for passwordless sign-in.
 */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const subject = `${code} is your DeployMate sign-in code`
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0077b6;">Your sign-in code</h2>
      <p style="font-size: 32px; font-family: 'Courier New', monospace; letter-spacing: 6px; font-weight: bold; margin: 24px 0;">${code}</p>
      <p>This code expires in <strong>5 minutes</strong>.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
    </div>
  `

  await sendMail(to, subject, html)
}

interface NewReleaseEmailParams {
  to: string
  appName: string
  version: string
}

/**
 * Send a notification email about a new release.
 */
export async function sendNewReleaseEmail(params: NewReleaseEmailParams): Promise<void> {
  const subject = `New release: ${params.appName} v${params.version}`
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0077b6;">New Release Available</h2>
      <p>A new version of <strong>${params.appName}</strong> (v${params.version}) is available for download.</p>
      <p>Log in to DeployMate to install the latest build.</p>
      <p style="color: #666; font-size: 14px;">You received this because you are a member of a distribution group for this app.</p>
    </div>
  `

  await sendMail(params.to, subject, html)
}

// ---------------------------------------------------------------
// Internal
// ---------------------------------------------------------------

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (!isEmailConfigured()) {
    logger.info({ to, subject }, 'Email (dev — SMTP not configured)')
    return
  }

  const transport = getEmailTransporter()
  if (!transport) return

  try {
    await transport.sendMail({ from: FROM, to, subject, html })
    logger.info({ to, subject }, 'Email sent')
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email')
  }
}
