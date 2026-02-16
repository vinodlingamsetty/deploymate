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
- [x] Dashboard layout component (`src/app/(dashboard)/layout.tsx`) wrapping all authenticated pages
- [x] Sidebar component (`src/components/layout/sidebar.tsx`)
  - [x] "All Apps" link at top (Home icon)
  - [x] Collapsible "Organizations" section with chevron
  - [x] Each org expandable with "Groups" submenu link
  - [x] Active state highlighting based on URL params
  - [x] No "Settings" or "All Organizations" in sidebar
- [x] Top header component (`src/components/layout/top-header.tsx`)
  - [x] Hamburger menu (mobile/tablet only, toggles sidebar)
  - [x] DeployMate logo (links to `/dashboard`)
  - [x] Search input (desktop only, real-time filtering)
  - [x] Theme toggle (light/dark)
  - [x] Notifications bell icon (mock)
  - [x] User avatar with dropdown (Settings, Sign Out)
- [x] Mobile sidebar as Sheet overlay with backdrop
- [x] Skip-to-content accessibility link

### Code Review Fixes (Phase 1 & 2)
- [x] A-C1: Dummy dev login gated behind `NODE_ENV === 'development'`
- [x] A-C2: `hashApiToken()` via HMAC-SHA256 added; broken Argon2 API token lookup fixed
- [x] A-C3: `cwd` field removed from debug-env route (filesystem path leak)
- [x] A-W1: Setup endpoint count+create wrapped in `$transaction` (TOCTOU race fix)
- [x] A-W2: All auth API routes normalized to `{ error: { code, message } }` format
- [x] A-W3: `session.user.email!` non-null assertion replaced with null check
- [x] A-W4: Password schema `.max(128)` added to both register and setup routes (HashDoS prevention)
- [x] A-W5: `api/debug-env` removed from middleware matcher exclusion
- [x] A-W6: `console.error` limited to error message string only, not full object
- [x] B-C1: Dev credentials hint in login page gated behind `NODE_ENV === 'development'`
- [x] B-C2: Config error details in auth-error page gated behind `NODE_ENV`; generic message in prod
- [x] B-W1: `id="login-error"` added to error div (fixes broken `aria-describedby`)
- [x] B-W2: `role="alert"` added to auth-error message container
- [x] B-W3: `console.error` in error.tsx gated behind `NODE_ENV === 'development'`
- [x] B-W4: `json` response typed as `{ error?: { message?: string } }` (no-any rule)
- [x] C-C1: `useSearchParams()` caller wrapped in `<Suspense>` boundary (Next.js 14 requirement)
- [x] C-C2: `getUserInitials` guarded against empty/whitespace strings (runtime crash fix)
- [x] C-C3: `Object.fromEntries(searchParams.entries())` memoized with `useMemo`
- [x] C-W1: Sun/Moon wrapped in `<span className="relative">` (Moon `absolute` positioning fix)
- [x] C-W2: Unnecessary `cn()` wrapper removed from single static string in top-header
- [x] C-W3: `className="text-destructive"` added to Sign Out menu item
- [x] C-W4: Redundant `role="main"` removed from `<main>` element
- [x] C-W5: Inline arrow functions extracted to `useCallback` in dashboard-shell

---

## Phase 3: Dashboard & Apps

### Dashboard Page (`/dashboard`)
- [x] Welcome message with user's first name
- [x] Filter controls row:
  - [x] Organization dropdown filter (`?org=`)
  - [x] Platform dropdown filter (All, iOS, Android)
  - [x] Release type dropdown filter (All, Alpha, Beta, RC)
- [x] View toggle (grid/list) persisted in URL (`?view=grid|list`)
- [x] "+ New App" button (desktop only, opens sheet)
- [x] Grid view - responsive grid (1/2/3 columns)
- [x] List view - table with sticky header
- [x] App card component (icon, name, platform badge, release type badge, org, version, testers, View Details)
- [x] App list row component (clickable row with all fields)
- [x] Search functionality (debounced, filters by name/org/platform/version)
- [x] Empty state ("No apps yet" with create button)
- [x] No results state ("No apps found matching your search")

