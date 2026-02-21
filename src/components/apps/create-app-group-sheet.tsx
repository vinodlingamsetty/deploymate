'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import type { GroupMemberRole } from '@/types/app'
import { isValidEmail } from '@/lib/validation'

interface CreateAppGroupSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appId: string
}

interface PendingMember {
  email: string
  role: GroupMemberRole
}

export function CreateAppGroupSheet({
  open,
  onOpenChange,
  appId,
}: CreateAppGroupSheetProps) {
  const router = useRouter()
  const [groupName, setGroupName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState<GroupMemberRole>('TESTER')
  const [members, setMembers] = useState<PendingMember[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canAddMember =
    isValidEmail(memberEmail) &&
    !members.some((m) => m.email === memberEmail.trim())

  const canCreate = groupName.trim().length > 0 && members.length >0

  function handleAddMember() {
    if (!canAddMember) return
    setMembers((prev) => [...prev, { email: memberEmail.trim(), role: memberRole }])
    setMemberEmail('')
    setMemberRole('TESTER')
  }

  function handleRemoveMember(email: string) {
    setMembers((prev) => prev.filter((m) => m.email !== email))
  }

  async function handleCreate() {
    if (!canCreate) return
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/v1/apps/${appId}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          members: members.map((m) => ({ email: m.email, role: m.role })),
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to create group')
        return
      }

      toast.success('Distribution group created')
      router.refresh()
      handleClose()
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleClose() {
    onOpenChange(false)
    setGroupName('')
    setMemberEmail('')
    setMemberRole('TESTER')
    setMembers([])
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Create Distribution Group</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-5 px-6 py-6">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="group-name">
                Group Name{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="group-name"
                placeholder="e.g. Beta Testers"
                maxLength={100}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                aria-required="true"
              />
            </div>

            {/* Add Members */}
            <div className="space-y-2">
              <Label>Members</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Email address"
                  type="email"
                  className="flex-1"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddMember()
                    }
                  }}
                />
                <Select
                  value={memberRole}
                  onValueChange={(v) => setMemberRole(v as GroupMemberRole)}
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
                  disabled={!canAddMember}
                  onClick={handleAddMember}
                >
                  Add
                </Button>
              </div>

              {/* Member list */}
              {members.length > 0 && (
                <div className="mt-3 space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.email}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate text-sm">{m.email}</span>
                        <span className="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                          {m.role === 'MANAGER' ? 'Manager' : 'Tester'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.email)}
                        className="ml-2 flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                        aria-label={`Remove ${m.email}`}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {members.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Add at least one member to create the group.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
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
