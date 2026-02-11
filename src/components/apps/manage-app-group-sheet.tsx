'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'

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
import type { GroupMemberRole, MockAppDistGroupDetail } from '@/types/app'
import { getInitials } from '@/lib/formatting'
import { isValidEmail } from '@/lib/validation'

interface ManageAppGroupSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: MockAppDistGroupDetail | null
}

export function ManageAppGroupSheet({
  open,
  onOpenChange,
  group,
}: ManageAppGroupSheetProps) {
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState<GroupMemberRole>('TESTER')

  const canAdd = isValidEmail(addEmail)

  function handleAddUser() {
    if (!canAdd || !group) return
    console.log('Add member to group:', { groupId: group.id, email: addEmail.trim(), role: addRole })
    toast.success(`Added ${addEmail.trim()} to group`)
    setAddEmail('')
    setAddRole('TESTER')
  }

  function handleRemoveMember(userId: string, email: string) {
    if (!group) return
    console.log('Remove member:', { groupId: group.id, userId })
    toast.success(`Removed ${email} from group`)
  }

  function handleClose() {
    onOpenChange(false)
    setAddEmail('')
    setAddRole('TESTER')
  }

  if (!group) return null

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{group.name}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-5 px-6 py-6">
            {group.description && (
              <p className="text-sm text-muted-foreground">{group.description}</p>
            )}

            {/* Members list */}
            <div className="space-y-2">
              <Label>Members ({group.members.length})</Label>
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
            </div>

            {/* Add user section */}
            <div className="space-y-2">
              <Label>Add User</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Email address"
                  type="email"
                  className="flex-1"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddUser()
                    }
                  }}
                />
                <Select
                  value={addRole}
                  onValueChange={(v) => setAddRole(v as GroupMemberRole)}
                >
                  <SelectTrigger className="w-[144px]" aria-label="Member role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="TESTER">Tester</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={!canAdd}
                  onClick={handleAddUser}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
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
  )
}
