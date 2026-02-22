'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { InstallButton } from '@/components/releases/install-button'
import { getIosOtaWarning } from '@/lib/ios-ota'
import type { MockRelease, Platform } from '@/types/app'
import { getReleaseTypeLabel, RELEASE_TYPE_COLORS, SIGNING_TYPE_LABELS } from '@/types/app'

interface ReleaseCardProps {
  release: MockRelease
  platform: Platform
  otaToken?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ReleaseCard({ release, platform, otaToken }: ReleaseCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const colors = RELEASE_TYPE_COLORS[release.releaseType]
  const otaWarning = getIosOtaWarning(platform, release.signingType)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/v1/releases/${release.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete release')
      }

      toast.success('Release deleted')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete release')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: version info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold">
                v{release.version}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ({release.buildNumber})
              </span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {getReleaseTypeLabel(release.releaseType)}
              </span>
              {release.signingType && SIGNING_TYPE_LABELS[release.signingType] && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: SIGNING_TYPE_LABELS[release.signingType].bg,
                    color: SIGNING_TYPE_LABELS[release.signingType].text,
                  }}
                >
                  {SIGNING_TYPE_LABELS[release.signingType].label}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" aria-hidden="true" />
                {formatDate(release.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="size-3.5" aria-hidden="true" />
                {release.downloadCount} downloads
              </span>
              <span className="text-xs">{formatBytes(release.fileSize)}</span>
            </div>

            {release.releaseNotes && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {release.releaseNotes}
              </p>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex shrink-0 flex-col gap-2">
            {otaWarning && (
              <p className="max-w-[17rem] text-xs text-amber-600">
                {otaWarning}
              </p>
            )}
            <InstallButton
              releaseId={release.id}
              platform={platform}
              otaToken={otaToken}
              colors={colors}
            />
            <Button
              variant="outline"
              size="sm"
              asChild
              aria-label={`View details for v${release.version}`}
            >
              <Link href={`/releases/${release.id}`}>View Details</Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 size-4" aria-hidden="true" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Release</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete v{release.version} ({release.buildNumber})? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete()
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
