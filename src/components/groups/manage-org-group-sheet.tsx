'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { AddUserSheet } from '@/components/groups/add-user-sheet'
import { AddAppsSheet } from '@/components/groups/add-apps-sheet'
import type { MockOrgDistGroupDetail } from '@/types/app'
import { getPlatformLabel } from '@/types/app'
import { getInitials } from '@/lib/formatting'

interface ManageOrgGroupSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: MockOrgDistGroupDetail | null
  orgSlug: string
}

export function ManageOrgGroupSheet({
  open,
  onOpenChange,
  group,
  orgSlug,
}: ManageOrgGroupSheetProps) {
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [addAppsOpen, setAddAppsOpen] = useState(false)

  function handleRemoveMember(userId: string, email: string) {
    if (!group) return
    console.log('Remove member from org group:', { groupId: group.id, userId })
    toast.success(`Removed ${email} from group`)
  }

  function handleRemoveApp(appId: string, appName: string) {
    if (!group) return
    console.log('Remove app from org group:', { groupId: group.id, appId })
    toast.success(`Removed ${appName} from group`)
  }

  function handleClose() {
    onOpenChange(false)
  }

  if (!group) return null

  const existingAppIds = group.apps.map((a) => a.appId)

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>{group.name}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex-1 px-6 py-6">
              {group.description && (
                <p className="mb-4 text-sm text-muted-foreground">{group.description}</p>
              )}

              <Tabs defaultValue="members">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="apps">Apps</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddUserOpen(true)}
                    >
                      <Plus className="mr-1.5 size-3.5" aria-hidden="true" />
                      Add User
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {group.members.map((m) => (
                      <div
                        key={m.userId}
                        className="flex items-center gap-3 rounded-md border px-3 py-2"
                      >
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
                          aria-hidden="true"
                        >
                          {getInitials(m.firstName, m.lastName, m.email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {m.firstName && m.lastName
                              ? `${m.firstName} ${m.lastName}`
                              : m.email}
                          </p>
                          {m.firstName && m.lastName && (
                            <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                          )}
                        </div>
                        <span className="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                          {m.role === 'MANAGER' ? 'Manager' : 'Tester'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId, m.email)}
                          className="flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                          aria-label={`Remove ${m.email}`}
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="apps" className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {group.apps.length} linked app{group.apps.length !== 1 ? 's' : ''}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddAppsOpen(true)}
                    >
                      <Plus className="mr-1.5 size-3.5" aria-hidden="true" />
                      Add Apps
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {group.apps.map((a) => (
                      <div
                        key={a.appId}
                        className="flex items-center gap-3 rounded-md border px-3 py-2"
                      >
                        <span aria-hidden="true">
                          {a.platform === 'IOS' ? '🍎' : '🤖'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.name}</p>
                        </div>
                        <span className="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                          {getPlatformLabel(a.platform)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveApp(a.appId, a.name)}
                          className="flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                          aria-label={`Remove ${a.name}`}
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}

                    {group.apps.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No apps linked to this group yet.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleClose}
              >
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AddUserSheet
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        groupId={group.id}
      />

      <AddAppsSheet
        open={addAppsOpen}
        onOpenChange={setAddAppsOpen}
        groupId={group.id}
        orgSlug={orgSlug}
        existingAppIds={existingAppIds}
      />
    </>
  )
}
