# DeployMate - Implementation Progress

> **Single source of truth** for all implementation progress.
> Both Claude Code and Cursor read and update this file.
>
> **When a feature is done:** change `- [ ]` to `- [x]` and update the Quick Stats table.
> **When a feature is added/removed/changed:** update this file first. Spec docs stay as-is.
> **Quick start:** tell your AI tool _"Check docs/PROGRESS.md and work on the next unchecked item"_

---

## Phase 1: Foundation

### Project Setup
- [x] Initialize Next.js 14 project with TypeScript strict mode
- [x] Configure Tailwind CSS with design tokens (colors, fonts, spacing)
- [x] Install and configure shadcn/ui components (button, card, input, label, dialog, sheet, dropdown-menu, tabs, table, badge, checkbox, textarea, select, avatar, separator, sonner)
- [x] Setup fonts: Space Grotesk (sans) + Courier Prime (mono)
- [x] Dark/light theme support with next-themes
- [x] Root layout with SessionProvider, ThemeProvider, Toaster
- [x] Global CSS with HSL design tokens (light + dark mode)
- [x] `cn()` utility function (clsx + tailwind-merge)

### Database
- [x] Setup Prisma with PostgreSQL
- [x] Create complete database schema (User, Organization, Membership, App, Release, Invitation, ApiToken, AppDistGroup, OrgDistGroup, AppGroupMember, OrgGroupMember, OrgGroupApp, ReleaseGroup, DownloadLog, Feedback)
- [ ] Run initial database migration (`prisma migrate dev`)
- [ ] Seed script with demo data (organizations, apps, releases, groups)

### Authentication
- [x] NextAuth.js v5 with credentials provider and JWT strategy
- [x] Login page (`/login`) with email/password form
- [x] Registration page (`/register`) with validation
- [x] Registration API endpoint (`/api/auth/register`)
- [x] Password hashing with Argon2 (`src/lib/auth-utils.ts`)
- [x] Auth error page (`/auth-error`) with clear error messages
- [x] Dev fallback secret for missing AUTH_SECRET
- [x] Error, loading, and not-found pages
- [x] First-user setup page (`/setup`) - redirect when DB has no users, auto-set isSuperAdmin
- [x] Auth middleware (`src/middleware.ts`) - protect dashboard routes, redirect unauthenticated users
- [ ] Invitation acceptance flow on `/register?token=xxx` (pre-fill email, add to org)

---

## Phase 2: Layout & Navigation

### Dashboard Layout
- [ ] Dashboard layout component (`src/app/(dashboard)/layout.tsx`) wrapping all authenticated pages
- [ ] Sidebar component (`src/components/layout/sidebar.tsx`)
  - [ ] "All Apps" link at top (Home icon)
  - [ ] Collapsible "Organizations" section with chevron
  - [ ] Each org expandable with "Groups" submenu link
  - [ ] Active state highlighting based on URL params
  - [ ] No "Settings" or "All Organizations" in sidebar
- [ ] Top header component (`src/components/layout/top-header.tsx`)
  - [ ] Hamburger menu (mobile/tablet only, toggles sidebar)
  - [ ] DeployMate logo (links to `/dashboard`)
  - [ ] Search input (desktop only, real-time filtering)
  - [ ] Theme toggle (light/dark)
  - [ ] Notifications bell icon (mock)
  - [ ] User avatar with dropdown (Settings, Sign Out)
- [ ] Mobile sidebar as Sheet overlay with backdrop
- [ ] Skip-to-content accessibility link

---

## Phase 3: Dashboard & Apps

### Dashboard Page (`/dashboard`)
- [ ] Welcome message with user's first name
- [ ] Filter controls row:
  - [ ] Organization dropdown filter (`?org=`)
  - [ ] Platform dropdown filter (All, iOS, Android)
  - [ ] Release type dropdown filter (All, Alpha, Beta, RC)
- [ ] View toggle (grid/list) persisted in URL (`?view=grid|list`)
- [ ] "+ New App" button (desktop only, opens sheet)
- [ ] Grid view - responsive grid (1/2/3 columns)
- [ ] List view - table with sticky header
- [ ] App card component (icon, name, platform badge, release type badge, org, version, testers, View Details)
- [ ] App list row component (clickable row with all fields)
- [ ] Search functionality (debounced, filters by name/org/platform/version)
- [ ] Empty state ("No apps yet" with create button)
- [ ] No results state ("No apps found matching your search")

