'use client'

import { useCallback, useRef, useState } from 'react'
import { CheckCircle2, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { MOCK_DISTRIBUTION_GROUPS } from '@/lib/mock-data'
import type { Platform } from '@/types/app'

interface UploadReleaseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: Platform
  appName: string
}

interface SelectedFile {
  name: string
  size: number
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadReleaseSheet({
  open,
  onOpenChange,
  platform,
  appName,
}: UploadReleaseSheetProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [releaseNotes, setReleaseNotes] = useState('')
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set())
  const [showGroupWarning, setShowGroupWarning] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fileExtension = platform === 'IOS' ? '.ipa' : '.apk'
  const acceptAttribute = platform === 'IOS' ? '.ipa' : '.apk'
  const canProceedToStep2 = releaseNotes.trim().length > 0 && selectedFile !== null

  function handleFileSelect(file: File) {
    setSelectedFile({ name: file.name, size: file.size })
  }

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function clearFile() {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleGroupToggle(groupId: string) {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
    setShowGroupWarning(false)
  }

  function handlePublish() {
    if (selectedGroupIds.size === 0) {
      setShowGroupWarning(true)
      return
    }
    console.log({
      releaseNotes,
      file: selectedFile ? { name: selectedFile.name, size: selectedFile.size } : null,
      groups: selectedGroupIds,
    })
    handleClose()
  }

  function handleClose() {
    onOpenChange(false)
    resetState()
  }

  function resetState() {
    setStep(1)
    setReleaseNotes('')
    setSelectedFile(null)
    setIsDragging(false)
    setSelectedGroupIds(new Set())
    setShowGroupWarning(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>
            Upload Release — {appName}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              (Step {step} of 2)
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {step === 1 ? (
            <div className="flex flex-1 flex-col">
              <div className="flex-1 space-y-5 px-6 py-6">
                {/* Release Notes */}
                <div className="space-y-2">
                  <Label htmlFor="release-notes">
                    Release Notes{' '}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </Label>
                  <Textarea
                    id="release-notes"
                    rows={10}
                    className="max-h-[200px] overflow-y-auto resize-none"
                    placeholder="Describe what's new in this release…"
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    aria-required="true"
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>
                    Build File{' '}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </Label>

                  {selectedFile ? (
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2
                          className="size-5 shrink-0 text-green-600"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium" title={selectedFile.name}>
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearFile}
                          className="flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                          aria-label="Remove file"
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Mock metadata */}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Version: 1.0.0 &bull; Build: 1
                      </p>
                    </div>
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          fileInputRef.current?.click()
                        }
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      aria-label={`Upload ${fileExtension} file`}
                      className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
                        isDragging
                          ? 'border-primary bg-primary/5'
                          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <Upload
                        className={`size-5 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
                        aria-hidden="true"
                      />
                      <p className="text-xs text-muted-foreground">
                        Drop {fileExtension} file here or click to browse
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptAttribute}
                    className="sr-only"
                    onChange={handleFileInputChange}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Step 1 Footer */}
              <div className="flex gap-3 border-t px-6 py-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={!canProceedToStep2}
                  style={{ backgroundColor: '#0077b6' }}
                  onClick={() => setStep(2)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="flex-1 space-y-5 px-6 py-6">
                <p className="text-sm text-muted-foreground">
                  Select at least one group to distribute this release.
                </p>

                <div className="space-y-3">
                  {MOCK_DISTRIBUTION_GROUPS.map((group) => (
                    <div key={group.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={selectedGroupIds.has(group.id)}
                        onCheckedChange={() => handleGroupToggle(group.id)}
                        aria-label={`${group.name} (${group.memberCount} members)`}
                      />
                      <Label
                        htmlFor={`group-${group.id}`}
                        className="flex flex-1 cursor-pointer items-center justify-between"
                      >
                        <span>{group.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {group.memberCount} members
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>

                {showGroupWarning && (
                  <p className="text-xs text-destructive" role="alert">
                    Please select at least one group
                  </p>
                )}
              </div>

              {/* Step 2 Footer — stacked vertically */}
              <div className="flex flex-col gap-2 border-t px-6 py-4">
                <Button
                  type="button"
                  style={{ backgroundColor: '#0077b6' }}
                  disabled={selectedGroupIds.size === 0}
                  onClick={handlePublish}
                >
                  Publish
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
