'use client'

import { useState } from 'react'
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
import { isValidEmail as checkEmail } from '@/lib/validation'

interface AddUserSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
}

export function AddUserSheet({ open, onOpenChange, groupId }: AddUserSheetProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<GroupMemberRole>('TESTER')

  const isValidEmail = checkEmail(email)
  const canAdd = email.trim().length > 0 && isValidEmail

  function handleAdd() {
    if (!canAdd) return
    console.log('Add user to org group:', { groupId, email: email.trim(), role })
    toast.success(`Added ${email.trim()} to group`)
    handleClose()
  }

  function handleClose() {
    onOpenChange(false)
    setEmail('')
    setRole('TESTER')
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Add User</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="add-user-email">
                Email{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="add-user-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-user-role">
                Role{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as GroupMemberRole)}>
                <SelectTrigger id="add-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="TESTER">Tester</SelectItem>
                </SelectContent>
              </Select>
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
              disabled={!canAdd}
              style={{ backgroundColor: '#0077b6' }}
              onClick={handleAdd}
            >
              Add User
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
