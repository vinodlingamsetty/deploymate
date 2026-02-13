'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Shield, Users } from 'lucide-react'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface OrgMembership {
  id: string
  role: string
  org: { id: string; name: string; slug: string }
}

interface OrganizationsTabProps {
  memberships: OrgMembership[]
  isSuperAdmin: boolean
}

export function OrganizationsTab({ memberships, isSuperAdmin }: OrganizationsTabProps) {
  const router = useRouter()
  const [orgs, setOrgs] = useState(memberships)

  // Leave dialog state
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leaveTarget, setLeaveTarget] = useState<OrgMembership | null>(null)
  const [leaveConfirmName, setLeaveConfirmName] = useState('')
  const [leaving, setLeaving] = useState(false)

  // Manage sheet state
  const [manageSheetOpen, setManageSheetOpen] = useState(false)
  const [manageTarget, setManageTarget] = useState<OrgMembership | null>(null)
  const [manageName, setManageName] = useState('')
  const [manageSaving, setManageSaving] = useState(false)
  const [manageMembers, setManageMembers] = useState<
    Array<{ id: string; email: string; firstName: string | null; lastName: string | null; role: string }>
  >([])
  const [addAdminEmail, setAddAdminEmail] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)

  // Remove admin dialog
  const [removeAdminDialogOpen, setRemoveAdminDialogOpen] = useState(false)
  const [removeAdminTarget, setRemoveAdminTarget] = useState<{
    membershipId: string
    email: string
  } | null>(null)
  const [removingAdmin, setRemovingAdmin] = useState(false)

  // Create sheet state
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)

  // Leave flow
  function openLeaveDialog(membership: OrgMembership) {
    setLeaveTarget(membership)
    setLeaveConfirmName('')
    setLeaveDialogOpen(true)
  }

  async function handleLeave() {
    if (!leaveTarget || leaveConfirmName.trim() !== leaveTarget.org.name) return
    setLeaving(true)
    try {
      const res = await fetch(
        `/api/v1/organizations/${leaveTarget.org.slug}/members/${leaveTarget.id}`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Failed to leave organization')
      }
      setOrgs((prev) => prev.filter((m) => m.id !== leaveTarget.id))
      toast.success(`Left ${leaveTarget.org.name}`)
      setLeaveDialogOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave organization')
    } finally {
      setLeaving(false)
    }
  }

  // Manage flow
  async function openManageSheet(membership: OrgMembership) {
    setManageTarget(membership)
    setManageName(membership.org.name)
    setManageSheetOpen(true)
    setAddAdminEmail('')

    try {
      const res = await fetch(`/api/v1/organizations/${membership.org.slug}/members`)
      if (res.ok) {
        const json = await res.json() as {
          data: Array<{
            id: string
            email: string
            firstName: string | null
            lastName: string | null
            role: string
          }>
        }
        setManageMembers(json.data)
      }
    } catch {
      // silently fail, members list will be empty
    }
  }

  async function handleManageSave() {
    if (!manageTarget || !manageName.trim()) return
    setManageSaving(true)
    try {
      const res = await fetch(`/api/v1/organizations/${manageTarget.org.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: manageName.trim() }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Failed to update organization')
      }
      const updated = await res.json() as { data: { name: string; slug: string } }
      setOrgs((prev) =>
        prev.map((m) =>
          m.id === manageTarget.id
            ? { ...m, org: { ...m.org, name: updated.data.name, slug: updated.data.slug } }
            : m,
        ),
      )
      toast.success('Organization updated')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update organization')
    } finally {
      setManageSaving(false)
    }
  }

  async function handleAddAdmin() {
    if (!manageTarget || !addAdminEmail.trim()) return
    setAddingAdmin(true)
    try {
      const res = await fetch(
        `/api/v1/organizations/${manageTarget.org.slug}/invitations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: addAdminEmail.trim(), role: 'ADMIN' }),
        },
      )
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Failed to send invitation')
      }
      toast.success(`Invitation sent to ${addAdminEmail.trim()}`)
      setAddAdminEmail('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setAddingAdmin(false)
    }
  }

  // Remove admin flow
  function openRemoveAdminDialog(membershipId: string, email: string) {
    setRemoveAdminTarget({ membershipId, email })
    setRemoveAdminDialogOpen(true)
  }

  async function handleRemoveAdmin() {
    if (!manageTarget || !removeAdminTarget) return
    setRemovingAdmin(true)
    try {
      const res = await fetch(
        `/api/v1/organizations/${manageTarget.org.slug}/members/${removeAdminTarget.membershipId}`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Failed to remove member')
      }
      setManageMembers((prev) =>
        prev.filter((m) => m.id !== removeAdminTarget.membershipId),
      )
      toast.success(`Removed ${removeAdminTarget.email}`)
      setRemoveAdminDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setRemovingAdmin(false)
    }
  }

  // Create flow
  async function handleCreate() {
    if (!createName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/v1/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim() }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Failed to create organization')
      }
      const json = await res.json() as { data: { id: string; name: string; slug: string } }
      setOrgs((prev) => [
        ...prev,
        { id: `new-${json.data.id}`, role: 'ADMIN', org: json.data },
      ])
      toast.success(`Created ${json.data.name}`)
      setCreateSheetOpen(false)
      setCreateName('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setCreating(false)
    }
  }

  function handleCloseManageSheet() {
    setManageSheetOpen(false)
    setManageTarget(null)
    setManageMembers([])
    setAddAdminEmail('')
  }

  const roleBadgeColor: Record<string, string> = {
    ADMIN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    TESTER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Organizations</h2>
          {isSuperAdmin && (
            <Button
              size="sm"
              style={{ backgroundColor: '#0077b6' }}
              onClick={() => setCreateSheetOpen(true)}
            >
              <Plus className="mr-1.5 size-4" aria-hidden="true" />
              Create Organization
            </Button>
          )}
        </div>

        {orgs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            You are not a member of any organizations yet.
          </p>
        ) : (
          <div className="space-y-3">
            {orgs.map((membership) => (
              <div
                key={membership.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Users className="size-5 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{membership.org.name}</p>
                    <span
                      className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        roleBadgeColor[membership.role] ?? roleBadgeColor.TESTER
                      }`}
                    >
                      {membership.role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {membership.role === 'ADMIN' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openManageSheet(membership)}
                    >
                      <Shield className="mr-1.5 size-3.5" aria-hidden="true" />
                      Manage
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => openLeaveDialog(membership)}
                  >
                    Leave
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave org dialog */}
      <Dialog
        open={leaveDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setLeaveDialogOpen(false)
            setLeaveConfirmName('')
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Leave {leaveTarget?.org.name}?</DialogTitle>
            <DialogDescription>
              You will lose access to all apps and groups in this organization.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="leave-confirm">
              Type <strong>{leaveTarget?.org.name}</strong> to confirm
            </Label>
            <Input
              id="leave-confirm"
              value={leaveConfirmName}
              onChange={(e) => setLeaveConfirmName(e.target.value)}
              placeholder={leaveTarget?.org.name}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={leaveConfirmName.trim() !== leaveTarget?.org.name || leaving}
              onClick={handleLeave}
            >
              {leaving ? 'Leaving...' : 'Leave Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage org sheet */}
      <Sheet open={manageSheetOpen} onOpenChange={(open) => { if (!open) handleCloseManageSheet() }}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Manage Organization</SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex-1 space-y-6 px-6 py-6">
              {/* Org name edit */}
              <div className="space-y-2">
                <Label htmlFor="manage-org-name">Organization Name</Label>
                <Input
                  id="manage-org-name"
                  value={manageName}
                  onChange={(e) => setManageName(e.target.value)}
                  maxLength={100}
                />
                <Button
                  size="sm"
                  disabled={!manageName.trim() || manageName.trim() === manageTarget?.org.name || manageSaving}
                  style={{ backgroundColor: '#0077b6' }}
                  onClick={handleManageSave}
                >
                  {manageSaving ? 'Saving...' : 'Update Name'}
                </Button>
              </div>

              {/* Members list */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Members</h3>
                {manageMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Loading members...</p>
                ) : (
                  <div className="space-y-2">
                    {manageMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {member.firstName && member.lastName
                              ? `${member.firstName} ${member.lastName}`
                              : member.email}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                          <span
                            className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              roleBadgeColor[member.role] ?? roleBadgeColor.TESTER
                            }`}
                          >
                            {member.role}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => openRemoveAdminDialog(member.id, member.email)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add admin */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Invite Admin</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="admin@example.com"
                    type="email"
                    value={addAdminEmail}
                    onChange={(e) => setAddAdminEmail(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={!addAdminEmail.trim() || addingAdmin}
                    style={{ backgroundColor: '#0077b6' }}
                    onClick={handleAddAdmin}
                  >
                    {addingAdmin ? 'Sending...' : 'Invite'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t px-6 py-4">
              <Button
                variant="ghost"
                className="w-full hover:bg-destructive/10 hover:text-destructive"
                onClick={handleCloseManageSheet}
              >
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Remove admin dialog */}
      <Dialog
        open={removeAdminDialogOpen}
        onOpenChange={(open) => {
          if (!open) setRemoveAdminDialogOpen(false)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              <strong>{removeAdminTarget?.email}</strong> from this organization?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveAdminDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={removingAdmin}
              onClick={handleRemoveAdmin}
            >
              {removingAdmin ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create org sheet */}
      <Sheet
        open={createSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateSheetOpen(false)
            setCreateName('')
          }
        }}
      >
        <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Create Organization</SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex-1 space-y-5 px-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="create-org-name">
                  Organization Name{' '}
                  <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-org-name"
                  placeholder="e.g. Acme Corp"
                  maxLength={100}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  aria-required="true"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  setCreateSheetOpen(false)
                  setCreateName('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!createName.trim() || creating}
                style={{ backgroundColor: '#0077b6' }}
                onClick={handleCreate}
              >
                {creating ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
