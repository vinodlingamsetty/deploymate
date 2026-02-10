'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'An authentication configuration error occurred. Please contact the administrator.',
  AccessDenied: 'Access denied. You do not have permission to sign in.',
  Verification: 'The verification link has expired or has already been used.',
  Default: 'An authentication error occurred. Please try again.',
}

const DEV_ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    'Auth configuration error. Ensure AUTH_SECRET or NEXTAUTH_SECRET is set in .env ' +
    'in the project root (same directory as package.json) and restart the server.',
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const errorType = searchParams.get('error') ?? 'Default'
  const message = ERROR_MESSAGES[errorType] ?? ERROR_MESSAGES.Default
  const isDev = process.env.NODE_ENV === 'development'
  const devMessage = isDev ? (DEV_ERROR_MESSAGES[errorType] ?? null) : null

  return (
    <Card className="w-full max-w-[400px] backdrop-blur-sm bg-background/95 shadow-2xl border-white/10">
      <CardHeader className="space-y-4 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight">
          DeployMate
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Authentication Error
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20"
          role="alert"
        >
          {devMessage ?? message}
        </div>
        {isDev && errorType === 'Configuration' && (
          <pre className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 overflow-x-auto">
{`# In your .env file:
AUTH_SECRET="$(openssl rand -base64 32)"
# Then restart: pnpm dev`}
          </pre>
        )}
        <div className="flex flex-col gap-3">
          <Button
            className="w-full bg-[#0077b6] hover:bg-[#006399] text-white"
            size="lg"
            asChild
          >
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
