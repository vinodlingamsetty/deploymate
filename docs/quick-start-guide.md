# DeployMate - Quick Start Development Guide

> **Purpose:** Step-by-step prompts for AI-assisted development
> **Estimated Time:** 4-6 weeks for MVP
> **Prerequisites:** Node.js 20+, Docker, Git, Cursor IDE

---

## Pre-Development Checklist

### 1. Install Required Tools
```bash
□ Node.js 20+ (LTS)           # https://nodejs.org
□ pnpm                        # npm install -g pnpm
□ Docker Desktop              # https://docker.com
□ Git                         # https://git-scm.com
□ Cursor IDE                  # https://cursor.com
```

### 2. Create GitHub Repository
```bash
□ Create new repo: 'deploymate'
□ Clone locally
□ Initialize with README.md
```

### 3. Set Up IDE
```bash
□ Open project in Cursor
□ Copy cursor-rules-final.md to .cursor/rules.md
□ Install extensions: ESLint, Prettier, Tailwind CSS IntelliSense, Prisma
```

### 4. Start Local Database
```bash
docker run --name deploymate-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=deploymate \
  -p 5432:5432 \
  -d postgres:15-alpine
```

---

## Phase 1: Project Foundation (Week 1)

### Day 1: Initialize Next.js Project

**Prompt 1.1 - Create Next.js App**
```
Create a new Next.js 14 project with these EXACT specifications:

1. Use App Router (NOT pages directory)
2. TypeScript with strict mode
3. Tailwind CSS v4
4. src/ directory for source files
5. Path alias: @ → src/

Project structure should be:
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
├── lib/
└── types/

Requirements:
- next.config.js with standalone output
- tsconfig.json with strict: true
- eslint configured with next/core-web-vitals

Do NOT add any extra pages, components, or features yet.
```

**After completion:**
```bash
pnpm install
pnpm dev
# Verify http://localhost:3000 shows Next.js welcome page
git add . && git commit -m "feat: initialize Next.js 14 project"
```

---

**Prompt 1.2 - Add shadcn/ui**
```
Initialize shadcn/ui in the project with these settings:
- Style: Default (New York is also acceptable)
- Base color: Slate
- CSS variables: Yes
- Tailwind config location: tailwind.config.ts

After initialization, add these components:
1. button (with all variants)
2. input
3. label
4. card
5. dialog
6. sheet
7. dropdown-menu
8. tabs
9. table
10. badge
11. checkbox
12. textarea
13. select
14. avatar
15. separator
16. toast (using sonner)

Also set up next-themes for dark mode support with:
- Default theme: system
- Attribute: class
- Storage key: deploymate-theme

Create a ThemeProvider component that wraps the app.
```

**After completion:**
```bash
git add . && git commit -m "feat: add shadcn/ui components and dark mode"
```

---

**Prompt 1.3 - Add Custom Fonts**
```
Add the following Google Fonts to the project:

1. Space Grotesk (weights: 400, 500, 600, 700) - for UI text
2. Courier Prime (weights: 400, 700) - for monospace/code

Configure them in:
1. app/layout.tsx - import and apply fonts
2. tailwind.config.ts - add to fontFamily

Set up CSS variables:
--font-sans: 'Space Grotesk'
--font-mono: 'Courier Prime'

Apply Space Grotesk as the default sans-serif font for the entire app.
```

**After completion:**
```bash
git add . && git commit -m "feat: add Space Grotesk and Courier Prime fonts"
```

---

### Day 2: Database Setup

