'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

interface CreateOrgGroupSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgSlug: string
}

export function CreateOrgGroupSheet({
  open,
  onOpenChange,
  orgSlug,
}: CreateOrgGroupSheetProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const canCreate = name.trim().length > 0

  function handleCreate() {
    if (!canCreate) return
    console.log('Create org group:', { orgSlug, name: name.trim(), description: description.trim() || null })
    toast.success('Distribution group created')
    handleClose()
  }

  function handleClose() {
    onOpenChange(false)
    setName('')
    setDescription('')
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Create Distribution Group</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="org-group-name">
                Group Name{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="org-group-name"
                placeholder="e.g. QA Team"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-group-description">Description</Label>
              <Textarea
                id="org-group-description"
                placeholder="Optional description for the group…"
                maxLength={500}
                rows={4}
                className="resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

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
              disabled={!canCreate}
              style={{ backgroundColor: '#0077b6' }}
              onClick={handleCreate}
            >
              Create Group
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
