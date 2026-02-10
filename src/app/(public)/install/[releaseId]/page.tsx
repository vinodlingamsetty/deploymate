import { notFound } from 'next/navigation'
import { Smartphone, TabletSmartphone } from 'lucide-react'

import { generateOtaToken } from '@/lib/ota-token'
import { InstallButton } from '@/components/releases/install-button'
import { RELEASE_TYPE_COLORS, RELEASE_TYPE_LABELS } from '@/types/app'
import type { Platform, ReleaseTypeName } from '@/types/app'

interface InstallPageProps {
  params: { releaseId: string }
}

export default async function InstallPage({ params }: InstallPageProps) {
  const { db } = await import('@/lib/db')

  const release = await db.release.findUnique({
    where: { id: params.releaseId },
    include: {
      app: {
        include: { organization: true },
      },
    },
  })

  if (!release) notFound()

  const platform = release.app.platform as Platform
  const releaseType = release.releaseType as ReleaseTypeName
  const colors = RELEASE_TYPE_COLORS[releaseType]
  const otaToken = platform === 'IOS' ? generateOtaToken(release.id) : undefined

  const PlatformIcon = platform === 'IOS' ? TabletSmartphone : Smartphone

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl bg-card p-6 shadow-xl">
        {/* App icon area */}
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <PlatformIcon className="size-8 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>

        {/* App info */}
        <div className="mt-4 text-center">
          <h1 className="text-lg font-bold">{release.app.name}</h1>
          <p className="text-sm text-muted-foreground">
            {release.app.organization.name}
          </p>
        </div>

        {/* Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
            {platform === 'IOS' ? 'iOS' : 'Android'}
          </span>
          <span className="font-mono text-sm font-medium">
            v{release.version}
          </span>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {RELEASE_TYPE_LABELS[releaseType]}
          </span>
        </div>

        {/* Install button */}
        <div className="mt-6">
          <InstallButton
            releaseId={release.id}
            platform={platform}
            otaToken={otaToken}
            colors={colors}
            className="w-full"
          />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by DeployMate
        </p>
      </div>
    </div>
  )
}