### New App Sheet
- [ ] Sheet sliding from right (max-w-md)
- [ ] Form fields: App Name*, Platform* (iOS/Android), Organization*, Release Type*
- [ ] App icon drag & drop upload
- [ ] Create button disabled until all required fields valid
- [ ] Cancel button (grey, red on hover)

### App Details Page (`/apps/[id]`)
- [ ] Header: back button, app icon, name, platform badge, version
- [ ] "Upload New Release" button (desktop only)
- [ ] 3-dot menu with "Delete App" (desktop only)
- [ ] Delete app confirmation dialog (type app name to confirm)
- [ ] Stats section:
  - [ ] Desktop: 3 cards (Latest Version, Total Members, Total Downloads)
  - [ ] Mobile: compact list with dividers
- [ ] Tabs:
  - [ ] Releases tab (release cards with download + view details buttons)
  - [ ] User Feedback tab (placeholder)
  - [ ] Metadata tab (placeholder)
  - [ ] Distribution Groups tab (desktop only, list groups + create new)

---

## Phase 4: Releases

### Upload Release Flow
- [ ] Upload release sheet (multi-step, slides from right)
  - [ ] Step 1: Release notes textarea + drag & drop file upload (.ipa/.apk)
  - [ ] Step 2: Select distribution groups (checkboxes, at least one required)
  - [ ] Publish / Back / Cancel buttons
- [ ] Upload URL API endpoint (`POST /api/v1/apps/:appId/releases/upload-url`)
- [ ] Create release API endpoint (`POST /api/v1/apps/:appId/releases`)

### Release Details Page (`/releases/[id]`)
- [ ] Header: back button, app name, version, release type badge, download button
- [ ] Stats: 2x2 grid (Release Date, Downloads, Build Size, Min OS Version)
- [ ] Release notes section
- [ ] Distribution groups section
- [ ] Mobile: download button visible on all screen sizes

### Binary Parsers
- [ ] IPA parser - extract: bundleId, version, buildNumber, appName, minOSVersion, supportedDevices, provisioningProfile, icon
- [ ] APK parser - extract: packageName, versionName, versionCode, appName, minSdkVersion, targetSdkVersion, permissions, icon

