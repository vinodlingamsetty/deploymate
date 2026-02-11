import type { MockApp, MockAppDistGroup, MockAppDistGroupDetail, MockDistributionGroup, MockOrgDistGroup, MockOrgDistGroupDetail, MockOrganization, MockReleaseGroup, MockRelease } from '@/types/app'

export const MOCK_APPS: MockApp[] = [
  // Finance org
  {
    id: 'app-finance-ios',
    name: 'FinanceTracker',
    platform: 'IOS',
    iconUrl: null,
    org: { name: 'Finance', slug: 'finance' },
    latestRelease: {
      version: '2.1.0',
      releaseType: 'BETA',
      createdAt: '2026-01-28T10:00:00Z',
    },
    testerCount: 24,
    totalDownloads: 312,
  },
  {
    id: 'app-finance-android',
    name: 'FinanceTracker',
    platform: 'ANDROID',
    iconUrl: null,
    org: { name: 'Finance', slug: 'finance' },
    latestRelease: {
      version: '2.0.3',
      releaseType: 'RELEASE_CANDIDATE',
      createdAt: '2026-01-25T14:00:00Z',
    },
    testerCount: 18,
    totalDownloads: 198,
  },
  // Sales org
  {
    id: 'app-sales-crm',
    name: 'SalesPulse CRM',
    platform: 'IOS',
    iconUrl: null,
    org: { name: 'Sales', slug: 'sales' },
    latestRelease: {
      version: '1.4.0',
      releaseType: 'ALPHA',
      createdAt: '2026-02-01T09:00:00Z',
    },
    testerCount: 12,
    totalDownloads: 87,
  },
  {
    id: 'app-sales-reports',
    name: 'Sales Reports',
    platform: 'IOS',
    iconUrl: null,
    org: { name: 'Sales', slug: 'sales' },
    latestRelease: {
      version: '3.0.0',
      releaseType: 'BETA',
      createdAt: '2026-01-30T11:00:00Z',
    },
    testerCount: 35,
    totalDownloads: 540,
  },
  // Marketing org
  {
    id: 'app-marketing-android',
    name: 'CampaignHub',
    platform: 'ANDROID',
    iconUrl: null,
    org: { name: 'Marketing', slug: 'marketing' },
    latestRelease: {
      version: '1.0.1',
      releaseType: 'BETA',
      createdAt: '2026-02-03T16:00:00Z',
    },
    testerCount: 8,
    totalDownloads: 52,
  },
  {
    id: 'app-marketing-ios',
    name: 'BrandKit',
    platform: 'IOS',
    iconUrl: null,
    org: { name: 'Marketing', slug: 'marketing' },
    latestRelease: {
      version: '0.9.0',
      releaseType: 'ALPHA',
      createdAt: '2026-02-05T08:00:00Z',
    },
    testerCount: 10,
    totalDownloads: 34,
  },
]

