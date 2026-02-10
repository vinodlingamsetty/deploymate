'use client'

import { useRouter } from 'next/navigation'
import { Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { MockApp } from '@/types/app'
import {
  getPlatformLabel,
  getReleaseTypeLabel,
  RELEASE_TYPE_COLORS,
} from '@/types/app'

interface AppListRowProps {
  app: MockApp
}

export function AppListRow({ app }: AppListRowProps) {
  const router = useRouter()

  const badgeColors = app.latestRelease
    ? RELEASE_TYPE_COLORS[app.latestRelease.releaseType]
    : null

  function handleRowClick() {
    router.push(`/apps/${app.id}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(`/apps/${app.id}`)
    }
  }

  return (
    <tr
      className="cursor-pointer border-b transition-colors hover:bg-muted/50"
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-label={`${app.name} — ${getPlatformLabel(app.platform)}`}
    >
      {/* Icon + Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-lg"
            aria-hidden="true"
          >
            {app.platform === 'IOS' ? '🍎' : '🤖'}
          </span>
          <span className="font-medium">{app.name}</span>
        </div>
      </td>

      {/* Org */}
      <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
        {app.org.name}
      </td>

      {/* Platform */}
      <td className="hidden px-4 py-3 text-sm md:table-cell">
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
          {getPlatformLabel(app.platform)}
        </span>
      </td>

      {/* Version */}
      <td className="hidden px-4 py-3 lg:table-cell">
        {app.latestRelease ? (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Tag className="size-3.5" aria-hidden="true" />
            <span className="font-mono text-xs">v{app.latestRelease.version}</span>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>

      {/* Release Type */}
      <td className="hidden px-4 py-3 md:table-cell">
        {app.latestRelease && badgeColors ? (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: badgeColors.bg,
              color: badgeColors.text,
            }}
          >
            {getReleaseTypeLabel(app.latestRelease.releaseType)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>

      {/* Testers */}
      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
        {app.testerCount}
      </td>

      {/* View button */}
      <td className="px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/apps/${app.id}`)
          }}
          aria-label={`View details for ${app.name}`}
        >
          View
        </Button>
      </td>
    </tr>
  )
}
