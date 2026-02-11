'use client'

import { useState } from 'react'
import { Plus, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CreateOrgGroupSheet } from '@/components/groups/create-org-group-sheet'
import { ManageOrgGroupSheet } from '@/components/groups/manage-org-group-sheet'
import { MOCK_ORG_GROUP_DETAILS } from '@/lib/mock-data'
import type { MockOrgDistGroup, MockOrgDistGroupDetail } from '@/types/app'

interface GroupsPageContentProps {
  orgName: string
  orgSlug: string
  groups: MockOrgDistGroup[]
}

export function GroupsPageContent({ orgName, orgSlug, groups }: GroupsPageContentProps) {
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [manageSheetOpen, setManageSheetOpen] = useState(false)
  const [activeGroup, setActiveGroup] = useState<MockOrgDistGroupDetail | null>(null)

  function handleManageGroup(groupId: string) {
    const detail = MOCK_ORG_GROUP_DETAILS[groupId] ?? null
    setActiveGroup(detail)
    setManageSheetOpen(true)
  }

  return (
    <>
      <div className="space-y-6 px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold sm:text-2xl">
            Distribution Groups — {orgName}
          </h1>
          <Button
            size="sm"
            style={{ backgroundColor: '#0077b6' }}
            onClick={() => setCreateSheetOpen(true)}
          >
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            New Group
          </Button>
        </div>

        {/* Group cards */}
        {groups.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex flex-col gap-3 rounded-lg border p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <Users className="size-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{group.name}</p>
                      {group.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageGroup(group.id)}
                  >
                    Manage
                  </Button>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}{' '}
                    ({group.managerCount} Manager{group.managerCount !== 1 ? 's' : ''},{' '}
                    {group.testerCount} Tester{group.testerCount !== 1 ? 's' : ''})
                  </span>
                  <span>
                    {group.linkedAppsCount} linked app{group.linkedAppsCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Users className="mx-auto size-10 text-muted-foreground/40" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">
              No distribution groups yet. Create one to start managing testers.
            </p>
          </div>
        )}
      </div>

      <CreateOrgGroupSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        orgSlug={orgSlug}
      />

      <ManageOrgGroupSheet
        open={manageSheetOpen}
        onOpenChange={setManageSheetOpen}
        group={activeGroup}
        orgSlug={orgSlug}
      />
    </>
  )
}