**Prompt 2.1 - Initialize Prisma**
```
Set up Prisma with PostgreSQL:

1. Install prisma and @prisma/client
2. Initialize Prisma with postgresql provider
3. Create prisma/schema.prisma with these models:

User:
- id: String (cuid, primary key)
- email: String (unique)
- passwordHash: String
- firstName: String? (nullable)
- lastName: String? (nullable)
- avatarUrl: String? (nullable)
- isSuperAdmin: Boolean (default: false)
- emailVerified: DateTime? (nullable)
- createdAt: DateTime (default: now)
- updatedAt: DateTime (auto-update)

Organization:
- id: String (cuid, primary key)
- name: String
- slug: String (unique)
- createdAt: DateTime (default: now)
- updatedAt: DateTime (auto-update)

Membership:
- id: String (cuid, primary key)
- userId: String (foreign key to User)
- orgId: String (foreign key to Organization)
- role: Role enum (ADMIN, MANAGER, TESTER, default: TESTER)
- createdAt: DateTime (default: now)
- updatedAt: DateTime (auto-update)
- Unique constraint on [userId, orgId]

Role enum:
- ADMIN
- MANAGER
- TESTER

Add proper relations between models.
Create src/lib/db.ts with a singleton Prisma client.
Add .env to .gitignore and create .env.example with DATABASE_URL placeholder.
```

**After completion:**
```bash
# Create .env file
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/deploymate"' > .env

# Push schema to database
npx prisma db push

# Generate client
npx prisma generate

git add . && git commit -m "feat: set up Prisma with User, Organization, Membership models"
```

---

**Prompt 2.2 - Add App and Release Models**
```
Add the following models to the Prisma schema:

App:
- id: String (cuid)
- name: String
- bundleId: String? (nullable)
- platform: Platform enum (IOS, ANDROID)
- orgId: String (FK to Organization)
- iconUrl: String? (nullable)
- iconKey: String? (nullable) - storage key for icon
- description: String? (nullable)
- createdAt: DateTime
- updatedAt: DateTime
- Unique constraint on [orgId, bundleId]
- Relation to Organization (onDelete: Cascade)

Platform enum:
- IOS
- ANDROID

Release:
- id: String (cuid)
- appId: String (FK to App)
- version: String (e.g., "2.1.0")
- buildNumber: String (e.g., "42")
- releaseType: ReleaseType enum (ALPHA, BETA, RELEASE_CANDIDATE, default: BETA)
- releaseNotes: String? (text, can be long)
- fileKey: String (storage key for binary)
- fileSize: Int (bytes)
- fileName: String (original filename)
- minOSVersion: String? (nullable)
- extractedBundleId: String? (nullable)
- downloadCount: Int (default: 0)
- createdAt: DateTime
- Unique constraint on [appId, version, buildNumber]
- Relation to App (onDelete: Cascade)

ReleaseType enum:
- ALPHA
- BETA
- RELEASE_CANDIDATE

Add proper indexes on frequently queried fields (orgId, appId, createdAt).
```

**After completion:**
```bash
npx prisma db push
npx prisma generate
git add . && git commit -m "feat: add App and Release models"
```

---

**Prompt 2.3 - Add Distribution Group Models**
```
Add distribution group models to Prisma schema:

AppDistGroup (app-level distribution group):
- id: String (cuid)
- name: String
- appId: String (FK to App)
- description: String? (nullable)
- createdAt: DateTime
- updatedAt: DateTime
- Unique constraint on [appId, name]

AppGroupMember:
- id: String (cuid)
- groupId: String (FK to AppDistGroup)
- userId: String (FK to User)
- role: GroupMemberRole enum (MANAGER, TESTER, default: TESTER)
- createdAt: DateTime
- Unique constraint on [groupId, userId]

OrgDistGroup (organization-level distribution group):
- id: String (cuid)
- name: String
- orgId: String (FK to Organization)
- description: String? (nullable)
- createdAt: DateTime
- updatedAt: DateTime
- Unique constraint on [orgId, name]

OrgGroupMember:
- id: String (cuid)
- groupId: String (FK to OrgDistGroup)
- userId: String (FK to User)
- role: GroupMemberRole enum
- createdAt: DateTime
- Unique constraint on [groupId, userId]

OrgGroupApp (links org groups to apps):
- id: String (cuid)
- groupId: String (FK to OrgDistGroup)
- appId: String (FK to App)
- createdAt: DateTime
- Unique constraint on [groupId, appId]

ReleaseGroup (links releases to distribution groups - polymorphic):
- id: String (cuid)
- releaseId: String (FK to Release)
- appGroupId: String? (nullable, FK to AppDistGroup)
- orgGroupId: String? (nullable, FK to OrgDistGroup)
- Note: Either appGroupId or orgGroupId should be set, not both

GroupMemberRole enum:
- MANAGER
- TESTER

Add all proper relations with onDelete: Cascade where appropriate.
```

