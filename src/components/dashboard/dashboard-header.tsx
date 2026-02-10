'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NewAppSheet } from '@/components/dashboard/new-app-sheet'

interface DashboardHeaderProps {
  firstName: string
  organizations: Array<{ name: string; slug: string }>
  currentOrg: string
  currentPlatform: string
  currentType: string
  currentView: string
}

export function DashboardHeader({
  firstName,
  organizations,
  currentOrg,
  currentPlatform,
  currentType,
  currentView,
}: DashboardHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === 'all' || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`/dashboard?${params.toString()}`)
    },
    [router, searchParams]
  )

  function setView(view: 'grid' | 'list') {
    updateParam('view', view)
  }

  return (
    <div className="space-y-4">
      {/* Welcome message */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage and distribute your apps to testers.
          </p>
        </div>

        {/* New App button — desktop only */}
        <Button
          className="hidden lg:flex"
          style={{ backgroundColor: '#0077b6' }}
          onClick={() => setSheetOpen(true)}
        >
          <Plus className="mr-2 size-4" aria-hidden="true" />
          New App
        </Button>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Org filter */}
        <Select
          value={currentOrg || 'all'}
          onValueChange={(v) => updateParam('org', v)}
        >
          <SelectTrigger className="w-[140px]" aria-label="Filter by organization">
            <SelectValue placeholder="All Orgs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orgs</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.slug} value={org.slug}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Platform filter */}
        <Select
          value={currentPlatform || 'all'}
          onValueChange={(v) => updateParam('platform', v)}
        >
          <SelectTrigger className="w-[140px]" aria-label="Filter by platform">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="IOS">iOS</SelectItem>
            <SelectItem value="ANDROID">Android</SelectItem>
          </SelectContent>
        </Select>

        {/* Release type filter */}
        <Select
          value={currentType || 'all'}
          onValueChange={(v) => updateParam('type', v)}
        >
          <SelectTrigger className="w-[140px]" aria-label="Filter by release type">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="ALPHA">Alpha</SelectItem>
            <SelectItem value="BETA">Beta</SelectItem>
            <SelectItem value="RELEASE_CANDIDATE">RC</SelectItem>
          </SelectContent>
        </Select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center rounded-md border">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-r-none ${currentView !== 'list' ? 'bg-accent' : ''}`}
            onClick={() => setView('grid')}
            aria-label="Grid view"
            aria-pressed={currentView !== 'list'}
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-l-none ${currentView === 'list' ? 'bg-accent' : ''}`}
            onClick={() => setView('list')}
            aria-label="List view"
            aria-pressed={currentView === 'list'}
          >
            <List className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {/* New App button — mobile */}
        <Button
          className="lg:hidden"
          size="sm"
          style={{ backgroundColor: '#0077b6' }}
          onClick={() => setSheetOpen(true)}
        >
          <Plus className="mr-1.5 size-4" aria-hidden="true" />
          New App
        </Button>
      </div>

      <NewAppSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        organizations={organizations}
      />
    </div>
  )
}
