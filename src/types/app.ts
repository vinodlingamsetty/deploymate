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
  signingType: string | null
  provisioningName: string | null
  teamName: string | null
  provisioningExpiry: string | null
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

export const SIGNING_TYPE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  development: { label: 'Development', bg: '#fbbf24', text: '#1a1a1a' },
  adhoc:       { label: 'Ad Hoc',      bg: '#0077b6', text: '#ffffff' },
  enterprise:  { label: 'Enterprise',   bg: '#059669', text: '#ffffff' },
  appstore:    { label: 'App Store',    bg: '#6366f1', text: '#ffffff' },
}

export function isValidPlatform(value: unknown): value is Platform {
  return value === 'IOS' || value === 'ANDROID'
}

export function isValidReleaseType(value: unknown): value is ReleaseTypeName {
  return value === 'ALPHA' || value === 'BETA' || value === 'RELEASE_CANDIDATE'
}

export function getPlatformLabel(p: Platform): string {
  return p === 'IOS' ? 'iOS' : 'Android'
}

export function getReleaseTypeLabel(t: ReleaseTypeName): string {
  return RELEASE_TYPE_LABELS[t]
}

export type GroupMemberRole = 'MANAGER' | 'TESTER'

export interface MockAppDistGroupMember {
  userId: string
  email: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  role: GroupMemberRole
}

export interface MockAppDistGroup {
  id: string
  appId: string
  name: string
  description: string | null
  memberCount: number
  createdAt: string
}

export interface MockGroupInvitation {
  id: string
  email: string
  role: GroupMemberRole
  createdAt: string
  expiresAt: string
}

export interface MockAppDistGroupDetail extends MockAppDistGroup {
  members: MockAppDistGroupMember[]
  pendingInvitations: MockGroupInvitation[]
}

export interface MockOrgDistGroupMember {
  userId: string
  email: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  role: GroupMemberRole
}

export interface MockOrgDistGroupApp {
  appId: string
  name: string
  platform: Platform
}

export interface MockOrgDistGroup {
  id: string
  orgSlug: string
  name: string
  description: string | null
  memberCount: number
  managerCount: number
  testerCount: number
  linkedAppsCount: number
  createdAt: string
}

export interface MockOrgDistGroupDetail extends MockOrgDistGroup {
  members: MockOrgDistGroupMember[]
  apps: MockOrgDistGroupApp[]
}

export interface MockOrganization {
  name: string
  slug: string
}

export interface MockReleaseGroup {
  releaseId: string
  groups: Array<{ id: string; type: 'app' | 'org'; name: string; memberCount: number }>
}