export const MOCK_RELEASES: MockRelease[] = [
  // FinanceTracker iOS
  {
    id: 'rel-ft-ios-1',
    appId: 'app-finance-ios',
    version: '2.1.0',
    buildNumber: '42',
    releaseType: 'BETA',
    releaseNotes:
      'Improved dashboard performance. Fixed a crash when opening the portfolio view on iOS 17. Added dark mode support for charts.',
    fileSize: 18_432_000,
    downloadCount: 312,
    createdAt: '2026-01-28T10:00:00Z',
    minOSVersion: 'iOS 15.0',
  },
  {
    id: 'rel-ft-ios-2',
    appId: 'app-finance-ios',
    version: '2.0.0',
    buildNumber: '38',
    releaseType: 'RELEASE_CANDIDATE',
    releaseNotes:
      'Major redesign of the main navigation. New budget planner feature. Performance improvements across all screens.',
    fileSize: 17_920_000,
    downloadCount: 0,
    createdAt: '2026-01-10T14:00:00Z',
    minOSVersion: 'iOS 15.0',
  },
  {
    id: 'rel-ft-ios-3',
    appId: 'app-finance-ios',
    version: '1.9.5',
    buildNumber: '35',
    releaseType: 'ALPHA',
    releaseNotes: 'Internal testing build. Experimental chart components.',
    fileSize: 16_384_000,
    downloadCount: 0,
    createdAt: '2025-12-20T09:00:00Z',
    minOSVersion: 'iOS 14.0',
  },
  // FinanceTracker Android
  {
    id: 'rel-ft-android-1',
    appId: 'app-finance-android',
    version: '2.0.3',
    buildNumber: '29',
    releaseType: 'RELEASE_CANDIDATE',
    releaseNotes:
      'Release candidate for v2.0. Fixed widget refresh bug. Optimized background sync.',
    fileSize: 22_528_000,
    downloadCount: 198,
    createdAt: '2026-01-25T14:00:00Z',
    minOSVersion: 'Android 10.0',
  },
  {
    id: 'rel-ft-android-2',
    appId: 'app-finance-android',
    version: '2.0.0',
    buildNumber: '25',
    releaseType: 'BETA',
    releaseNotes:
      'Android v2 beta. Ported all new features from iOS. Material You support added.',
    fileSize: 21_504_000,
    downloadCount: 0,
    createdAt: '2026-01-05T12:00:00Z',
    minOSVersion: 'Android 8.0',
  },
  // SalesPulse CRM
  {
    id: 'rel-crm-1',
    appId: 'app-sales-crm',
    version: '1.4.0',
    buildNumber: '17',
    releaseType: 'ALPHA',
    releaseNotes:
      'Early access to the new pipeline view. Lead scoring algorithm updated.',
    fileSize: 14_336_000,
    downloadCount: 87,
    createdAt: '2026-02-01T09:00:00Z',
    minOSVersion: 'iOS 14.0',
  },
  {
    id: 'rel-crm-2',
    appId: 'app-sales-crm',
    version: '1.3.2',
    buildNumber: '15',
    releaseType: 'BETA',
    releaseNotes:
      'Bug fixes for contact sync. Improved push notification delivery.',
    fileSize: 13_824_000,
    downloadCount: 0,
    createdAt: '2026-01-15T11:00:00Z',
    minOSVersion: 'iOS 14.0',
  },
  // Sales Reports
  {
    id: 'rel-sr-1',
    appId: 'app-sales-reports',
    version: '3.0.0',
    buildNumber: '55',
    releaseType: 'BETA',
    releaseNotes:
      'Complete rewrite with SwiftUI. PDF export now supports all chart types. Real-time data sync.',
    fileSize: 19_456_000,
    downloadCount: 540,
    createdAt: '2026-01-30T11:00:00Z',
    minOSVersion: 'iOS 15.0',
  },
  {
    id: 'rel-sr-2',
    appId: 'app-sales-reports',
    version: '2.8.1',
    buildNumber: '52',
    releaseType: 'RELEASE_CANDIDATE',
    releaseNotes: 'Final RC for 2.x series. Minor stability fixes.',
    fileSize: 18_944_000,
    downloadCount: 0,
    createdAt: '2026-01-18T15:00:00Z',
    minOSVersion: 'iOS 15.0',
  },
  {
    id: 'rel-sr-3',
    appId: 'app-sales-reports',
    version: '2.8.0',
    buildNumber: '50',
    releaseType: 'BETA',
    releaseNotes: 'New quarterly comparison charts. CSV export feature.',
    fileSize: 18_432_000,
    downloadCount: 0,
    createdAt: '2026-01-08T10:00:00Z',
    minOSVersion: 'iOS 14.0',
  },
  // CampaignHub
  {
    id: 'rel-ch-1',
    appId: 'app-marketing-android',
    version: '1.0.1',
    buildNumber: '8',
    releaseType: 'BETA',
    releaseNotes: 'Fixed campaign creation crash. Improved image upload speed.',
    fileSize: 12_288_000,
    downloadCount: 52,
    createdAt: '2026-02-03T16:00:00Z',
    minOSVersion: 'Android 10.0',
  },
  {
    id: 'rel-ch-2',
    appId: 'app-marketing-android',
    version: '1.0.0',
    buildNumber: '5',
    releaseType: 'ALPHA',
    releaseNotes: 'Initial alpha release. Core campaign management features.',
    fileSize: 11_776_000,
    downloadCount: 0,
    createdAt: '2026-01-22T13:00:00Z',
    minOSVersion: 'Android 8.0',
  },
  // BrandKit
  {
    id: 'rel-bk-1',
    appId: 'app-marketing-ios',
    version: '0.9.0',
    buildNumber: '12',
    releaseType: 'ALPHA',
    releaseNotes:
      'Pre-release build. Asset library browsing. Brand guideline viewer.',
    fileSize: 15_360_000,
    downloadCount: 34,
    createdAt: '2026-02-05T08:00:00Z',
    minOSVersion: 'iOS 14.0',
  },
  {
    id: 'rel-bk-2',
    appId: 'app-marketing-ios',
    version: '0.8.5',
    buildNumber: '10',
    releaseType: 'ALPHA',
    releaseNotes: 'Early prototype. Logo management and color palette features.',
    fileSize: 14_848_000,
    downloadCount: 0,
    createdAt: '2026-01-27T09:00:00Z',
    minOSVersion: 'iOS 14.0',
  },
]