### New App Sheet
- [x] Sheet sliding from right (max-w-md)
- [x] Form fields: App Name*, Platform* (iOS/Android), Organization*, Release Type*
- [x] App icon drag & drop upload
- [x] Create button disabled until all required fields valid
- [x] Cancel button (grey, red on hover)

### App Details Page (`/apps/[id]`)
- [x] Header: back button, app icon, name, platform badge, version
- [x] "Upload New Release" button (desktop only)
- [x] 3-dot menu with "Delete App" (desktop only)
- [x] Delete app confirmation dialog (type app name to confirm)
- [x] Stats section:
  - [x] Desktop: 3 cards (Latest Version, Total Members, Total Downloads)
  - [x] Mobile: compact list with dividers
- [x] Tabs:
  - [x] Releases tab (release cards with download + view details buttons)
  - [x] User Feedback tab (placeholder)
  - [x] Metadata tab (placeholder)
  - [x] Distribution Groups tab (desktop only, list groups + create new)

---

## Phase 4a: Release UI (Mock)

### Upload Release Sheet
- [x] Upload release sheet (multi-step, slides from right)
  - [x] Step 1: Release notes textarea + drag & drop file upload (.ipa/.apk)
  - [x] Step 2: Select distribution groups (checkboxes, at least one required)
  - [x] Publish / Back / Cancel buttons

### Release Details Page (`/releases/[id]`)
- [x] Header: back button, app name, version, release type badge, download button
- [x] Stats: 2x2 grid (Release Date, Downloads, Build Size, Min OS Version)
- [x] Release notes section
- [x] Distribution groups section
- [x] Mobile: download button visible on all screen sizes

---

## Phase 4b: API + Storage Foundation

- [x] Upload URL API endpoint (`POST /api/v1/apps/:appId/releases/upload-url`)
- [x] Create release API endpoint (`POST /api/v1/apps/:appId/releases`)
- [x] IPA parser - extract: bundleId, version, buildNumber, appName, minOSVersion, supportedDevices, provisioningProfile, icon
- [x] APK parser - extract: packageName, versionName, versionCode, appName, minSdkVersion, targetSdkVersion, permissions, icon

---

## Phase 4c: Download & Install

