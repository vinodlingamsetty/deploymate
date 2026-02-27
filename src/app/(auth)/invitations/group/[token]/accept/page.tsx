import Link from 'next/link'
import { Users, UserCheck, Clock, Mail, XCircle, AlertCircle } from 'lucide-react'
import { auth } from '@/lib/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AcceptGroupInviteButton } from '@/components/invitations/accept-group-invite-button'

interface PageProps {
  params: { token: string }
}

interface InvitationData {
  id: string
  email: string
  role: string
  status: string
  groupName: string
  contextName: string
  inviterName: string
  expiresAt: string
  createdAt: string
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}

export default async function GroupInvitationAcceptPage({ params }: PageProps) {
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const [session, res] = await Promise.all([
    auth(),
    fetch(`${baseUrl}/api/v1/group-invitations/${params.token}`, { cache: 'no-store' }),
  ])

  if (!res.ok) {
    return (
      <ErrorCard
        title="Invitation not found"
        message="This invitation link is invalid or does not exist."
      />
    )
  }

  const json = await res.json() as { data: InvitationData }
  const invitation = json.data

  if (invitation.status === 'EXPIRED' || new Date(invitation.expiresAt) < new Date()) {
    return (
      <ErrorCard
        title="Invitation expired"
        message="This invitation has expired. Please ask the group manager to send a new invitation."
      />
    )
  }

  if (invitation.status === 'REVOKED') {
    return (
      <ErrorCard
        title="Invitation revoked"
        message="This invitation has been revoked. Please contact the group manager if you believe this is a mistake."
      />
    )
  }

  if (invitation.status === 'ACCEPTED') {
    return (
      <ErrorCard
        title="Invitation already accepted"
        message="This invitation has already been accepted. Sign in to access your group."
      />
    )
  }

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
          Join the <strong>{invitation.groupName}</strong> distribution group
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Invitation details */}
        <div className="space-y-3 rounded-lg border border-white/10 bg-muted/30 p-4">
          <div className="flex items-center gap-3 text-sm">
            <Users className="h-4 w-4 shrink-0 text-[#0077b6]" aria-hidden="true" />
            <span className="text-muted-foreground">Group</span>
            <span className="ml-auto font-medium truncate max-w-[160px]" title={invitation.groupName}>
              {invitation.groupName}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <UserCheck className="h-4 w-4 shrink-0 text-[#0077b6]" aria-hidden="true" />
            <span className="text-muted-foreground">Role</span>
            <span className="ml-auto font-medium">{formatRole(invitation.role)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 shrink-0 text-[#0077b6]" aria-hidden="true" />
            <span className="text-muted-foreground">Invited by</span>
            <span className="ml-auto font-medium truncate max-w-[160px]" title={invitation.inviterName}>
              {invitation.inviterName}
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
            <AcceptGroupInviteButton token={params.token} groupName={invitation.groupName} />
          )
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/register?callbackUrl=/invitations/group/${params.token}/accept`}>
                  Create an account
                </Link>
              </Button>
              <Button
                asChild
                className="w-full bg-[#0077b6] hover:bg-[#006399] text-white"
              >
                <Link href={`/login?callbackUrl=/invitations/group/${params.token}/accept`}>Sign in</Link>
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
