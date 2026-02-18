'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type AppMemberRole = 'MANAGER' | 'TESTER'

interface AppMember {
  userId: string
  email: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  role: AppMemberRole
}

const ROLE_BADGE: Record<AppMemberRole, { label: string; color: string }> = {
  MANAGER: { label: 'Manager', color: '#0077b6' },
  TESTER: { label: 'Tester', color: '#6b7280' },
}

interface AppMembersTabProps {
  appId: string
}

export function AppMembersTab({ appId }: AppMembersTabProps) {
  const [members, setMembers] = useState<AppMember[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editMember, setEditMember] = useState<AppMember | null>(null)
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<AppMemberRole>('TESTER')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/apps/${appId}/members`)
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: { message?: string } } | null
        throw new Error(body?.error?.message ?? `Failed to load members (${res.status})`)
      }
      const json = await res.json() as { data: AppMember[] }
      setMembers(json.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load app members')
    } finally {
      setLoading(false)
    }
  }, [appId])

  useEffect(() => {
    void fetchMembers()
  }, [fetchMembers])

  function openAddDialog() {
    setUserId('')
    setRole('TESTER')
    setAddDialogOpen(true)
  }

  function openEditDialog(member: AppMember) {
    setEditMember(member)
    setRole(member.role)
  }

  async function handleAdd() {
    if (!userId.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/apps/${appId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim(), role }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Failed to add member')
      }
      toast.success('Member added')
      setAddDialogOpen(false)
      void fetchMembers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (!editMember) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/apps/${appId}/members/${editMember.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Failed to update role')
      }
      toast.success('Role updated')
      setEditMember(null)
      void fetchMembers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(memberId: string) {
    setDeletingId(memberId)
    try {
      const res = await fetch(`/api/v1/apps/${appId}/members/${memberId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Failed to remove member')
      }
      toast.success('Role override removed')
      void fetchMembers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setDeletingId(null)
    }
  }

  function displayName(m: AppMember) {
    if (m.firstName || m.lastName) return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
    return m.email
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">App-Level Role Overrides</h2>
            <p className="text-sm text-muted-foreground">
              Override org roles for specific users on this app. Users not listed here use their org role.
            </p>
          </div>
          <Button size="sm" style={{ backgroundColor: '#0077b6' }} onClick={openAddDialog}>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Add Override
          </Button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : members.length > 0 ? (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const badge = ROLE_BADGE[m.role]
                  return (
                    <tr key={m.userId} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        <p className="font-medium">{displayName(m)}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => openEditDialog(m)}
                            aria-label="Edit role"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            disabled={deletingId === m.userId}
                            onClick={() => handleDelete(m.userId)}
                            aria-label="Remove override"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No overrides set. All users use their org-level role for this app.
          </p>
        )}
      </div>

      {/* Add member dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Add Role Override</DialogTitle>
            <DialogDescription>
              Assign an app-specific role to an org member. This overrides their org role for this app only.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-user-id">User ID</Label>
              <Input
                id="add-user-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppMemberRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="TESTER">Tester</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!userId.trim() || saving}
              style={{ backgroundColor: '#0077b6' }}
              onClick={handleAdd}
            >
              {saving ? 'Adding…' : 'Add Override'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit role dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => { if (!open) setEditMember(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              {editMember ? `Update the app-level role for ${displayName(editMember)}.` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppMemberRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="TESTER">Tester</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>Cancel</Button>
            <Button
              disabled={saving}
              style={{ backgroundColor: '#0077b6' }}
              onClick={handleEdit}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
