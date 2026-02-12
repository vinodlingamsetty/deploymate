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
  console.log('[Email Stub] Invitation email:')
  console.log(`  To: ${params.to}`)
  console.log(`  Organization: ${params.organizationName}`)
  console.log(`  Invited by: ${params.inviterName}`)
  console.log(`  Role: ${params.role}`)
  console.log(`  Accept URL: ${params.acceptUrl}`)
}
