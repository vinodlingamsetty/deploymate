'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileTab } from '@/components/settings/profile-tab'
import { NotificationsTab } from '@/components/settings/notifications-tab'
import { OrganizationsTab } from '@/components/settings/organizations-tab'
import { ApiTokensTab } from '@/components/settings/api-tokens-tab'

interface SettingsContentProps {
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
    isSuperAdmin: boolean
  }
  memberships: Array<{
    id: string
    role: string
    org: { id: string; name: string; slug: string }
  }>
  isSuperAdmin: boolean
}

export function SettingsContent({ user, memberships, isSuperAdmin }: SettingsContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, notifications, and API access.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="tokens">API Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab user={user} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="organizations" className="mt-6">
          <OrganizationsTab memberships={memberships} isSuperAdmin={isSuperAdmin} />
        </TabsContent>

        <TabsContent value="tokens" className="mt-6">
          <ApiTokensTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
