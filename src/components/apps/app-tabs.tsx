'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReleaseCard } from '@/components/apps/release-card'
import type { MockRelease } from '@/types/app'

interface AppTabsProps {
  releases: MockRelease[]
}

export function AppTabs({ releases }: AppTabsProps) {
  return (
    <Tabs defaultValue="releases">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="releases">Releases</TabsTrigger>
        <TabsTrigger value="feedback">User Feedback</TabsTrigger>
        <TabsTrigger value="metadata">Metadata</TabsTrigger>
        <TabsTrigger value="groups" className="hidden md:inline-flex">
          Distribution Groups
        </TabsTrigger>
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
        <p className="py-8 text-center text-sm text-muted-foreground">
          Coming soon — distribution groups will appear here.
        </p>
      </TabsContent>
    </Tabs>
  )
}
