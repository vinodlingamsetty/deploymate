'use client'

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const newAppSchema = z.object({
  appName: z.string().min(1, 'App name is required'),
  platform: z.enum(['IOS', 'ANDROID']),
  orgSlug: z.string().min(1, 'Organization is required'),
  releaseType: z.enum(['ALPHA', 'BETA', 'RELEASE_CANDIDATE']),
})

type NewAppFormValues = z.infer<typeof newAppSchema>

interface NewAppSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizations: Array<{ id: string; name: string; slug: string }>
  onSuccess?: () => void
}

export function NewAppSheet({ open, onOpenChange, organizations, onSuccess }: NewAppSheetProps) {
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid },
    watch,
  } = useForm<NewAppFormValues>({
    resolver: zodResolver(newAppSchema),
    mode: 'onChange',
    defaultValues: {
      appName: '',
      orgSlug: '',
    },
  })

  const platform = watch('platform')
  const orgSlug = watch('orgSlug')
  const releaseType = watch('releaseType')

  function handleIconFile(file: File) {
    const SAFE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if (!SAFE_TYPES.includes(file.type)) return
    const MAX_SIZE = 2 * 1024 * 1024
    if (file.size > MAX_SIZE) return
    const url = URL.createObjectURL(file)
    setIconPreview(url)
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
    if (file) handleIconFile(file)
  }, [])

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleIconFile(file)
  }

  function clearIcon() {
    setIconPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function onSubmit(data: NewAppFormValues) {
    const org = organizations.find((o) => o.slug === data.orgSlug)
    if (!org) {
      toast.error('Selected organization not found.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/v1/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.appName, platform: data.platform, orgId: org.id }),
      })

      const json = await res.json() as { data?: unknown; error?: { message?: string } }

      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to create app.')
        return
      }

      toast.success('App created successfully.')
      onSuccess?.()
      handleClose()
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleClose() {
    onOpenChange(false)
    reset()
    clearIcon()
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>New App</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="flex-1 space-y-5 px-6 py-6">
            {/* App Icon */}
            <div className="space-y-2">
              <Label>App Icon</Label>
              {iconPreview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={iconPreview}
                    alt="App icon preview"
                    className="size-20 rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearIcon}
                    className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    aria-label="Remove icon"
                  >
                    <X className="size-3" />
                  </button>
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
                  aria-label="Upload app icon"
                  className={`flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Drop image or click to upload
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileInputChange}
                aria-hidden="true"
              />
            </div>

            {/* App Name */}
            <div className="space-y-2">
              <Label htmlFor="appName">
                App Name <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="appName"
                placeholder="My Awesome App"
                aria-required="true"
                aria-describedby={errors.appName ? 'appName-error' : undefined}
                {...register('appName')}
              />
              {errors.appName && (
                <p id="appName-error" className="text-xs text-destructive" role="alert">
                  {errors.appName.message}
                </p>
              )}
            </div>

            {/* Platform */}
            <div className="space-y-2">
              <Label htmlFor="platform">
                Platform <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Select
                value={platform}
                onValueChange={(v) =>
                  setValue('platform', v as 'IOS' | 'ANDROID', { shouldValidate: true })
                }
              >
                <SelectTrigger
                  id="platform"
                  aria-required="true"
                  aria-describedby={errors.platform ? 'platform-error' : undefined}
                >
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="IOS">iOS</SelectItem>
                  <SelectItem value="ANDROID">Android</SelectItem>
                </SelectContent>
              </Select>
              {errors.platform && (
                <p id="platform-error" className="text-xs text-destructive" role="alert">
                  {errors.platform.message}
                </p>
              )}
            </div>

            {/* Organization */}
            <div className="space-y-2">
              <Label htmlFor="orgSlug">
                Organization <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Select
                value={orgSlug}
                onValueChange={(v) =>
                  setValue('orgSlug', v, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  id="orgSlug"
                  aria-required="true"
                  aria-describedby={errors.orgSlug ? 'orgSlug-error' : undefined}
                >
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {organizations.length === 0 ? (
                    <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                      No organizations yet. Create or join one first.
                    </div>
                  ) : (
                    organizations.map((org) => (
                      <SelectItem key={org.slug} value={org.slug}>
                        {org.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.orgSlug && (
                <p id="orgSlug-error" className="text-xs text-destructive" role="alert">
                  {errors.orgSlug.message}
                </p>
              )}
            </div>

            {/* Release Type */}
            <div className="space-y-2">
              <Label htmlFor="releaseType">
                Release Type <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Select
                value={releaseType}
                onValueChange={(v) =>
                  setValue(
                    'releaseType',
                    v as 'ALPHA' | 'BETA' | 'RELEASE_CANDIDATE',
                    { shouldValidate: true }
                  )
                }
              >
                <SelectTrigger
                  id="releaseType"
                  aria-required="true"
                  aria-describedby={errors.releaseType ? 'releaseType-error' : undefined}
                >
                  <SelectValue placeholder="Select release type" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="ALPHA">Alpha</SelectItem>
                  <SelectItem value="BETA">Beta</SelectItem>
                  <SelectItem value="RELEASE_CANDIDATE">Release Candidate</SelectItem>
                </SelectContent>
              </Select>
              {errors.releaseType && (
                <p id="releaseType-error" className="text-xs text-destructive" role="alert">
                  {errors.releaseType.message}
                </p>
              )}
            </div>
          </div>

          {/* Footer buttons */}
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
              type="submit"
              className="flex-1"
              disabled={!isValid || isSubmitting}
              style={{ backgroundColor: '#0077b6' }}
            >
              {isSubmitting ? 'Creating…' : 'Create App'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