### Download & Install
- [ ] Download endpoint (`GET /api/v1/releases/:id/download`) with signed URLs
- [ ] iOS OTA manifest generation endpoint (`GET /api/v1/releases/:id/manifest`)
- [ ] iOS install button (itms-services:// protocol, Safari detection)
- [ ] Android install button (direct APK download)
- [ ] Public install page (`/install/[releaseId]`)
- [ ] Download logging and count increment

---

## Phase 5: Distribution Groups

### App-Level Groups
- [ ] List app groups (`GET /api/v1/apps/:appId/groups`)
- [ ] Create app group sheet (group name + add members with email/role)
- [ ] Get app group details (`GET /api/v1/groups/app/:groupId`)
- [ ] Update app group (`PATCH /api/v1/groups/app/:groupId`)
- [ ] Delete app group (`DELETE /api/v1/groups/app/:groupId`)
- [ ] Add members to app group (`POST /api/v1/groups/app/:groupId/members`)
- [ ] Remove member from app group (`DELETE /api/v1/groups/app/:groupId/members/:uid`)

### Org-Level Groups
- [ ] Groups page (`/groups?org=[slug]`) - list all org groups
- [ ] Create org group sheet (group name + description)
- [ ] Manage group sheet with Members and Apps tabs
- [ ] Add user sheet (email + role)
- [ ] Add apps sheet (select apps to link)
- [ ] Get org group details (`GET /api/v1/groups/org/:groupId`)
- [ ] Update org group (`PATCH /api/v1/groups/org/:groupId`)
- [ ] Delete org group (`DELETE /api/v1/groups/org/:groupId`)
- [ ] Add members to org group (`POST /api/v1/groups/org/:groupId/members`)
- [ ] Remove member from org group
- [ ] Add apps to org group (`POST /api/v1/groups/org/:groupId/apps`)
- [ ] Remove app from org group

### Release-Group Linking
- [ ] Link releases to distribution groups on publish
- [ ] Resolve users from selected groups for notifications

---

## Phase 6: Organizations & Invitations

### Organizations
- [ ] List user's organizations (`GET /api/v1/organizations`)
- [ ] Create organization (`POST /api/v1/organizations`) - Super Admin only
- [ ] Get organization details (`GET /api/v1/organizations/:slug`)
- [ ] Update organization (`PATCH /api/v1/organizations/:slug`) - Admin
- [ ] Delete organization (`DELETE /api/v1/organizations/:slug?confirm=true`) - Super Admin
- [ ] List org members (`GET /api/v1/organizations/:slug/members`)
- [ ] Update member role (`PATCH /api/v1/organizations/:slug/members/:id`)
- [ ] Remove member (`DELETE /api/v1/organizations/:slug/members/:id`)

### Invitations
- [ ] Send invitation (`POST /api/v1/organizations/:slug/invitations`) - Admin
- [ ] List pending invitations (`GET /api/v1/organizations/:slug/invitations`)
- [ ] Cancel invitation (`DELETE /api/v1/invitations/:id`)
- [ ] Accept invitation (`POST /api/v1/invitations/:token/accept`) - Public
- [ ] Invitation email sending (transactional email service)

---

## Phase 7: Settings Page (`/settings`)

### Profile Tab
- [ ] Settings page with 4-tab layout
- [ ] First name / Last name (editable)
- [ ] Email (read-only with lock icon)
- [ ] Change password button/flow
- [ ] Save changes button
- [ ] `GET /api/v1/users/me` endpoint
- [ ] `PATCH /api/v1/users/me` endpoint
- [ ] `POST /api/v1/users/me/change-password` endpoint

### Notifications Tab
- [ ] Email notification toggles (New Release, Download Alerts, Feedback, Weekly Digest)
- [ ] Save preferences button

### Organizations Tab
- [ ] List user's organizations with role
- [ ] Leave button (with confirmation dialog - type org name)
- [ ] Manage button (Admin only - opens manage org sheet)
- [ ] "+ Create Organization" button (Super Admin only)
- [ ] Create organization sheet (name + optional admin emails)
- [ ] Manage organization sheet (edit name, list/add/remove admins)
- [ ] Remove admin confirmation dialog

### API Tokens Tab
- [ ] Generate new token form (token name + access level: Read Only / Read & Write)
- [ ] Show generated token once (copy to clipboard)
- [ ] List existing tokens (name, access level, created date)
- [ ] Revoke token button (with confirmation)
- [ ] `GET /api/v1/tokens` endpoint
- [ ] `POST /api/v1/tokens` endpoint
- [ ] `DELETE /api/v1/tokens/:id` endpoint

---

## Phase 8: API Endpoints (`/api/v1/`)

### Apps API
- [ ] `GET /api/v1/apps` - List accessible apps (with pagination, filtering, sorting)
- [ ] `POST /api/v1/apps` - Create app (Admin)
- [ ] `GET /api/v1/apps/:id` - Get app details
- [ ] `PATCH /api/v1/apps/:id` - Update app (Admin)
- [ ] `DELETE /api/v1/apps/:id?confirm=AppName` - Delete app (Admin)

### Releases API
- [ ] `GET /api/v1/apps/:appId/releases` - List releases
- [ ] `POST /api/v1/apps/:appId/releases/upload-url` - Get signed upload URL (Manager+)
- [ ] `POST /api/v1/apps/:appId/releases` - Create release after upload (Manager+)
- [ ] `GET /api/v1/apps/:appId/releases/latest` - Get latest release
- [ ] `GET /api/v1/releases/:id` - Get release details
- [ ] `DELETE /api/v1/releases/:id` - Delete release (Manager+)
- [ ] `GET /api/v1/releases/:id/download` - Get signed download URL

### Shared API Infrastructure
- [ ] API response format helpers (`{ data, meta }` / `{ error: { code, message } }`)
- [ ] Pagination helper (`?page=1&limit=20` with meta response)
- [ ] API token authentication (Bearer `dm_xxxxxxxxxx`)
- [ ] Permission checking middleware/utility (`src/lib/permissions.ts`)
- [ ] Zod validation schemas (`src/lib/validations.ts`)
- [ ] Rate limiting (optional)

---

## Phase 9: Storage Adapters

### Storage Interface & Factory
- [ ] StorageAdapter interface (`upload`, `getSignedDownloadUrl`, `getSignedUploadUrl`, `delete`, `exists`, `getMetadata`, `copy`, `list`)
- [ ] Storage adapter factory (`createStorageAdapter` based on `STORAGE_PROVIDER` env var)
- [ ] Singleton `getStorageAdapter()` export

### Adapter Implementations
- [ ] Local storage adapter (Node.js fs, for dev/small deployments)
- [ ] AWS S3 adapter (`@aws-sdk/client-s3`)
- [ ] Google Cloud Storage adapter (`@google-cloud/storage`)
- [ ] Azure Blob Storage adapter (`@azure/storage-blob`)
- [ ] Salesforce Files adapter (`jsforce`)

---

## Phase 10: Infrastructure & Deployment

### Docker
- [ ] `Dockerfile` (production)
- [ ] `Dockerfile.dev` (development)
- [ ] `docker-compose.yml` (app + postgres + redis)
- [ ] `docker-compose.dev.yml`
- [ ] `nginx.conf` (reverse proxy)

### CI/CD
- [ ] GitHub Actions: lint + type-check + test on PR (`ci.yml`)
- [ ] GitHub Actions: build Docker image on release (`build.yml`)
- [ ] GitHub Actions: build documentation site (`docs.yml`)

### Background Jobs
- [ ] BullMQ + Redis setup for background processing
- [ ] Binary parsing job (extract metadata from uploaded IPA/APK)
- [ ] Notification job (email testers when new release published)

### Monitoring & Logging
- [ ] Audit log system (track user actions: create, update, delete)
- [ ] Structured logging

---

## Phase 11: Polish & Documentation

### Accessibility (WCAG 2.1 AA)
- [ ] Color contrast (4.5:1 minimum)
- [ ] Keyboard navigation (all elements focusable)
- [ ] Visible focus indicators (#0077b6 ring)
- [ ] ARIA labels on all interactive elements
- [ ] Form labels with `aria-describedby` for errors
- [ ] Skip-to-content link
- [ ] Proper heading hierarchy (h1 > h2 > h3)
- [ ] Loading states with `aria-busy`, `aria-live`

### Mobile Responsiveness
- [ ] No horizontal scrolling on any page
- [ ] Hide "Upload New Release" button on mobile
- [ ] Hide 3-dot menu on mobile
- [ ] Hide Distribution Groups tab on mobile
- [ ] Compact stats (list with dividers, not cards) on mobile
- [ ] Minimum 44px touch targets
- [ ] Stack buttons vertically on mobile

### Documentation
- [ ] README.md (project overview, quick start)
- [ ] CONTRIBUTING.md (how to contribute)
- [ ] CHANGELOG.md
- [ ] LICENSE (Apache 2.0)
- [ ] Documentation site (Docusaurus) with getting-started, configuration, API reference, deployment guides

### Landing Page
- [ ] Minimal landing page: hero, feature bullets, screenshot, "Get Started" link, "Documentation" link

### GitHub
- [ ] Issue templates (bug_report.md, feature_request.md)
- [ ] Pull request template
- [ ] `.github/workflows/` CI/CD files

---

## Quick Stats

| Category | Done | Total | % |
|----------|------|-------|---|
| Phase 1: Foundation | 20 | 23 | 87% |
| Phase 2: Layout & Navigation | 0 | 12 | 0% |
| Phase 3: Dashboard & Apps | 0 | 22 | 0% |
| Phase 4: Releases | 0 | 16 | 0% |
| Phase 5: Distribution Groups | 0 | 17 | 0% |
| Phase 6: Organizations & Invitations | 0 | 13 | 0% |
| Phase 7: Settings | 0 | 17 | 0% |
| Phase 8: API Endpoints | 0 | 17 | 0% |
| Phase 9: Storage Adapters | 0 | 7 | 0% |
| Phase 10: Infrastructure | 0 | 13 | 0% |
| Phase 11: Polish & Docs | 0 | 19 | 0% |
| **TOTAL** | **20** | **176** | **11%** |

---

_Last updated: 2026-02-09_
