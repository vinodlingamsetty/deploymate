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
- [x] Add `AppMembership` model for per-app role overrides (with back-relations on App and User)
- [ ] Run initial database migration (`prisma migrate dev`)
- [x] Seed script with demo data (organizations, apps, releases, groups)

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
- [x] Invitation acceptance flow on `/register?token=xxx` (pre-fill email, add to org)
- [x] Super-admin bootstrap: first registrant auto-gets `isSuperAdmin=true` (race-safe via `$transaction`)
- [x] `DISABLE_REGISTRATION=true` env var to lock down sign-ups after setup

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
- [x] Dashboard page queries live DB (apps + orgs from Prisma, no mock data)

### New App Sheet
- [x] Sheet sliding from right (max-w-md)
- [x] Form fields: App Name*, Platform* (iOS/Android), Organization*, Release Type*
- [x] App icon drag & drop upload
- [ ] Remove app icon upload (icons will be extracted from binary instead)
- [x] Create button disabled until all required fields valid
- [x] Cancel button (grey, red on hover)
- [x] Real API call (`POST /api/v1/apps`) with success/error toasts and `router.refresh()`

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
  - [x] Members tab (desktop only, Admin only — manage per-app role overrides)

---

## Phase 4a: Release UI (Mock)

### Upload Release Sheet
- [x] Upload release sheet (multi-step, slides from right)
  - [x] Step 1: Release notes textarea + drag & drop file upload (.ipa/.apk)
  - [x] Step 2: Select distribution groups (checkboxes, at least one required)
  - [x] Fetch real app + org distribution groups via API (replaced mock data)
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
- [x] Get app group details (`GET /api/v1/groups/app/:groupId`) — includes `pendingInvitations`
- [x] Update app group (`PATCH /api/v1/groups/app/:groupId`)
- [x] Delete app group (`DELETE /api/v1/groups/app/:groupId`)
- [x] Add members to app group (`POST /api/v1/groups/app/:groupId/members`) — splits known users vs email invites
- [x] Remove member from app group (`DELETE /api/v1/groups/app/:groupId/members/:uid`)
- [x] Wire up manage app group sheet (real add/remove member API calls)
- [x] Pending invitations section in manage app group sheet (Resend + Revoke)

### Org-Level Groups
- [x] Groups page (`/groups?org=[slug]`) - list all org groups
- [x] List org groups API (`GET /api/v1/organizations/:slug/groups`)
- [x] Create org group sheet (group name + description)
- [x] Manage group sheet with Members and Apps tabs
- [x] Add user sheet (email + role)
- [x] Add apps sheet (select apps to link)
- [x] Get org group details (`GET /api/v1/groups/org/:groupId`)
- [x] Update org group (`PATCH /api/v1/groups/org/:groupId`)
- [x] Delete org group (`DELETE /api/v1/groups/org/:groupId`)
- [x] Add members to org group (`POST /api/v1/groups/org/:groupId/members`) — splits known users vs email invites
- [x] Remove member from org group (`DELETE /api/v1/groups/org/:groupId/members/:uid`)
- [x] Add apps to org group (`POST /api/v1/groups/org/:groupId/apps`)
- [x] Remove app from org group (`DELETE /api/v1/groups/org/:groupId/apps/:appId`)

### Group Invitations
- [x] `GroupInvitation` Prisma model + migration
- [x] `GET /api/v1/group-invitations/:token` — public lookup by token
- [x] `POST /api/v1/group-invitations/:token/accept` — accept invite (auth required, email match)
- [x] `POST /api/v1/group-invitations/:id/resend` — regenerate token and resend email (Manager+)
- [x] `DELETE /api/v1/group-invitations/:id/revoke` — revoke pending invite (Manager+)
- [x] `/invitations/group/[token]/accept` page — shows group/app details, sign-in/sign-up buttons, accept button
- [x] `sendGroupInvitationEmail()` email helper

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
- [x] "Your Access" section: Super Admin badge + org membership list with color-coded role chips
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

