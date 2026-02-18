'use client'

import { useState } from 'react'
import { Plus, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReleaseCard } from '@/components/apps/release-card'
import { CreateAppGroupSheet } from '@/components/apps/create-app-group-sheet'
import { ManageAppGroupSheet } from '@/components/apps/manage-app-group-sheet'
import { AppMembersTab } from '@/components/apps/app-members-tab'
import { MOCK_APP_DISTRIBUTION_GROUPS, MOCK_APP_GROUP_DETAILS } from '@/lib/mock-data'
import type { MockAppDistGroupDetail, MockRelease } from '@/types/app'

interface AppTabsProps {
  releases: MockRelease[]
  appId: string
  isAdmin?: boolean
}

export function AppTabs({ releases, appId, isAdmin = false }: AppTabsProps) {
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [manageSheetOpen, setManageSheetOpen] = useState(false)
  const [activeGroup, setActiveGroup] = useState<MockAppDistGroupDetail | null>(null)

  const groups = MOCK_APP_DISTRIBUTION_GROUPS.filter((g) => g.appId === appId)

  function handleManageGroup(groupId: string) {
    const detail = MOCK_APP_GROUP_DETAILS[groupId] ?? null
    setActiveGroup(detail)
    setManageSheetOpen(true)
  }

  return (
    <>
      <Tabs defaultValue="releases">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="releases">Releases</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="groups" className="hidden md:inline-flex">
            Distribution Groups
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="members" className="hidden md:inline-flex">
              Members
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="releases" className="mt-4 space-y-3">
          {releases.length > 0 ? (
            releases.map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No releases yet. Upload your first build to get started.
            </p>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="mt-4">
          <p className="py-8 text-center text-sm text-muted-foreground">
            Coming soon — user feedback will appear here.
          </p>
        </TabsContent>

        <TabsContent value="metadata" className="mt-4">
          <p className="py-8 text-center text-sm text-muted-foreground">
            Coming soon — app metadata will appear here.
          </p>
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Distribution Groups</h2>
            <Button
              size="sm"
              style={{ backgroundColor: '#0077b6' }}
              onClick={() => setCreateSheetOpen(true)}
            >
              <Plus className="mr-1.5 size-4" aria-hidden="true" />
              Create Group
            </Button>
          </div>

          {groups.length > 0 ? (
            <div className="mt-4 space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <Users className="size-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                      </p>
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
              ))}
            </div>
          ) : (
            <p className="mt-4 py-8 text-center text-sm text-muted-foreground">
              No distribution groups yet. Create one to start distributing releases.
            </p>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="members" className="mt-4">
            <AppMembersTab appId={appId} />
          </TabsContent>
        )}
      </Tabs>

      <CreateAppGroupSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        appId={appId}
      />

      <ManageAppGroupSheet
        open={manageSheetOpen}
        onOpenChange={setManageSheetOpen}
        group={activeGroup}
      />
    </>
  )
}
