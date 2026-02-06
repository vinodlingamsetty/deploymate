'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Not signed in.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Dashboard</CardTitle>
              <CardDescription>Placeholder until full app UI is built</CardDescription>
            </div>
            <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>
              Sign out
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Welcome, <strong>{session.user?.name ?? session.user?.email}</strong>.
              You&apos;re logged in with the demo account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
