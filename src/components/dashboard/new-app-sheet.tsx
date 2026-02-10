'use client'

import { useCallback, useRef, useState } from 'react'
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
  organizations: Array<{ name: string; slug: string }>
}

export function NewAppSheet({ open, onOpenChange, organizations }: NewAppSheetProps) {
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
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

  function onSubmit(_data: NewAppFormValues) {
    // TODO: Call API to create app
    handleClose()
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
                <SelectContent>
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
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.slug} value={org.slug}>
                      {org.name}
                    </SelectItem>
                  ))}
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
                <SelectContent>
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
              disabled={!isValid}
              style={{ backgroundColor: '#0077b6' }}
            >
              Create App
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
