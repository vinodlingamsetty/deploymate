'use client'

import { useState } from 'react'
import { Loader2, Pencil, RefreshCw, X } from 'lucide-react'
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
import type { GroupMemberRole, MockAppDistGroupDetail, MockGroupInvitation } from '@/types/app'
import { getInitials } from '@/lib/formatting'
import { isValidEmail } from '@/lib/validation'

interface ManageAppGroupSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: MockAppDistGroupDetail | null
  onGroupRenamed?: (groupId: string, newName: string) => void
  onRefreshGroup?: (groupId: string) => Promise<void>
}

export function ManageAppGroupSheet({
  open,
  onOpenChange,
  group,
  onGroupRenamed,
  onRefreshGroup,
}: ManageAppGroupSheetProps) {
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState<GroupMemberRole>('TESTER')
  const [isAdding, setIsAdding] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  // Optimistic remove for pending invitations
  const [revokedIds, setRevokedIds] = useState<Set<string>>(new Set())

  async function handleSaveName() {
    if (!group) return
    const trimmed = editName.trim()
    if (!trimmed || trimmed === group.name) { setIsEditingName(false); return }
    setIsSavingName(true)
    const res = await fetch(`/api/v1/groups/app/${group.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
    setIsSavingName(false)
    if (!res.ok) {
      const json = await res.json()
      toast.error(json.error?.message ?? 'Failed to rename group')
      return
    }
    onGroupRenamed?.(group.id, trimmed)
    setIsEditingName(false)
    toast.success('Group renamed')
  }

  const canAdd = isValidEmail(addEmail)

  async function handleAddUser() {
    if (!canAdd || !group || isAdding) return
    setIsAdding(true)
    try {
      const res = await fetch(`/api/v1/groups/app/${group.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: [{ email: addEmail.trim(), role: addRole }] }),
      })
      const json = await res.json() as { data?: { added: number; invited: number }; error?: { message?: string } }
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to add member')
        return
      }
      const { added = 0, invited = 0 } = json.data ?? {}
      if (added > 0 && invited > 0) {
        toast.success(`Added 1 member and sent 1 invite`)
      } else if (added > 0) {
        toast.success(`Added ${addEmail.trim()} to group`)
      } else if (invited > 0) {
        toast.success(`Invite sent to ${addEmail.trim()}`)
      }
      setAddEmail('')
      setAddRole('TESTER')
      await onRefreshGroup?.(group.id)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleRemoveMember(userId: string, email: string) {
    if (!group) return
    const res = await fetch(`/api/v1/groups/app/${group.id}/members/${userId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const json = await res.json()
      toast.error(json.error?.message ?? 'Failed to remove member')
      return
    }
    toast.success(`Removed ${email} from group`)
    await onRefreshGroup?.(group.id)
  }

  async function handleResendInvite(inv: MockGroupInvitation) {
    setResendingId(inv.id)
    try {
      const res = await fetch(`/api/v1/group-invitations/${inv.id}/resend`, {
        method: 'POST',
      })
      const json = await res.json() as { error?: { message?: string } }
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to resend invite')
        return
      }
      toast.success('Invite resent')
    } finally {
      setResendingId(null)
    }
  }

  async function handleRevokeInvite(inv: MockGroupInvitation) {
    setRevokingId(inv.id)
    // Optimistic remove
    setRevokedIds((prev) => new Set(Array.from(prev).concat(inv.id)))
    try {
      const res = await fetch(`/api/v1/group-invitations/${inv.id}/revoke`, {
        method: 'DELETE',
      })
      const json = await res.json() as { error?: { message?: string } }
      if (!res.ok) {
        // Undo optimistic remove
        setRevokedIds((prev) => { const next = new Set(prev); next.delete(inv.id); return next })
        toast.error(json.error?.message ?? 'Failed to revoke invite')
        return
      }
      toast.success('Invite revoked')
    } finally {
      setRevokingId(null)
    }
  }

  function handleClose() {
    setIsEditingName(false)
    setEditName('')
    setRevokedIds(new Set())
    onOpenChange(false)
    setAddEmail('')
    setAddRole('TESTER')
  }

  if (!group) return null

  const visibleInvitations = (group.pendingInvitations ?? []).filter(
    (inv) => !revokedIds.has(inv.id),
  )

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); void handleSaveName() }
                  if (e.key === 'Escape') { setIsEditingName(false) }
                }}
                className="h-8 text-base font-semibold"
              />
              <Button
                size="sm"
                disabled={isSavingName || !editName.trim()}
                onClick={() => void handleSaveName()}
              >
                Save
              </Button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                aria-label="Cancel rename"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <SheetTitle>{group.name}</SheetTitle>
              <button
                type="button"
                onClick={() => { setEditName(group.name); setIsEditingName(true) }}
                className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                aria-label="Rename group"
              >
                <Pencil className="size-4 text-muted-foreground" aria-hidden="true" />
              </button>
            </div>
          )}
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
                      onClick={() => void handleRemoveMember(m.userId, m.email)}
                      className="flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                      aria-label={`Remove ${m.email}`}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Invitations */}
            {visibleInvitations.length > 0 && (
              <div className="space-y-2">
                <Label>Pending Invitations ({visibleInvitations.length})</Label>
                <div className="space-y-2">
                  {visibleInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center gap-3 rounded-md border border-dashed px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{inv.email}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {inv.role === 'MANAGER' ? 'Manager' : 'Tester'}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleResendInvite(inv)}
                        disabled={resendingId === inv.id}
                        className="flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-muted disabled:opacity-50"
                        aria-label={`Resend invite to ${inv.email}`}
                        title="Resend invite"
                      >
                        {resendingId === inv.id
                          ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                          : <RefreshCw className="size-3.5" aria-hidden="true" />
                        }
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRevokeInvite(inv)}
                        disabled={revokingId === inv.id}
                        className="flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-muted disabled:opacity-50"
                        aria-label={`Revoke invite for ${inv.email}`}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      void handleAddUser()
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
                  disabled={!canAdd || isAdding}
                  onClick={() => void handleAddUser()}
                >
                  {isAdding ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Add'}
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