- [x] Download endpoint (`GET /api/v1/releases/:id/download`) with signed URLs
- [x] iOS OTA manifest generation endpoint (`GET /api/v1/releases/:id/manifest`)
- [x] iOS install button (itms-services:// protocol, Safari detection)
- [x] Android install button (direct APK download)
- [x] Public install page (`/install/[releaseId]`)
- [x] Download logging and count increment

---

## Phase 5: Distribution Groups

### App-Level Groups
- [x] List app groups (`GET /api/v1/apps/:appId/groups`)
- [x] Create app group sheet (group name + add members with email/role)
- [x] Get app group details (`GET /api/v1/groups/app/:groupId`)
- [x] Update app group (`PATCH /api/v1/groups/app/:groupId`)
- [x] Delete app group (`DELETE /api/v1/groups/app/:groupId`)
- [x] Add members to app group (`POST /api/v1/groups/app/:groupId/members`)
- [x] Remove member from app group (`DELETE /api/v1/groups/app/:groupId/members/:uid`)

### Org-Level Groups
- [x] Groups page (`/groups?org=[slug]`) - list all org groups
- [x] Create org group sheet (group name + description)
- [x] Manage group sheet with Members and Apps tabs
- [x] Add user sheet (email + role)
- [x] Add apps sheet (select apps to link)
- [x] Get org group details (`GET /api/v1/groups/org/:groupId`)
- [x] Update org group (`PATCH /api/v1/groups/org/:groupId`)
- [x] Delete org group (`DELETE /api/v1/groups/org/:groupId`)
- [x] Add members to org group (`POST /api/v1/groups/org/:groupId/members`)
- [x] Remove member from org group (`DELETE /api/v1/groups/org/:groupId/members/:uid`)
- [x] Add apps to org group (`POST /api/v1/groups/org/:groupId/apps`)
- [x] Remove app from org group (`DELETE /api/v1/groups/org/:groupId/apps/:appId`)

### Release-Group Linking
- [x] Link releases to distribution groups on publish
- [x] Resolve users from selected groups for notifications

---

## Phase 6: Organizations & Invitations

### Organizations
- [x] List user's organizations (`GET /api/v1/organizations`)
- [x] Create organization (`POST /api/v1/organizations`) - Super Admin only
- [x] Get organization details (`GET /api/v1/organizations/:slug`)
- [x] Update organization (`PATCH /api/v1/organizations/:slug`) - Admin
- [x] Delete organization (`DELETE /api/v1/organizations/:slug?confirm=true`) - Super Admin
- [x] List org members (`GET /api/v1/organizations/:slug/members`)
- [x] Update member role (`PATCH /api/v1/organizations/:slug/members/:id`)
- [x] Remove member (`DELETE /api/v1/organizations/:slug/members/:id`)

### Invitations
- [x] Send invitation (`POST /api/v1/organizations/:slug/invitations`) - Admin
- [x] List pending invitations (`GET /api/v1/organizations/:slug/invitations`)
- [x] Cancel invitation (`DELETE /api/v1/invitations/:id`)
- [x] Accept invitation (`POST /api/v1/invitations/:token/accept`) - Public
- [x] Invitation email sending (transactional email service)

---

## Phase 7: Settings Page (`/settings`)

### Profile Tab
- [x] Settings page with 4-tab layout
- [x] First name / Last name (editable)
- [x] Email (read-only with lock icon)
- [x] Change password button/flow
- [x] Save changes button
- [x] `GET /api/v1/users/me` endpoint
- [x] `PATCH /api/v1/users/me` endpoint
- [x] `POST /api/v1/users/me/change-password` endpoint

### Notifications Tab
- [x] Email notification toggles (New Release, Download Alerts, Feedback, Weekly Digest)
- [x] Save preferences button

### Organizations Tab
- [x] List user's organizations with role
- [x] Leave button (with confirmation dialog - type org name)
- [x] Manage button (Admin only - opens manage org sheet)
- [x] "+ Create Organization" button (Super Admin only)
- [x] Create organization sheet (name + optional admin emails)
- [x] Manage organization sheet (edit name, list/add/remove admins)
- [x] Remove admin confirmation dialog

### API Tokens Tab
- [x] Generate new token form (token name + access level: Read Only / Read & Write)
- [x] Show generated token once (copy to clipboard)
- [x] List existing tokens (name, access level, created date)
- [x] Revoke token button (with confirmation)
- [x] `GET /api/v1/tokens` endpoint
- [x] `POST /api/v1/tokens` endpoint
- [x] `DELETE /api/v1/tokens/:id` endpoint

---

## Phase 8: API Endpoints (`/api/v1/`)

### Apps API
- [x] `GET /api/v1/apps` - List accessible apps (with pagination, filtering, sorting)
- [x] `POST /api/v1/apps` - Create app (Admin)
- [x] `GET /api/v1/apps/:id` - Get app details
- [x] `PATCH /api/v1/apps/:id` - Update app (Admin)
- [x] `DELETE /api/v1/apps/:id?confirm=AppName` - Delete app (Admin)

### Releases API
- [x] `GET /api/v1/apps/:appId/releases` - List releases
- [x] `POST /api/v1/apps/:appId/releases/upload-url` - Get signed upload URL (Manager+)
- [x] `POST /api/v1/apps/:appId/releases` - Create release after upload (Manager+)
- [x] `GET /api/v1/apps/:appId/releases/latest` - Get latest release
- [x] `GET /api/v1/releases/:id` - Get release details
- [x] `DELETE /api/v1/releases/:id` - Delete release (Manager+)
- [x] `GET /api/v1/releases/:id/download` - Get signed download URL

### Shared API Infrastructure
- [x] API response format helpers (`{ data, meta }` / `{ error: { code, message } }`)
- [x] Pagination helper (`?page=1&limit=20` with meta response)
- [x] API token authentication (Bearer `dm_xxxxxxxxxx`)
- [x] Permission checking middleware/utility (`src/lib/permissions.ts`)
- [x] Zod validation schemas (`src/lib/validations.ts`)
- [ ] Rate limiting (optional)

---

## Phase 9: Storage Adapters

### Storage Interface & Factory
- [x] StorageAdapter interface (`upload`, `getSignedDownloadUrl`, `getSignedUploadUrl`, `delete`, `exists`, `getBuffer`, `getMetadata`, `copy`, `list`)
- [x] Storage adapter factory (based on `STORAGE_PROVIDER` env var)
- [x] Singleton `getStorageAdapter()` export

### Adapter Implementations
- [x] Local storage adapter (Node.js fs, for dev/small deployments)
- [x] AWS S3 adapter (`@aws-sdk/client-s3`)
- [x] Google Cloud Storage adapter (`@google-cloud/storage`)
- [x] Azure Blob Storage adapter (`@azure/storage-blob`)

---

## Phase 10: Infrastructure & Deployment

### Docker
- [x] `Dockerfile` (production, multi-stage)
- [x] `Dockerfile.dev` (development)
- [x] `docker-compose.yml` (app + postgres + redis + caddy)
- [x] `docker-compose.dev.yml`
- [x] `Caddyfile` (reverse proxy with auto-HTTPS)

### CI/CD
- [x] GitHub Actions: lint + type-check + build on PR (`ci.yml`)
- [x] GitHub Actions: build Docker image on release (`build.yml`)
- [x] GitHub Actions: build documentation site placeholder (`docs.yml`)

### Background Jobs
- [x] BullMQ + Redis setup for background processing
- [x] Binary parsing job (extract metadata from uploaded IPA/APK)
- [x] Notification job (email testers when new release published)

### Monitoring & Logging
- [x] Audit log system (track user actions: create, update, delete)
- [x] Structured logging (pino)

---

## Phase 11: Polish & Documentation

### Accessibility (WCAG 2.1 AA)
- [x] Color contrast (4.5:1 minimum)
- [x] Keyboard navigation (all elements focusable)
- [x] Visible focus indicators (#0077b6 ring)
- [x] ARIA labels on all interactive elements
- [x] Form labels with `aria-describedby` for errors
- [x] Skip-to-content link
- [x] Proper heading hierarchy (h1 > h2 > h3)
- [x] Loading states with `aria-busy`, `aria-live`

### Mobile Responsiveness
- [x] No horizontal scrolling on any page
- [x] Hide "Upload New Release" button on mobile
- [x] Hide 3-dot menu on mobile
- [x] Hide Distribution Groups tab on mobile
- [x] Compact stats (list with dividers, not cards) on mobile
- [x] Minimum 44px touch targets
- [x] Stack buttons vertically on mobile

### Documentation
- [x] README.md (project overview, quick start)
- [x] CONTRIBUTING.md (how to contribute)
- [x] CHANGELOG.md
- [x] LICENSE (Apache 2.0)
- [x] Documentation site (Docusaurus) with getting-started, configuration, API reference, deployment guides

### Landing Page
- [x] Minimal landing page: hero, feature bullets, screenshot, "Get Started" link, "Documentation" link

### GitHub
- [x] Issue templates (bug_report.md, feature_request.md)
- [x] Pull request template
- [x] `.github/workflows/` CI/CD files

---

## Quick Stats

| Category | Done | Total | % |
|----------|------|-------|---|
| Phase 1: Foundation | 20 | 23 | 87% |
| Phase 2: Layout & Navigation | 12 | 12 | 100% |
| Phase 3: Dashboard & Apps | 22 | 22 | 100% |
| Phase 4a: Release UI | 9 | 9 | 100% |
| Phase 4b: API + Storage | 4 | 4 | 100% |
| Phase 4c: Download & Install | 6 | 6 | 100% |
| Phase 5: Distribution Groups | 21 | 21 | 100% |
| Phase 6: Organizations & Invitations | 13 | 13 | 100% |
| Phase 7: Settings | 17 | 17 | 100% |
| Phase 8: API Endpoints | 16 | 17 | 94% |
| Phase 9: Storage Adapters | 7 | 7 | 100% |
| Phase 10: Infrastructure | 13 | 13 | 100% |
| Phase 11: Polish & Docs | 19 | 19 | 100% |
| **TOTAL** | **179** | **182** | **98%** |

---

_Last updated: 2026-02-15_
