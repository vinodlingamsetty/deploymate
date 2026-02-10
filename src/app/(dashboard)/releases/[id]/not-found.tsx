import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ReleaseNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg font-semibold">Release not found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        The release you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  )
}
