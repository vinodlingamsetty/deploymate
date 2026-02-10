'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth route error:', error)
    }
  }, [error])

  return (
    <Card className="w-full max-w-[400px] backdrop-blur-sm bg-background/95 shadow-2xl border-white/10">
      <CardHeader className="space-y-4 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight">
          DeployMate
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Something went wrong
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground text-center">
          This page ran into an error. You can try again or go back to login.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            onClick={reset}
            className="w-full bg-[#0077b6] hover:bg-[#006399] text-white"
            size="lg"
          >
            Try again
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