### App Members API (per-app role overrides)
- [x] `GET /api/v1/apps/:id/members` - List app-level role overrides (Admin only)
- [x] `POST /api/v1/apps/:id/members` - Add per-app role override `{ userId, role }` (Admin only)
- [x] `PATCH /api/v1/apps/:id/members/:userId` - Change per-app role (Admin only)
- [x] `DELETE /api/v1/apps/:id/members/:userId` - Remove per-app override, revert to org role (Admin only)

### Releases API
- [x] `GET /api/v1/apps/:appId/releases` - List releases (org member access check added)
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
  - [x] `requireAppAccess` — any org member can read
  - [x] `requireAppRole` — checks AppMembership override first, falls back to org role
- [x] Zod validation schemas (`src/lib/validations.ts`)
- [x] Role enforcement on group mutation endpoints (PATCH/DELETE require MANAGER+)
- [x] Role enforcement on `POST /api/v1/apps/:id/groups` (MANAGER+)
- [x] Rate limiting (register: 10/15min, login: 10/15min, change-password: 5/15min, invitation-accept: 20/15min)

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

## Phase 12: iOS Provisioning Profile Detection

### Provisioning Profile Parsing
- [x] Add `ProvisioningType`, `ProvisioningInfo` types to binary parser
- [x] Parse `embedded.mobileprovision` from IPA files (CMS envelope → XML plist)
- [x] Detect signing type: Development, Ad Hoc, Enterprise, App Store
- [x] Extract profile name, team name, expiration date
- [x] Pass provisioning fields through `parseBinary()` index

### Database & Persistence
- [x] Add `signingType`, `provisioningName`, `teamName`, `provisioningExpiry` to Release model
- [x] Persist provisioning data in inline release creation
- [x] Persist provisioning data in background binary parsing processor

### UI Display
- [x] Signing type badge on release cards (color-coded: Development, Ad Hoc, Enterprise, App Store)
- [x] Signing & Team stat cards on release details page (with expiry + profile name)
- [x] `SIGNING_TYPE_LABELS` constant with label/color mappings
- [x] Mock data updated with representative signing data (iOS releases) and nulls (Android)

---

## Phase 13: Email OTP, CI/CD Pipeline, Tech Stack Docs

### Email OTP Sign-In
- [x] `VerificationToken` Prisma model with HMAC-SHA256 hashed tokens
- [x] `hashOtp()` utility in `auth-utils.ts`
- [x] Nodemailer SMTP transport layer (`src/lib/email-transport.ts`)
- [x] Real email implementation replacing stubs (`sendInvitationEmail`, `sendOtpEmail`, `sendNewReleaseEmail`)
- [x] OTP send API route (`POST /api/auth/otp/send`) with rate limiting and enumeration protection
- [x] `email-otp` CredentialsProvider in NextAuth config
- [x] Login page UI with 4 modes: landing, password, otp-email, otp-code
- [x] Graceful degradation when SMTP not configured (console logging)

### CI/CD Pipeline
- [x] Vitest test framework setup (`vitest.config.ts`)
- [x] Unit tests: `api-utils.test.ts` (response helpers)
- [x] Unit tests: `otp.test.ts` (hash determinism, format validation)
- [x] Unit tests: `validations.test.ts` (pagination, createApp schemas)
- [x] CI workflow: test job (`pnpm test`)
- [x] CI workflow: security audit job (`pnpm audit`)
- [x] Docker build workflow: PR trigger with build-only + Trivy scan
- [x] Dependabot config for npm + GitHub Actions updates

### Notification Worker
- [x] Notification processor wired to real email sending (`sendNewReleaseEmail`)

### Documentation
- [x] Tech stack document (`docs/TECH_STACK.md`)
- [x] `.env.example` updated with SMTP configuration

---

