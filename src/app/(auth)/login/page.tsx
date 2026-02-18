'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Loader2, KeyRound, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type Mode = 'landing' | 'password' | 'otp-email' | 'otp-code'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [mode, setMode] = useState<Mode>('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        if (token) {
          router.push(`/invitations/${token}/accept`)
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error?.message ?? 'Failed to send code')
        setIsLoading(false)
        return
      }

      setMode('otp-code')
      setIsLoading(false)
    } catch {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn('email-otp', {
        email: email.trim().toLowerCase(),
        code: otpCode.trim(),
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid or expired code')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        if (token) {
          router.push(`/invitations/${token}/accept`)
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const resetState = () => {
    setEmail('')
    setPassword('')
    setOtpCode('')
    setError(null)
  }

  const registerHref = token ? `/register?token=${token}` : '/register'

  return (
    <Card className="w-full max-w-[400px] backdrop-blur-sm bg-background/95 shadow-2xl border-white/10">
      <CardHeader className="space-y-4 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight">
          DeployMate
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Beta App Distribution Made Simple
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* --- Landing mode --- */}
        {mode === 'landing' && (
          <>
            <Separator />

            <Button
              onClick={() => setMode('password')}
              className="w-full bg-[#0077b6] hover:bg-[#006399] text-white"
              size="lg"
            >
              <Mail className="mr-2 h-5 w-5" aria-hidden="true" />
              Continue with Email
            </Button>

            <button
              type="button"
              onClick={() => setMode('otp-email')}
              className="w-full text-sm text-[#0077b6] hover:text-[#006399] font-medium underline-offset-4 hover:underline"
            >
              <KeyRound className="inline mr-1.5 h-4 w-4" aria-hidden="true" />
              Sign in with a code
            </button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link
                  href={registerHref}
                  className="text-[#0077b6] hover:text-[#006399] font-medium underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </>
        )}

        {/* --- Password mode --- */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {error && (
              <div
                id="login-error"
                className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
                autoFocus
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full bg-[#0077b6] hover:bg-[#006399] text-white"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMode('landing')
                  resetState()
                }}
                disabled={isLoading}
                className="w-full text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500"
              >
                Cancel
              </Button>
            </div>

            <button
              type="button"
              onClick={() => {
                setPassword('')
                setError(null)
                setMode('otp-email')
              }}
              className="w-full text-sm text-[#0077b6] hover:text-[#006399] font-medium underline-offset-4 hover:underline"
            >
              Use a sign-in code instead
            </button>

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link
                  href={registerHref}
                  className="text-[#0077b6] hover:text-[#006399] font-medium underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-muted-foreground/80 text-center border border-dashed border-muted rounded-md p-2">
                Dev login: <code className="font-mono">demo@deploymate.local</code> / <code className="font-mono">demo123</code>
              </p>
            )}
          </form>
        )}

        {/* --- OTP email mode --- */}
        {mode === 'otp-email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {error && (
              <div
                id="otp-error"
                className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20"
                role="alert"
              >
                {error}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a 6-digit code to sign in.
            </p>

            <div className="space-y-2">
              <Label htmlFor="otp-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="otp-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
                autoFocus
                aria-invalid={!!error}
                aria-describedby={error ? 'otp-error' : undefined}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-[#0077b6] hover:bg-[#006399] text-white"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    Sending code...
                  </>
                ) : (
                  'Send Code'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMode('landing')
                  resetState()
                }}
                disabled={isLoading}
                className="w-full text-muted-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            </div>
          </form>
        )}

        {/* --- OTP code mode --- */}
        {mode === 'otp-code' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {error && (
              <div
                id="otp-verify-error"
                className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20"
                role="alert"
              >
                {error}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              We sent a code to <strong>{email}</strong>. Enter it below to sign in.
            </p>

            <div className="space-y-2">
              <Label htmlFor="otp-code">
                6-digit code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="otp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
                required
                autoFocus
                autoComplete="one-time-code"
                className="text-center font-mono text-2xl tracking-[0.3em]"
                aria-invalid={!!error}
                aria-describedby={error ? 'otp-verify-error' : undefined}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full bg-[#0077b6] hover:bg-[#006399] text-white"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setOtpCode('')
                    setError(null)
                    setMode('otp-email')
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="inline mr-1 h-3 w-3" aria-hidden="true" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    setError(null)
                    setIsLoading(true)
                    try {
                      await fetch('/api/auth/otp/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email.trim().toLowerCase() }),
                      })
                      setOtpCode('')
                    } catch {
                      // ignore
                    }
                    setIsLoading(false)
                  }}
                  className="text-[#0077b6] hover:text-[#006399] font-medium underline-offset-4 hover:underline"
                >
                  Resend code
                </button>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-[400px] backdrop-blur-sm bg-background/95 shadow-2xl border-white/10">
          <CardHeader className="space-y-4 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">DeployMate</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Beta App Distribution Made Simple
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </CardContent>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
