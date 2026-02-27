'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MoreVertical, Pencil, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MockApp } from '@/types/app'
import { getPlatformLabel, getReleaseTypeLabel, RELEASE_TYPE_COLORS } from '@/types/app'
import { UploadReleaseSheet } from '@/components/apps/upload-release-sheet'

interface AppDetailsHeaderProps {
  app: MockApp
}

export function AppDetailsHeader({ app }: AppDetailsHeaderProps) {
  const router = useRouter()
  const [localName, setLocalName] = useState(app.name)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false)

  const canDelete = deleteConfirmName.trim() === localName

  async function handleSaveName() {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === localName) { setIsEditingName(false); return }
    setIsSavingName(true)
    const res = await fetch(`/api/v1/apps/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
    setIsSavingName(false)
    if (!res.ok) {
      const json = await res.json() as { error?: { message?: string } }
      toast.error(json.error?.message ?? 'Failed to rename app')
      return
    }
    setLocalName(trimmed)
    setIsEditingName(false)
    toast.success('App renamed')
  }

  function handleDelete() {
    if (!canDelete) return
    console.log('Delete app:', app.id)
    setDeleteDialogOpen(false)
    router.push('/dashboard')
  }

  function handleDialogClose(open: boolean) {
    setDeleteDialogOpen(open)
    if (!open) setDeleteConfirmName('')
  }

  const badgeColors = app.latestRelease
    ? RELEASE_TYPE_COLORS[app.latestRelease.releaseType]
    : null

  return (
    <>
      <div className="flex items-start gap-3 sm:items-center">
        {/* Back button */}
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/dashboard" scroll={false} aria-label="Back to dashboard">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        </Button>

        {/* App icon */}
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl sm:size-12"
          aria-hidden="true"
        >
          {app.platform === 'IOS' ? '🍎' : '🤖'}
        </div>

        {/* App info */}
        <div className="min-w-0 flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') setIsEditingName(false)
                }}
                className="h-8 text-xl font-bold sm:text-2xl"
                aria-label="App name"
              />
              <Button
                size="sm"
                onClick={handleSaveName}
                disabled={isSavingName || !editName.trim()}
              >
                Save
              </Button>
              <button
                type="button"
                aria-label="Cancel rename"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditingName(false)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-bold leading-tight sm:text-2xl" title={localName}>
                {localName}
              </h1>
              <button
                type="button"
                aria-label="Rename app"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => { setEditName(localName); setIsEditingName(true) }}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
              {getPlatformLabel(app.platform)}
            </span>
            {app.latestRelease && badgeColors && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: badgeColors.bg, color: badgeColors.text }}
              >
                {getReleaseTypeLabel(app.latestRelease.releaseType)}
              </span>
            )}
            {app.latestRelease && (
              <span className="font-mono text-xs text-muted-foreground">
                v{app.latestRelease.version}
              </span>
            )}
          </div>
        </div>

        {/* Desktop-only actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Button
            aria-label="Upload new release"
            onClick={() => setUploadSheetOpen(true)}
          >
            <Upload className="mr-2 size-4" aria-hidden="true" />
            Upload Release
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More options">
                <MoreVertical className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 size-4" aria-hidden="true" />
                Delete App
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Upload release sheet */}
      <UploadReleaseSheet
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
        platform={app.platform}
        appName={localName}
        appId={app.id}
        orgSlug={app.org.slug}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete {localName}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All releases, feedback, and distribution
              group data for this app will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              Type <strong>{localName}</strong> to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={localName}
              aria-describedby="delete-confirm-hint"
            />
            <p id="delete-confirm-hint" className="sr-only">
              Type the exact app name to enable the delete button
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!canDelete}
              onClick={handleDelete}
              aria-disabled={!canDelete}
            >
              Delete App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
