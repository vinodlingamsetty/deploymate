import Link from 'next/link'
import { Building2, UserCheck, Clock, Mail, XCircle, AlertCircle } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AcceptButton } from '@/components/invitations/accept-button'

interface PageProps {
  params: { token: string }
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <Card className="w-full max-w-[400px] backdrop-blur-sm bg-background/95 shadow-2xl border-white/10">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <XCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          {message}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to login</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}

export default async function InvitationAcceptPage({ params }: PageProps) {
  const [session, invitation] = await Promise.all([
    auth(),
    db.invitation.findUnique({
      where: { token: params.token },
      include: {
        organization: true,
        invitedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ])

  if (!invitation) {
    return (
      <ErrorCard
        title="Invitation not found"
        message="This invitation link is invalid or does not exist."
      />
    )
  }

  // Check terminal statuses
  if (invitation.status === 'EXPIRED' || invitation.expiresAt < new Date()) {
    return (
      <ErrorCard
        title="Invitation expired"
        message="This invitation has expired. Please ask the organization admin to send a new invitation."
      />
    )
  }

  if (invitation.status === 'REVOKED') {
    return (
      <ErrorCard
        title="Invitation revoked"
        message="This invitation has been revoked. Please contact the organization admin if you believe this is a mistake."
      />
    )
  }

  if (invitation.status === 'ACCEPTED') {
    return (
      <ErrorCard
        title="Invitation already accepted"
        message="This invitation has already been accepted. Sign in to access your organization."
      />
    )
  }

  const { organization, invitedBy } = invitation
  const inviterName =
    invitedBy.firstName && invitedBy.lastName
      ? `${invitedBy.firstName} ${invitedBy.lastName}`
      : invitedBy.email

  const emailMismatch =
    session &&
    session.user.email?.toLowerCase() !== invitation.email.toLowerCase()

  return (
    <Card className="w-full max-w-[400px] backdrop-blur-sm bg-background/95 shadow-2xl border-white/10">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          You&apos;ve been invited!
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Join {organization.name} as a {formatRole(invitation.role)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Invitation details */}
        <div className="space-y-3 rounded-lg border border-white/10 bg-muted/30 p-4">
          <div className="flex items-center gap-3 text-sm">
            <Building2 className="h-4 w-4 shrink-0 text-[#0077b6]" aria-hidden="true" />
            <span className="text-muted-foreground">Organization</span>
            <span className="ml-auto font-medium">{organization.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <UserCheck className="h-4 w-4 shrink-0 text-[#0077b6]" aria-hidden="true" />
            <span className="text-muted-foreground">Role</span>
            <span className="ml-auto font-medium">{formatRole(invitation.role)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 shrink-0 text-[#0077b6]" aria-hidden="true" />
            <span className="text-muted-foreground">Invited by</span>
            <span className="ml-auto font-medium truncate max-w-[160px]" title={inviterName}>
              {inviterName}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-[#0077b6]" aria-hidden="true" />
            <span className="text-muted-foreground">Expires</span>
            <span className="ml-auto font-medium">{formatDate(invitation.expiresAt)}</span>
          </div>
        </div>

        {/* Action area */}
        {session ? (
          emailMismatch ? (
            <div
              className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20"
              role="alert"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  This invitation was sent to{' '}
                  <strong>{invitation.email}</strong>. Please sign in with that account.
                </span>
              </div>
            </div>
          ) : (
            <AcceptButton token={params.token} orgName={organization.name} />
          )
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/register?token=${params.token}`}>
                  Create an account
                </Link>
              </Button>
              <Button
                asChild
                className="w-full bg-[#0077b6] hover:bg-[#006399] text-white"
              >
                <Link href={`/login?token=${params.token}`}>Sign in</Link>
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Use the email address{' '}
              <strong className="text-foreground">{invitation.email}</strong>{' '}
              to accept this invitation
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
