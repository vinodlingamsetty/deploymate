import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-2">404 – Page not found</h1>
      <p className="text-muted-foreground text-center mb-6 max-w-md">
        The page you’re looking for doesn’t exist or the app may need a restart.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Go to login</Link>
        </Button>
      </div>
    </div>
  )
}
