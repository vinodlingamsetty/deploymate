export type Platform = 'IOS' | 'ANDROID'
export type ReleaseTypeName = 'ALPHA' | 'BETA' | 'RELEASE_CANDIDATE'

export interface MockApp {
  id: string
  name: string
  platform: Platform
  iconUrl: string | null
  org: { name: string; slug: string }
  latestRelease: {
    version: string
    releaseType: ReleaseTypeName
    createdAt: string
  } | null
  testerCount: number
  totalDownloads: number
}

export interface MockRelease {
  id: string
  appId: string
  version: string
  buildNumber: string
  releaseType: ReleaseTypeName
  releaseNotes: string
  fileSize: number
  downloadCount: number
  createdAt: string
  minOSVersion: string | null
}

export interface MockDistributionGroup {
  id: string
  name: string
  memberCount: number
}

export const RELEASE_TYPE_LABELS: Record<ReleaseTypeName, string> = {
  ALPHA: 'Alpha',
  BETA: 'Beta',
  RELEASE_CANDIDATE: 'RC',
}

export const RELEASE_TYPE_COLORS: Record<
  ReleaseTypeName,
  { bg: string; text: string }
> = {
  ALPHA: { bg: '#90e0ef', text: '#1a1a1a' },
  BETA: { bg: '#0077b6', text: '#ffffff' },
  RELEASE_CANDIDATE: { bg: '#03045e', text: '#ffffff' },
}

export function getPlatformLabel(p: Platform): string {
  return p === 'IOS' ? 'iOS' : 'Android'
}

export function getReleaseTypeLabel(t: ReleaseTypeName): string {
  return RELEASE_TYPE_LABELS[t]
}