export const MOCK_DISTRIBUTION_GROUPS: MockDistributionGroup[] = [
  { id: 'group-beta', name: 'Beta Testers', memberCount: 12 },
  { id: 'group-qa', name: 'QA Team', memberCount: 8 },
  { id: 'group-internal', name: 'Internal Team', memberCount: 5 },
]

export const MOCK_APP_DISTRIBUTION_GROUPS: MockAppDistGroup[] = [
  {
    id: 'app-group-ft-beta',
    appId: 'app-finance-ios',
    name: 'Beta Testers',
    description: 'External beta testing group',
    memberCount: 8,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'app-group-ft-qa',
    appId: 'app-finance-ios',
    name: 'QA Team',
    description: 'Internal QA testers',
    memberCount: 4,
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'app-group-crm-alpha',
    appId: 'app-sales-crm',
    name: 'Alpha Testers',
    description: null,
    memberCount: 3,
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'app-group-sr-beta',
    appId: 'app-sales-reports',
    name: 'Beta Group',
    description: 'Sales Reports beta program',
    memberCount: 12,
    createdAt: '2026-01-15T10:00:00Z',
  },
]

export const MOCK_APP_GROUP_DETAILS: Record<string, MockAppDistGroupDetail> = {
  'app-group-ft-beta': {
    id: 'app-group-ft-beta',
    appId: 'app-finance-ios',
    name: 'Beta Testers',
    description: 'External beta testing group',
    memberCount: 8,
    createdAt: '2026-01-10T10:00:00Z',
    members: [
      { userId: 'u1', email: 'alice@example.com', firstName: 'Alice', lastName: 'Johnson', avatarUrl: null, role: 'MANAGER' },
      { userId: 'u2', email: 'bob@example.com', firstName: 'Bob', lastName: 'Smith', avatarUrl: null, role: 'TESTER' },
      { userId: 'u3', email: 'carol@example.com', firstName: 'Carol', lastName: 'Williams', avatarUrl: null, role: 'TESTER' },
    ],
  },
  'app-group-ft-qa': {
    id: 'app-group-ft-qa',
    appId: 'app-finance-ios',
    name: 'QA Team',
    description: 'Internal QA testers',
    memberCount: 4,
    createdAt: '2026-01-12T10:00:00Z',
    members: [
      { userId: 'u4', email: 'dave@example.com', firstName: 'Dave', lastName: 'Brown', avatarUrl: null, role: 'MANAGER' },
      { userId: 'u5', email: 'eve@example.com', firstName: 'Eve', lastName: 'Davis', avatarUrl: null, role: 'TESTER' },
    ],
  },
  'app-group-crm-alpha': {
    id: 'app-group-crm-alpha',
    appId: 'app-sales-crm',
    name: 'Alpha Testers',
    description: null,
    memberCount: 3,
    createdAt: '2026-01-20T10:00:00Z',
    members: [
      { userId: 'u1', email: 'alice@example.com', firstName: 'Alice', lastName: 'Johnson', avatarUrl: null, role: 'MANAGER' },
    ],
  },
  'app-group-sr-beta': {
    id: 'app-group-sr-beta',
    appId: 'app-sales-reports',
    name: 'Beta Group',
    description: 'Sales Reports beta program',
    memberCount: 12,
    createdAt: '2026-01-15T10:00:00Z',
    members: [
      { userId: 'u2', email: 'bob@example.com', firstName: 'Bob', lastName: 'Smith', avatarUrl: null, role: 'MANAGER' },
      { userId: 'u3', email: 'carol@example.com', firstName: 'Carol', lastName: 'Williams', avatarUrl: null, role: 'TESTER' },
      { userId: 'u6', email: 'frank@example.com', firstName: 'Frank', lastName: 'Miller', avatarUrl: null, role: 'TESTER' },
    ],
  },
}