**After completion:**
```bash
npx prisma db push
npx prisma generate
git add . && git commit -m "feat: add distribution group models"
```

---

**Prompt 2.4 - Add Supporting Models**
```
Add these supporting models to Prisma schema:

ApiToken:
- id: String (cuid)
- userId: String (FK to User)
- name: String (user-provided name)
- tokenHash: String (unique) - SHA256 hash
- tokenPrefix: String - first 8 chars for display
- permissions: TokenPermission[] (array of enum)
- lastUsedAt: DateTime? (nullable)
- expiresAt: DateTime? (nullable)
- createdAt: DateTime
- Index on tokenHash

TokenPermission enum:
- READ
- WRITE
- DELETE
- ADMIN

Invitation:
- id: String (cuid)
- email: String
- orgId: String (FK to Organization)
- role: Role (default: TESTER)
- invitedById: String (FK to User)
- token: String (unique)
- status: InvitationStatus enum (default: PENDING)
- expiresAt: DateTime
- createdAt: DateTime
- acceptedAt: DateTime? (nullable)
- Index on email, token

InvitationStatus enum:
- PENDING
- ACCEPTED
- EXPIRED
- REVOKED

DownloadLog:
- id: String (cuid)
- releaseId: String (FK to Release)
- userId: String (FK to User)
- ipAddress: String? (nullable)
- userAgent: String? (nullable)
- createdAt: DateTime
- Indexes on releaseId, userId, createdAt

Feedback:
- id: String (cuid)
- releaseId: String (FK to Release)
- userId: String (FK to User)
- rating: Int? (nullable, 1-5)
- comment: String? (text, nullable)
- createdAt: DateTime
- updatedAt: DateTime
- Indexes on releaseId, userId

Add all relations to User model for these new models.
```

**After completion:**
```bash
npx prisma db push
npx prisma generate
git add . && git commit -m "feat: add ApiToken, Invitation, DownloadLog, Feedback models"
```

---

### Day 3-4: Authentication

**Prompt 3.1 - Set Up NextAuth**
```
Set up NextAuth.js v5 (Auth.js) with credentials provider:

1. Install: next-auth@beta @auth/prisma-adapter @node-rs/argon2

2. Create src/lib/auth.ts with:
   - Credentials provider (email + password)
   - Custom authorize function that:
     - Finds user by email
     - Verifies password using Argon2
     - Returns user object or null
   - Session callback that includes user.id and user.isSuperAdmin
   - JWT callback that includes user data

3. Create src/app/api/auth/[...nextauth]/route.ts

4. Create src/lib/auth-utils.ts with these functions:
   - hashPassword(password: string): Promise<string>
   - verifyPassword(hash: string, password: string): Promise<boolean>
   - getServerAuthSession(): Get session on server
   - authenticateRequest(request: Request): For API routes (session or Bearer token)

5. Create src/components/providers/session-provider.tsx (client component)

6. Update src/app/layout.tsx to wrap app with SessionProvider

Configuration:
- Session strategy: jwt
- Session max age: 30 days
- Secure cookies in production
- Pages: { signIn: '/login' }

Environment variables needed:
- NEXTAUTH_SECRET
- NEXTAUTH_URL
```

**After completion:**
```bash
# Generate a secret
openssl rand -base64 32
# Add to .env:
# NEXTAUTH_SECRET="generated-secret-here"
# NEXTAUTH_URL="http://localhost:3000"

git add . && git commit -m "feat: set up NextAuth with credentials provider"
```

---

