'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { MOCK_APPS } from '@/lib/mock-data'
import { getPlatformLabel } from '@/types/app'

interface AddAppsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  orgSlug: string
  existingAppIds: string[]
}

export function AddAppsSheet({
  open,
  onOpenChange,
  groupId,
  orgSlug,
  existingAppIds,
}: AddAppsSheetProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const availableApps = MOCK_APPS.filter(
    (app) => app.org.slug === orgSlug && !existingAppIds.includes(app.id),
  )

  const canAdd = selectedIds.size > 0

  function handleToggle(appId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(appId)) {
        next.delete(appId)
      } else {
        next.add(appId)
      }
      return next
    })
  }

  function handleAdd() {
    if (!canAdd) return
    console.log('Add apps to org group:', { groupId, appIds: Array.from(selectedIds) })
    toast.success(`Added ${selectedIds.size} app${selectedIds.size !== 1 ? 's' : ''} to group`)
    handleClose()
  }

  function handleClose() {
    onOpenChange(false)
    setSelectedIds(new Set())
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Add Apps</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-3 px-6 py-6">
            {availableApps.length > 0 ? (
              availableApps.map((app) => (
                <div key={app.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`add-app-${app.id}`}
                    checked={selectedIds.has(app.id)}
                    onCheckedChange={() => handleToggle(app.id)}
                    aria-label={`${app.name} (${getPlatformLabel(app.platform)})`}
                  />
                  <Label
                    htmlFor={`add-app-${app.id}`}
                    className="flex flex-1 cursor-pointer items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span>{app.platform === 'IOS' ? '🍎' : '🤖'}</span>
                      <span>{app.name}</span>
                    </span>
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                      {getPlatformLabel(app.platform)}
                    </span>
                  </Label>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                All apps in this organization are already linked to this group.
              </p>
            )}
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
              disabled={!canAdd}
              style={{ backgroundColor: '#0077b6' }}
              onClick={handleAdd}
            >
              Add Apps
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
