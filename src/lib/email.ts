import logger from '@/lib/logger'

interface InvitationEmailParams {
  to: string
  organizationName: string
  inviterName: string
  role: string
  acceptUrl: string
}

/**
 * Send an invitation email to a prospective organization member.
 *
 * This is a stub implementation — replace the body with a real email
 * service call (e.g. Resend, SendGrid, or AWS SES) before going to
 * production. The function signature and parameter shape are stable.
 */
export async function sendInvitationEmail(params: InvitationEmailParams): Promise<void> {
  // Stub — replace with real email service (Resend/SendGrid/SES) later
  logger.info(
    {
      to: params.to,
      organization: params.organizationName,
      invitedBy: params.inviterName,
      role: params.role,
      acceptUrl: params.acceptUrl,
    },
    'Invitation email (stub)',
  )
}