**Prompt 3.2 - Create Login Page**
```
Create the login page at src/app/(auth)/login/page.tsx

Design requirements (from v0 specification):
- Full-page gradient background (dark blue to purple)
- Centered card with backdrop blur
- Card max-width: 400px

Card contents (top to bottom):
1. DeployMate logo (text, "DeployMate" in bold)
2. Tagline: "Beta App Distribution Made Simple"
3. Space (separator)
4. "Continue with Email" button (primary style, full width, Mail icon)
5. Space
6. "Don't have an account? Sign up" text link

For now, clicking "Continue with Email" should:
1. Show a form with email and password inputs
2. Submit via NextAuth signIn('credentials', { email, password })
3. Redirect to /dashboard on success
4. Show error message on failure

Create auth route group layout at src/app/(auth)/layout.tsx that:
- Does NOT include sidebar or header
- Just renders children
- Has the gradient background

Make it fully responsive:
- Mobile: Full-width card with padding
- Desktop: Centered card

Follow all accessibility requirements:
- Labels for inputs
- Error messages with aria-describedby
- Focus visible states
```

**After completion:**
```bash
git add . && git commit -m "feat: add login page with email/password authentication"
```

---

**Prompt 3.3 - Create Registration Page**
```
Create the registration page at src/app/(auth)/register/page.tsx

Same visual design as login page (gradient background, centered card).

Form fields:
1. First Name (required)
2. Last Name (required)
3. Email (required, email validation)
4. Password (required, min 8 chars, must contain letter and number)
5. Confirm Password (must match password)

Use react-hook-form with Zod for validation.

Validation rules:
- First/Last name: 1-50 characters
- Email: valid email format
- Password: min 8 chars, at least 1 letter, at least 1 number
- Confirm password: must match password

On submit:
1. Call POST /api/auth/register (create this endpoint)
2. Hash password with Argon2
3. Create user in database
4. If SUPER_ADMIN_EMAILS env var contains this email, set isSuperAdmin: true
5. Return success or error

On success:
- Show success message
- Redirect to /login

Create the API route at src/app/api/auth/register/route.ts with proper validation and error handling.
```

**After completion:**
```bash
git add . && git commit -m "feat: add registration page and API endpoint"
```

---

**Prompt 3.4 - Create Auth Middleware**
```
Create middleware to protect authenticated routes.

Create src/middleware.ts that:
1. Checks if the route requires authentication
2. Protected routes: /dashboard/*, /apps/*, /releases/*, /groups/*, /settings/*
3. Public routes: /login, /register, /api/auth/*
4. If accessing protected route without session → redirect to /login
5. If accessing /login with session → redirect to /dashboard

Use NextAuth's auth() function to check session.

Also update the root page (src/app/page.tsx) to:
- Redirect authenticated users to /dashboard
- Redirect unauthenticated users to /login
```

**After completion:**
```bash
git add . && git commit -m "feat: add authentication middleware"
```

---

### Day 5: Dashboard Layout

**Prompt 4.1 - Create Dashboard Layout**
```
Create the main dashboard layout at src/app/(dashboard)/layout.tsx

Structure (from v0 specification):
- Left sidebar (hidden on mobile, visible on lg+)
- Top header bar
- Main content area with id="main-content"

This layout wraps all authenticated pages.

Create these components:
1. src/components/layout/dashboard-layout.tsx - the main wrapper
2. src/components/layout/sidebar.tsx - left navigation
3. src/components/layout/top-header.tsx - top bar

Sidebar contents:
- DeployMate logo (links to /dashboard)
- "All Apps" nav item (icon: Home, links to /dashboard)
- "Organizations" collapsible section with:
  - List of user's organizations
  - Each org expandable with "Groups" sub-item

Top header contents:
- Mobile: Hamburger menu button (opens sidebar as Sheet)
- Logo (visible on mobile)
- Search input (hidden on mobile, functional search)
- Theme toggle button (sun/moon)
- Notifications bell icon with badge count
- User avatar with dropdown menu:
  - Settings (links to /settings)
  - Sign Out

Mobile behavior:
- Sidebar hidden by default
- Hamburger opens sidebar as Sheet from left
- Semi-transparent backdrop
- Touch-friendly (min 44px tap targets)

Desktop behavior:
- Sidebar always visible
- Width: 256px (w-64)
- Header is full width minus sidebar

Use shadcn Sheet component for mobile sidebar.
Get user session and organizations from database.
```

