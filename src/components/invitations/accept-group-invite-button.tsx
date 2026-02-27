'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AcceptGroupInviteButtonProps {
  token: string
  groupName: string
}

export function AcceptGroupInviteButton({ token, groupName }: AcceptGroupInviteButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/group-invitations/${token}/accept`, {
        method: 'POST',
      })

      const json = await res.json().catch(() => ({})) as { error?: { message?: string } }

      if (!res.ok) {
        setError(json.error?.message ?? 'Failed to accept invitation. Please try again.')
        setIsLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleAccept}
        disabled={isLoading}
        className="w-full bg-[#0077b6] hover:bg-[#006399] text-white"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Joining {groupName}...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5" aria-hidden="true" />
            Accept Invitation
          </>
        )}
      </Button>

      {error && (
        <div
          className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  )
}