export const MOCK_ORGANIZATIONS: MockOrganization[] = [
  { name: 'Finance', slug: 'finance' },
  { name: 'Sales', slug: 'sales' },
  { name: 'Marketing', slug: 'marketing' },
]

export const MOCK_ORG_DISTRIBUTION_GROUPS: MockOrgDistGroup[] = [
  {
    id: 'org-group-finance-all',
    orgSlug: 'finance',
    name: 'All Finance Testers',
    description: 'All testers across finance apps',
    memberCount: 15,
    managerCount: 3,
    testerCount: 12,
    linkedAppsCount: 2,
    createdAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'org-group-finance-vip',
    orgSlug: 'finance',
    name: 'VIP Testers',
    description: 'Priority access testers',
    memberCount: 5,
    managerCount: 1,
    testerCount: 4,
    linkedAppsCount: 1,
    createdAt: '2026-01-08T10:00:00Z',
  },
  {
    id: 'org-group-sales-qa',
    orgSlug: 'sales',
    name: 'Sales QA',
    description: 'QA team for all sales apps',
    memberCount: 8,
    managerCount: 2,
    testerCount: 6,
    linkedAppsCount: 2,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'org-group-marketing-beta',
    orgSlug: 'marketing',
    name: 'Marketing Beta',
    description: null,
    memberCount: 6,
    managerCount: 1,
    testerCount: 5,
    linkedAppsCount: 2,
    createdAt: '2026-01-15T10:00:00Z',
  },
]