**After completion:**
```bash
git add . && git commit -m "feat: add dashboard layout with sidebar and header"
```

---

## Phase 2: Core Features (Week 2-3)

### Apps Management

**Prompt 5.1 - Create Apps API Routes**
```
Create the apps API routes following the specification in the requirements document.

Create src/app/api/v1/apps/route.ts with:

GET /api/v1/apps
- Authentication required
- Query params: page, perPage, org (slug), search, platform
- Returns paginated list of apps user has access to
- Include: organization, latest release, counts

POST /api/v1/apps
- Authentication required
- Permission: app:create (Admin only)
- Body: name, platform, orgId, description (optional)
- Validates with Zod
- Returns created app

Create src/app/api/v1/apps/[id]/route.ts with:

GET /api/v1/apps/:id
- Authentication required
- Must have access to app
- Returns full app details with stats

PATCH /api/v1/apps/:id
- Authentication required
- Permission: app:update (Admin or Manager)
- Body: name, description (partial update)
- Returns updated app

DELETE /api/v1/apps/:id
- Authentication required
- Permission: app:delete (Admin only)
- Body: confirmName (must match app name)
- Deletes app and all releases
- Returns 204 No Content

Create src/lib/api-utils.ts with helper functions:
- successResponse(data, status?)
- errorResponse(code, message, status, details?)
- paginatedResponse(data, page, perPage, total)

Create src/lib/validations.ts with Zod schemas for app operations.

Follow the API response format from the requirements document.
```

**After completion:**
```bash
git add . && git commit -m "feat: add apps API routes"
```

---

**Prompt 5.2 - Create Dashboard Apps Page**
```
Create the main dashboard page at src/app/(dashboard)/dashboard/page.tsx

This is a Server Component that:
1. Gets the user session
2. Fetches apps the user has access to
3. Supports filtering via URL query params

Query parameters to support:
- org: filter by organization slug
- view: 'grid' | 'list' (default: grid)
- search: search by app name

Create these components:

1. src/components/dashboard/dashboard-header.tsx
   - Welcome message with user name
   - Organization filter dropdown
   - Grid/List view toggle buttons
   - "+ New App" button (hidden on mobile)

2. src/components/dashboard/app-grid.tsx
   - Displays apps in grid or list view
   - Grid: Cards in responsive grid
   - List: Table with columns (icon, name, platform, version, org, actions)
   - Each app shows:
     - Icon (or default platform icon)
     - Name
     - Platform badge (iOS/Android)
     - Latest version
     - Release type badge (colored per v0 spec)
     - Organization name
     - "View Details" button

3. src/components/apps/app-card.tsx
   - Individual app card for grid view
   - Use exact colors from v0 spec for release type badges

4. src/components/apps/app-row.tsx
   - Individual app row for list view

Implement real-time search filtering (client-side filter of fetched apps).
Use URL state for filters (org, view) so they're shareable.

Mobile responsive:
- Grid: 1 column on mobile, 2 on sm, 3 on md, 4 on lg
- List: Hide some columns on mobile
```

**After completion:**
```bash
git add . && git commit -m "feat: add dashboard apps page with grid/list views"
```

---