## Phase 14: Testing, Rate Limiting & Seed Data

### Rate Limiting
- [x] In-memory sliding-window rate limiter (`src/lib/rate-limit.ts`)
- [x] Rate limit: `POST /api/auth/register` — 10 req / 15 min
- [x] Rate limit: `POST /api/auth/[...nextauth]` (credentials callback) — 10 req / 15 min
- [x] Rate limit: `POST /api/v1/users/me/change-password` — 5 req / 15 min
- [x] Rate limit: `POST /api/v1/invitations/[id]/accept` — 20 req / 15 min

### Seed Script
- [x] Idempotent seed script (`prisma/seed.ts`) with 5 users, 2 orgs, 5 apps, 10 releases
- [x] `db:seed` npm script (`tsx prisma/seed.ts`)

### Unit Tests
- [x] `src/__tests__/auth-utils.test.ts` — hashApiToken, isPrismaError
- [x] `src/__tests__/permissions.test.ts` — requireAppAccess, requireAppRole

### Integration Test Infrastructure
- [x] `.env.test` — test DB URL + secrets (commit-safe placeholders)
- [x] `vitest.config.integration.ts` — Vitest config for integration tests
- [x] `src/__tests__/setup.ts` — DB lifecycle, table truncation, helper factories

### Integration Tests
- [x] `src/__tests__/integration/auth.integration.test.ts` — register endpoint (7 cases)
- [x] `src/__tests__/integration/apps.integration.test.ts` — apps CRUD (8 cases)
- [x] `src/__tests__/integration/organizations.integration.test.ts` — orgs CRUD (6 cases)
- [x] `src/__tests__/integration/tokens.integration.test.ts` — tokens CRUD (6 cases)

### CI/CD
- [x] `package.json` — `test:integration`, `test:integration:watch`, `db:seed` scripts
- [x] `.github/workflows/ci.yml` — `integration-test` job with Postgres service container

---

## Phase 15: Upgrade & Security

### Next.js 15 Migration ⚠️ CRITICAL SECURITY
- [ ] Upgrade Next.js from 14.x to >=15.0.8 (fixes CVE GHSA-h25m-26qc-wcjf: HTTP request deserialization DoS via insecure RSC)
- [ ] Make `params` and `searchParams` async in all page/layout components (Next.js 15 breaking change)
- [ ] Verify build and all routes after upgrade
- [ ] Update `next` peer deps (eslint-config-next, @types/react, etc.) to match Next.js 15

---

## Quick Stats

| Category | Done | Total | % |
|----------|------|-------|---|
| Phase 1: Foundation | 24 | 25 | 96% |
| Phase 2: Layout & Navigation | 12 | 12 | 100% |
| Phase 3: Dashboard & Apps | 23 | 24 | 96% |
| Phase 4a: Release UI | 9 | 9 | 100% |
| Phase 4b: API + Storage | 4 | 4 | 100% |
| Phase 4c: Download & Install | 6 | 6 | 100% |
| Phase 5: Distribution Groups | 21 | 21 | 100% |
| Phase 6: Organizations & Invitations | 13 | 13 | 100% |
| Phase 7: Settings | 18 | 18 | 100% |
| Phase 8: API Endpoints | 25 | 25 | 100% |
| Phase 9: Storage Adapters | 7 | 7 | 100% |
| Phase 10: Infrastructure | 13 | 13 | 100% |
| Phase 11: Polish & Docs | 19 | 19 | 100% |
| Phase 12: Provisioning Profile | 12 | 12 | 100% |
| Phase 13: Email OTP, CI/CD, Docs | 19 | 19 | 100% |
| Phase 14: Testing, Rate Limiting & Seed | 17 | 17 | 100% |
| Phase 15: Upgrade & Security | 0 | 4 | 0% |
| **TOTAL** | **242** | **248** | **97.6%** |

---

_Last updated: 2026-02-20_
