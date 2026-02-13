'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
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

interface ProfileTabProps {
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
    isSuperAdmin: boolean
  }
}

export function ProfileTab({ user }: ProfileTabProps) {
  const [firstName, setFirstName] = useState(user.firstName ?? '')
  const [lastName, setLastName] = useState(user.lastName ?? '')
  const [saving, setSaving] = useState(false)

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const hasProfileChanges =
    firstName.trim() !== (user.firstName ?? '') ||
    lastName.trim() !== (user.lastName ?? '')

  async function handleSaveProfile() {
    if (!hasProfileChanges) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Failed to update profile')
      }
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setChangingPassword(true)
    try {
      const res = await fetch('/api/v1/users/me/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Failed to change password')
      }
      toast.success('Password changed successfully')
      handleClosePasswordDialog()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  function handleClosePasswordDialog() {
    setPasswordDialogOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setChangingPassword(false)
  }

  const canChangePassword =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword

  return (
    <>
      <div className="max-w-lg space-y-6">
        <div className="space-y-2">
          <Label htmlFor="profile-first-name">First Name</Label>
          <Input
            id="profile-first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={100}
            placeholder="Enter your first name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-last-name">Last Name</Label>
          <Input
            id="profile-last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            maxLength={100}
            placeholder="Enter your last name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <div className="relative">
            <Input
              id="profile-email"
              value={user.email}
              disabled
              className="pr-10"
            />
            <Lock
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Email cannot be changed.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            disabled={!hasProfileChanges || saving}
            style={{ backgroundColor: '#0077b6' }}
            onClick={handleSaveProfile}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setPasswordDialogOpen(true)}
          >
            Change Password
          </Button>
        </div>
      </div>

      <Dialog open={passwordDialogOpen} onOpenChange={(open) => {
        if (!open) handleClosePasswordDialog()
        else setPasswordDialogOpen(true)
      }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClosePasswordDialog}>
              Cancel
            </Button>
            <Button
              disabled={!canChangePassword || changingPassword}
              style={{ backgroundColor: '#0077b6' }}
              onClick={handleChangePassword}
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