**Prompt 5.3 - Create New App Sheet**
```
Create the "New App" sheet component at src/components/apps/new-app-sheet.tsx

Trigger: "+ New App" button in dashboard header

Sheet component (slides from right) with:
1. Header: "Create New App" with close button
2. Form fields:
   - App Name (required, text input)
   - Platform (required, select: iOS, Android)
   - Organization (required, select from user's orgs where they're Admin)
   - Release Type (required, select: Alpha, Beta, Release Candidate)
   - App Icon (optional, drag & drop image upload)
   - Description (optional, textarea)

3. Footer:
   - Cancel button (grey, red on hover)
   - "Create App" button (disabled until form is valid)

Validation:
- App name: 1-100 characters
- Platform: required
- Organization: required
- Release type: required

On submit:
- POST to /api/v1/apps
- Show loading state
- On success: close sheet, refresh app list, show success toast
- On error: show error message

Drag & drop upload:
- Dashed border container
- "Drag & drop or click to upload" text
- Accept image files only
- Show preview when uploaded
- Remove button to clear
- Store file temporarily (actual upload happens on form submit)
```

**After completion:**
```bash
git add . && git commit -m "feat: add new app sheet/form"
```

---

**Prompt 5.4 - Create App Details Page**
```
Create the app details page at src/app/(dashboard)/apps/[id]/page.tsx

This should be a Server Component that fetches app data.

Layout (from v0 specification):

Header section:
- Back button (goes to /dashboard)
- App icon (48x48 desktop, 40x40 mobile)
- App name
- Platform badge
- Version number
- "Upload New Release" button (hidden on mobile)
- 3-dot menu with "Delete App" option (hidden on mobile, Admin only)

Stats section:
- Desktop: 3 cards in a row
- Mobile: Compact list with dividers (no card backgrounds)
- Stats: Latest Version (with date), Total Members (across groups), Total Downloads

Tabs section:
1. Releases - list of all releases
2. User Feedback - placeholder content for now
3. Metadata - app metadata (bundle ID, created date, etc.)
4. Distribution Groups - list of app-level groups (hidden on mobile)

Create these components:
1. src/components/apps/app-details-header.tsx
2. src/components/apps/app-stats.tsx
3. src/components/apps/releases-tab.tsx
4. src/components/apps/feedback-tab.tsx (placeholder)
5. src/components/apps/metadata-tab.tsx
6. src/components/apps/groups-tab.tsx

Use the scroll behavior from v0 spec:
- Link to this page with scroll={false}
- useEffect to scroll to top on mount

For the Releases tab, each release shows:
- Version number
- Date
- Download count
- "Download Build" button (colored by release type)
- "View Details" button
- Buttons stack vertically
```

**After completion:**
```bash
git add . && git commit -m "feat: add app details page with tabs"
```

---

### Continue with remaining features...

[The document continues with prompts for:]
- Release upload flow
- Release details page
- Distribution groups
- Settings page
- API tokens
- Storage adapters
- Docker deployment

---

## Phase 3: Advanced Features (Week 4-5)

[Detailed prompts for:]
- Invitation system
- Organization-level groups
- Webhooks
- Additional storage adapters (GCS, Azure)

---

## Phase 4: Polish & Deployment (Week 6)

[Detailed prompts for:]
- Mobile optimization
- Error boundaries
- Loading states
- Documentation
- Docker production build
- CI/CD setup

---

## Troubleshooting Guide

### Common Issues

**"Module not found" errors:**
```bash
rm -rf node_modules .next
pnpm install
```

**Database connection failed:**
```bash
docker ps  # Check if postgres is running
docker restart deploymate-db
npx prisma db push
```

**Type errors after schema change:**
```bash
npx prisma generate
```

**AI making unwanted changes:**
- Use git to revert: `git checkout -- path/to/file`
- Be more specific in your prompt
- Add: "Do NOT change anything else"

---

## Git Commit Convention

```
feat: add new feature
fix: bug fix
docs: documentation
style: formatting only
refactor: code restructuring
test: add tests
chore: maintenance
```

---

## Daily Development Workflow

```
1. Pull latest changes
2. Review what's needed for today
3. Write specific prompt for first task
4. Review AI output before accepting
5. Test the change
6. Commit with descriptive message
7. Repeat for next task
8. End of day: push all commits
```

---

*Remember: The AI should follow the rules in cursor-rules-final.md. If it doesn't, reference the rules explicitly in your prompt.*
