'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

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
        {!showForm ? (
          <>
            <Separator />
            
            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-[#0077b6] hover:bg-[#006399] text-white"
              size="lg"
            >
              <Mail className="mr-2 h-5 w-5" aria-hidden="true" />
              Continue with Email
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link 
                  href="/register" 
                  className="text-[#0077b6] hover:text-[#006399] font-medium underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  setShowForm(false)
                  setEmail('')
                  setPassword('')
                  setError(null)
                }}
                disabled={isLoading}
                className="w-full text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500"
              >
                Cancel
              </Button>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link 
                  href="/register" 
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
      </CardContent>
    </Card>
  )
}