export const MOCK_ORG_GROUP_DETAILS: Record<string, MockOrgDistGroupDetail> = {
  'org-group-finance-all': {
    id: 'org-group-finance-all',
    orgSlug: 'finance',
    name: 'All Finance Testers',
    description: 'All testers across finance apps',
    memberCount: 15,
    managerCount: 3,
    testerCount: 12,
    linkedAppsCount: 2,
    createdAt: '2026-01-05T10:00:00Z',
    members: [
      { userId: 'u1', email: 'alice@example.com', firstName: 'Alice', lastName: 'Johnson', avatarUrl: null, role: 'MANAGER' },
      { userId: 'u2', email: 'bob@example.com', firstName: 'Bob', lastName: 'Smith', avatarUrl: null, role: 'TESTER' },
      { userId: 'u3', email: 'carol@example.com', firstName: 'Carol', lastName: 'Williams', avatarUrl: null, role: 'MANAGER' },
      { userId: 'u4', email: 'dave@example.com', firstName: 'Dave', lastName: 'Brown', avatarUrl: null, role: 'TESTER' },
    ],
    apps: [
      { appId: 'app-finance-ios', name: 'FinanceTracker', platform: 'IOS' },
      { appId: 'app-finance-android', name: 'FinanceTracker', platform: 'ANDROID' },
    ],
  },
  'org-group-finance-vip': {
    id: 'org-group-finance-vip',
    orgSlug: 'finance',
    name: 'VIP Testers',
    description: 'Priority access testers',
    memberCount: 5,
    managerCount: 1,
    testerCount: 4,
    linkedAppsCount: 1,
    createdAt: '2026-01-08T10:00:00Z',
    members: [
      { userId: 'u5', email: 'eve@example.com', firstName: 'Eve', lastName: 'Davis', avatarUrl: null, role: 'MANAGER' },
      { userId: 'u6', email: 'frank@example.com', firstName: 'Frank', lastName: 'Miller', avatarUrl: null, role: 'TESTER' },
    ],
    apps: [
      { appId: 'app-finance-ios', name: 'FinanceTracker', platform: 'IOS' },
    ],
  },
  'org-group-sales-qa': {
    id: 'org-group-sales-qa',
    orgSlug: 'sales',
    name: 'Sales QA',
    description: 'QA team for all sales apps',
    memberCount: 8,
    managerCount: 2,
    testerCount: 6,
    linkedAppsCount: 2,
    createdAt: '2026-01-10T10:00:00Z',
    members: [
      { userId: 'u1', email: 'alice@example.com', firstName: 'Alice', lastName: 'Johnson', avatarUrl: null, role: 'MANAGER' },
      { userId: 'u7', email: 'grace@example.com', firstName: 'Grace', lastName: 'Taylor', avatarUrl: null, role: 'TESTER' },
    ],
    apps: [
      { appId: 'app-sales-crm', name: 'SalesPulse CRM', platform: 'IOS' },
      { appId: 'app-sales-reports', name: 'Sales Reports', platform: 'IOS' },
    ],
  },
  'org-group-marketing-beta': {
    id: 'org-group-marketing-beta',
    orgSlug: 'marketing',
    name: 'Marketing Beta',
    description: null,
    memberCount: 6,
    managerCount: 1,
    testerCount: 5,
    linkedAppsCount: 2,
    createdAt: '2026-01-15T10:00:00Z',
    members: [
      { userId: 'u8', email: 'henry@example.com', firstName: 'Henry', lastName: 'Wilson', avatarUrl: null, role: 'MANAGER' },
      { userId: 'u9', email: 'iris@example.com', firstName: 'Iris', lastName: 'Moore', avatarUrl: null, role: 'TESTER' },
    ],
    apps: [
      { appId: 'app-marketing-android', name: 'CampaignHub', platform: 'ANDROID' },
      { appId: 'app-marketing-ios', name: 'BrandKit', platform: 'IOS' },
    ],
  },
}

export const MOCK_RELEASE_GROUPS: MockReleaseGroup[] = [
  {
    releaseId: 'rel-ft-ios-1',
    groups: [
      { id: 'app-group-ft-beta', type: 'app', name: 'Beta Testers', memberCount: 8 },
      { id: 'org-group-finance-all', type: 'org', name: 'All Finance Testers', memberCount: 15 },
    ],
  },
  {
    releaseId: 'rel-ft-ios-2',
    groups: [
      { id: 'app-group-ft-qa', type: 'app', name: 'QA Team', memberCount: 4 },
    ],
  },
  {
    releaseId: 'rel-crm-1',
    groups: [
      { id: 'app-group-crm-alpha', type: 'app', name: 'Alpha Testers', memberCount: 3 },
      { id: 'org-group-sales-qa', type: 'org', name: 'Sales QA', memberCount: 8 },
    ],
  },
  {
    releaseId: 'rel-sr-1',
    groups: [
      { id: 'app-group-sr-beta', type: 'app', name: 'Beta Group', memberCount: 12 },
    ],
  },
  {
    releaseId: 'rel-ch-1',
    groups: [
      { id: 'org-group-marketing-beta', type: 'org', name: 'Marketing Beta', memberCount: 6 },
    ],
  },
]
