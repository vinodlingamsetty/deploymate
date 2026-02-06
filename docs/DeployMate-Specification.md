# DeployMate - Complete Application Specification Document

## Overview

**DeployMate** is a premium SaaS platform for distributing mobile app beta builds to testers, similar to TestFlight or Firebase App Distribution. It enables development teams to upload iOS (.ipa) and Android (.apk) builds, manage testers through distribution groups, track downloads, and collect feedback.

**Target Users:** Mobile development teams, QA engineers, product managers, beta testers

**Core Value Proposition:** Streamlined beta app distribution with role-based access control, organization management, and comprehensive release tracking.

---

## Design System

### Color Palette (Exactly 5 Colors)

| Purpose | Color Code | Text Color | Usage |
|---------|------------|------------|-------|
| Alpha Release | #90e0ef (Light Blue) | Dark text (#1a1a1a) | Badges, Download buttons |
| Beta Release | #0077b6 (Medium Blue) | White text (#ffffff) | Badges, Download buttons, Checkboxes, Primary accent |
| Release Candidate | #03045e (Very Dark Blue) | White text (#ffffff) | Badges, Download buttons |
| Primary Accent | #0077b6 (Medium Blue) | White text | Primary buttons, active states, links, focus rings |
| Neutrals | Semantic tokens | Varies | background, foreground, muted, border, card colors |

### Semantic Design Tokens

```css
/* Light Mode */
--background: white
--foreground: dark gray
--card: white
--card-foreground: dark gray
--primary: #0077b6
--primary-foreground: white
--secondary: light gray
--secondary-foreground: dark gray
--muted: light gray
--muted-foreground: medium gray
--accent: #0077b6
--accent-foreground: white
--destructive: red
--destructive-foreground: white
--border: light gray
--input: light gray
--ring: #0077b6

/* Dark Mode (Default) */
--background: very dark gray (#0a0a0a)
--foreground: light gray
--card: dark gray
--card-foreground: light gray
--primary: #0077b6
--primary-foreground: white
--secondary: dark gray
--secondary-foreground: light gray
--muted: dark gray
--muted-foreground: medium gray (#a1a1aa)
--accent: #0077b6
--accent-foreground: white
--destructive: red
--destructive-foreground: white
--border: dark gray
--input: dark gray
--ring: #0077b6
```

### Typography

| Font | Type | Weights | Usage |
|------|------|---------|-------|
| **Space Grotesk** | Sans-serif (Primary) | 400, 500, 600, 700 | Headings, body text, UI elements, buttons, labels |
| **Courier Prime** | Monospace | 400, 700 | Code, technical content, version numbers, API tokens |

**Font Implementation:**
```css
--font-sans: var(--font-space-grotesk);
--font-mono: var(--font-courier-prime);
```

### Layout Principles

1. **Mobile-first responsive design** - Design for mobile, then enhance for larger screens
2. **NO horizontal scrolling** on any view - Content must fit viewport width
3. **Flexbox for most layouts** - Use CSS Grid only for complex 2D layouts
4. **Compact spacing on mobile** - Reduced padding, margins, and font sizes
5. **Generous spacing on desktop** - Comfortable reading and interaction areas
6. **Native app feel** on mobile devices - Smooth transitions, touch-friendly targets

### Responsive Breakpoints

| Breakpoint | Prefix | Min Width | Usage |
|------------|--------|-----------|-------|
| Mobile | (default) | 0px | Base styles |
| Small | sm: | 640px | Small tablets |
| Medium | md: | 768px | Tablets |
| Large | lg: | 1024px | Desktop |
| XL | xl: | 1280px | Large desktop |

### Button Styling

| Button Type | Default State | Hover State |
|-------------|---------------|-------------|
| **Primary** | bg-primary (#0077b6), text-white | Slightly darker blue |
| **Secondary/Outline** | bg-transparent, border-input | bg-accent/10 |
| **Cancel** | bg-transparent, text-muted-foreground | bg-red-500/10, text-red-500, border-red-500 |
| **Destructive/Delete** | bg-red-500, text-white | bg-red-600 |
| **Download (Alpha)** | bg-[#90e0ef], text-[#1a1a1a] | Slightly darker |
| **Download (Beta)** | bg-[#0077b6], text-white | Slightly darker |
| **Download (RC)** | bg-[#03045e], text-white | Slightly darker |

### Checkbox Styling (Dark Mode Optimized)

```css
/* Unchecked state */
border: 2px solid #0077b6;
background: transparent;

/* Checked state */
border: 2px solid #0077b6;
background: #0077b6;
checkmark: white;
```

### Card Styling

```css
/* Default card */
background: var(--card);
border: 1px solid var(--border);
border-radius: var(--radius); /* 0.5rem */
padding: 1rem (desktop), 0.75rem (mobile);
```

---

## Application Architecture

### Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14+ | App Router, Server Components |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling with semantic tokens |
| shadcn/ui | UI component library |
| Lucide React | Icon library |

### Project Structure

```
app/
  globals.css              # Tailwind config, design tokens, global styles
  layout.tsx               # Root layout with fonts, metadata
  page.tsx                 # Root route - redirects to /login
  
  login/
    page.tsx               # Login page with auth options
  
  dashboard/
    page.tsx               # Main dashboard with apps grid/list
  
  apps/
    [id]/
      page.tsx             # Individual app details page
  
  releases/
    [id]/
      page.tsx             # Individual release details page
  
  groups/
    page.tsx               # Organization distribution groups
  
  settings/
    page.tsx               # User settings with tabs

components/
  # Layout Components
  dashboard-layout.tsx     # Main authenticated layout wrapper
  sidebar.tsx              # Left navigation sidebar
  top-header.tsx           # Top bar with search, theme, profile
  
  # Dashboard Components
  dashboard-header.tsx     # Welcome message, filters, view toggle
  app-grid.tsx             # Apps display (grid and list views)
  
  # App Detail Components
  app-details-content.tsx  # Full app details with tabs
  release-details-content.tsx # Release details page content
  
  # Form/Sheet Components
  login-form.tsx           # Login authentication form
  new-app-sheet.tsx        # Create new app slide-in form
  upload-release-sheet.tsx # Multi-step release upload flow
  create-app-group-sheet.tsx # Create app-level distribution group
  create-group-sheet.tsx   # Create organization-level group
  manage-group-sheet.tsx   # Manage group members and apps
  add-user-sheet.tsx       # Add user to group form
  add-apps-sheet.tsx       # Add apps to group form
  
  # Settings Components
  settings-content.tsx     # Settings page with all tabs
  groups-content.tsx       # Groups page content
  
  # UI Components (shadcn/ui)
  ui/
    button.tsx
    card.tsx
    input.tsx
    label.tsx
    select.tsx
    tabs.tsx
    sheet.tsx
    dialog.tsx
    alert-dialog.tsx
    dropdown-menu.tsx
    checkbox.tsx
    textarea.tsx
    badge.tsx
    avatar.tsx
    separator.tsx
    ... (other shadcn components)

public/
  # Static assets
  app-testing-analytics-feedback-hero.jpg  # Login background image
```

### Navigation Behavior

| Behavior | Implementation |
|----------|----------------|
| View Details links | `scroll={false}` on Link component |
| Detail pages | `useEffect` with `window.scrollTo(0, 0)` on mount |
| Back button | Preserves scroll position (default browser behavior) |
| Logo click | Navigates to `/dashboard` (All Apps view) |

### URL Structure & Query Parameters

| Route | Parameters | Description |
|-------|------------|-------------|
| `/` | - | Redirects to `/login` |
| `/login` | - | Authentication page |
| `/dashboard` | `?org={name}` | Filter by organization |
| `/dashboard` | `?view=grid\|list` | Display mode (default: grid) |
| `/dashboard` | `?search={query}` | Search filter |
| `/apps/[id]` | - | App details (id = app identifier) |
| `/releases/[id]` | - | Release details (id = release identifier) |
| `/groups` | `?org={name}` | Organization groups (required) |
| `/settings` | - | User settings |

**Combined URL Example:**
`/dashboard?org=finance&view=list&search=sales`

---

## User Roles & Permissions

### Role Hierarchy

```
Super Admin (Account Level)
    |
    v
Admin (Organization Level)
    |
    v
Manager (App/Group Level)
    |
    v
Tester (App/Group Level)
```

### Permission Matrix

| Action | Super Admin | Admin | Manager | Tester |
|--------|-------------|-------|---------|--------|
| Create/delete organizations | Yes | No | No | No |
| Create/delete apps | Yes | Yes | No | No |
| Upload/remove builds | Yes | Yes | Yes | No |
| Create/delete groups | Yes | Yes | Yes | No |
| Add/remove users | Yes | Yes | Yes | No |
| View/install apps | Yes | Yes | Yes | Yes |
| Provide feedback | Yes | Yes | Yes | Yes |

### Distribution Groups

| Type | Scope | Description |
|------|-------|-------------|
| **App Groups** | App-scoped | Membership specific to a single app |
| **Org Groups** | Organization-level | Can be mapped to multiple apps within the organization |

### Release Distribution

When creating a release:
1. Select combination of App Groups and/or Org Groups
2. System resolves all users from selected groups
3. Notifications sent to resolved users
4. At least one group must be selected (mandatory)

---

## Page Specifications

### 1. Login Page (`/login`)

#### Layout Structure

```
+--------------------------------------------------+
|                                                  |
|         [Full-page background image]             |
|                                                  |
|     +----------------------------------+         |
|     |         [DeployMate Logo]        |         |
|     |     "Beta App Distribution"      |         |
|     |                                  |         |
|     |   [Continue with Email button]   |         |
|     |   [Continue with SSO button]     |         |
|     |   [Continue with Google button]  |         |
|     |                                  |         |
|     |   "Don't have an account?"       |         |
|     |        [Sign up link]            |         |
|     +----------------------------------+         |
|                                                  |
+--------------------------------------------------+
```

#### Components

**Background Image:**
- Full viewport coverage
- Theme: Mobile app testing, analytics, feedback visualization
- Style: Modern abstract art
- Dark overlay for contrast (bg-black/50)
- File: `/public/app-testing-analytics-feedback-hero.jpg`

**Login Card:**
- Centered on page
- Semi-transparent background with backdrop blur
- Border with subtle opacity
- Max width: 400px
- Padding: 2rem

**Logo Section:**
- DeployMate text logo
- Tagline: "Beta App Distribution Made Simple"

**Authentication Buttons (stacked vertically, full width):**

1. **Continue with Email**
   - Style: Primary (bg-primary)
   - Icon: Mail (Lucide)
   - Full width

2. **Continue with SSO**
   - Style: Outline
   - Icon: Key (Lucide)
   - Full width

3. **Continue with Google**
   - Style: Outline
   - Icon: Chrome or custom Google icon (Lucide)
   - Full width

**Footer Link:**
- Text: "Don't have an account? Sign up"
- Centered, smaller text

#### Behavior

- All login buttons navigate to `/dashboard`
- Page is not wrapped in dashboard layout
- No sidebar or header visible

---

### 2. Dashboard Layout

The dashboard layout wraps all authenticated pages and consists of three main sections:

#### 2.1 Top Header

```
+------------------------------------------------------------------+
| [Hamburger] [Logo]                    [Search] [Theme] [Bell] [Avatar] |
+------------------------------------------------------------------+
```

**Left Section:**

| Element | Visibility | Behavior |
|---------|------------|----------|
| Hamburger menu | Mobile/Tablet only (`lg:hidden`) | Toggles sidebar open/closed |
| DeployMate logo | Always visible | Clicks navigate to `/dashboard` |

**Right Section:**

| Element | Visibility | Behavior |
|---------|------------|----------|
| Search input | Desktop only (`hidden lg:flex`) | Real-time app search |
| Theme toggle | Always | Switches light/dark mode |
| Notifications | Always | Bell icon with badge (mock) |
| User avatar | Always | Opens profile dropdown |

**Profile Dropdown Menu Items:**
1. Settings - navigates to `/settings`
2. Sign Out - navigates to `/login`

Note: NO "Profile" option (merged with Settings)

**Mobile Header Adjustments:**
- Search bar hidden
- Hamburger visible
- Reduced padding

---

#### 2.2 Left Sidebar

```
+------------------------+
| [Logo] DeployMate  [X] |
+------------------------+
| [Home] All Apps        |
+------------------------+
| v Organizations        |
|   > Finance            |
|     - Groups           |
|   > Sales              |
|     - Groups           |
|   > Marketing          |
|     - Groups           |
+------------------------+
```

**Structure (top to bottom):**

**1. Header (Mobile only):**
- Logo
- Close button (X)

**2. All Apps Button:**
- Icon: Home (Lucide)
- Text: "All Apps"
- Always visible at top of navigation
- Link: `/dashboard` (clears all query params)
- Active state: Highlighted ONLY when `org` param is empty/not present
- NOT highlighted when any organization is selected

**3. Organizations Section:**
- Collapsible header with chevron icon
- Label: "Organizations"
- Expanded by default

**Each Organization Item:**
- Icon: Building2 (Lucide)
- Expandable with chevron
- When expanded, shows "Groups" submenu item
- Clicking org name: Navigates to `/dashboard?org={orgName}`
- Clicking "Groups": Navigates to `/groups?org={orgName}`
- Active state: Highlighted when URL contains matching `org` param

**Important:** NO "All Organizations" option exists (removed)

**Important:** NO "Settings" button in sidebar (removed - only accessible via profile dropdown)

**Mock Organizations:**
- Finance
- Sales  
- Marketing

**Mobile Behavior:**
- Sidebar hidden by default (state: closed)
- Opens as full-height overlay from left
- Semi-transparent backdrop behind sidebar
- Clicking backdrop closes sidebar
- Close (X) button in sidebar header
- Touch-friendly tap targets (min 44px)

**Desktop Behavior:**
- Sidebar always visible
- Fixed width: 256px (w-64)
- No backdrop
- No close button needed

---

#### 2.3 Main Content Area

```
+------------------------------------------+
|                                          |
|          [Page-specific content]         |
|                                          |
+------------------------------------------+
```

**Attributes:**
- `id="main-content"` for skip link accessibility
- `role="main"` ARIA landmark
- Flexible height, scrollable
- Padding: `p-4` mobile, `p-6` desktop

---

### 3. Dashboard - Apps View (`/dashboard`)

#### Layout Structure

```
+--------------------------------------------------+
| Welcome John                                      |
+--------------------------------------------------+
| [Org filter] [Platform] [Type] | [Grid][List] [+New App] |
+--------------------------------------------------+
| +----------+ +----------+ +----------+           |
| | App Card | | App Card | | App Card |           |
| +----------+ +----------+ +----------+           |
| +----------+ +----------+ +----------+           |
| | App Card | | App Card | | App Card |           |
| +----------+ +----------+ +----------+           |
+--------------------------------------------------+
```

#### Header Section

**Welcome Message:**
- Text: "Welcome {firstName}"
- Source: User profile data (mock: "John")
- Font: Large, semi-bold

#### Filter Controls Row

**Layout:** Flex row, wraps on mobile, gap between items

**Filters (left side):**

1. **Organization Dropdown**
   - Default: "All Organizations"
   - Options: All Organizations, Finance, Sales, Marketing
   - Width: 140px desktop, 110px mobile
   - Changes URL: `?org={value}`

2. **Platform Dropdown**
   - Default: "All Platforms"
   - Options: All Platforms, iOS, Android
   - Width: 140px desktop, 110px mobile

3. **Release Type Dropdown**
   - Default: "All Types"
   - Options: All Types, Alpha, Beta, Release Candidate
   - Width: 140px desktop, 110px mobile

**Actions (right side):**

4. **View Toggle Buttons**
   - Grid view button (Grid3X3 icon)
   - List view button (List icon)
   - Active button has different background
   - Changes URL: `?view=grid` or `?view=list`
   - Default: grid

5. **"+ New App" Button**
   - Icon: Plus
   - Text: "New App"
   - Style: Primary
   - Visibility: `hidden lg:flex` (hidden on mobile/tablet)
   - Opens: NewAppSheet component

#### Grid View

**Responsive Grid:**
- 1 column: Mobile (< 640px)
- 2 columns: Tablet (640px - 1023px)  
- 3 columns: Desktop (1024px+)
- Gap: 1rem

**App Card Structure:**
```
+--------------------------------+
| [Icon 64x64]  App Name         |
|              [iOS] [Beta]      |
+--------------------------------+
| Organization: Finance          |
| Version: 2.1.0                 |
| Testers: 24                    |
+--------------------------------+
| [View Details - full width]    |
+--------------------------------+
```

**Card Elements:**

| Element | Style | Notes |
|---------|-------|-------|
| App Icon | 64x64, rounded, emoji placeholder | Center-left |
| App Name | text-lg font-semibold, truncate | Max 1 line |
| Platform Badge | Small badge (iOS/Android) | Next to release type |
| Release Type Badge | Colored by type | Alpha/Beta/RC colors |
| Organization | text-sm text-muted-foreground | With Building2 icon |
| Version | text-sm | With Tag icon |
| Testers | text-sm | With Users icon |
| View Details Button | Full width, outline style | Links to `/apps/[id]` |

**Card Link Behavior:**
- "View Details" button: `scroll={false}` to prevent scroll jump

#### List View

**Sticky Header Row:**
```
+------------------------------------------------------------------+
| App Name | Org Name | Platform | Version | Type | Testers        |
+------------------------------------------------------------------+
```

**Header Styling:**
- Position: sticky, top: 0
- Background: semi-transparent with backdrop blur
- z-index: 20
- Shadow: subtle shadow-sm
- Font: text-xs font-medium uppercase text-muted-foreground

**List Row Structure:**
```
+------------------------------------------------------------------+
| [Icon] App Name | Finance | iOS | 2.1.0 | [Beta] | 24 | [View]   |
+------------------------------------------------------------------+
```

**Row Elements:**
- Entire row clickable (navigates to app details)
- Hover state: subtle background change
- "View Details" button at end

**Mobile List Adjustments:**
- Fewer columns visible
- Smaller text
- Icon size reduced

#### Search Functionality

**Implementation:**
- Input in top header (desktop only)
- Real-time filtering as user types
- Debounced (300ms recommended)
- URL parameter: `?search={query}`

**Search Fields:**
- App name (primary)
- Organization name
- Platform
- Version

**No Results State:**
- Message: "No apps found matching your search"
- Suggestion to adjust filters

#### Empty State

When no apps exist:
- Illustration or icon
- Message: "No apps yet"
- "Create your first app" button (if user has permission)

---

### 4. New App Sheet

**Trigger:** "+ New App" button on dashboard

**Type:** Sheet component, slides in from right

**Width:** max-w-md (448px)

#### Form Structure

```
+--------------------------------+
| Create New App             [X] |
+--------------------------------+
| App Name *                     |
| [________________________]     |
|                                |
| Platform *                     |
| [Select platform        v]    |
|                                |
| Organization *                 |
| [Select organization    v]    |
|                                |
| Release Type *                 |
| [Select release type    v]    |
|                                |
| App Icon                       |
| +------------------------+     |
| |   Drag & drop or      |     |
| |   click to upload     |     |
| +------------------------+     |
|                                |
+--------------------------------+
| [Cancel]        [Create App]   |
+--------------------------------+
```

#### Form Fields

| Field | Type | Required | Options/Validation |
|-------|------|----------|-------------------|
| App Name | Text input | Yes | Min 1 character |
| Platform | Select | Yes | iOS, Android |
| Organization | Select | Yes | Finance, Sales, Marketing |
| Release Type | Select | Yes | Alpha, Beta, Release Candidate |
| App Icon | File upload | No | Image files, drag & drop supported |

#### Drag & Drop Upload

**States:**
1. **Default:** Dashed border, upload icon, "Drag & drop or click to upload"
2. **Drag Over:** Accent color border, highlighted background
3. **Uploaded:** Shows image preview, file name, remove button

#### Footer Buttons

| Button | Style | State |
|--------|-------|-------|
| Create App | Primary | Disabled until all required fields valid |
| Cancel | Ghost/Outline | Grey default, red on hover |

#### Validation

- All required fields must have values
- Create button disabled until form is valid
- No inline validation errors (rely on required state)

#### On Submit

1. Log form data (mock)
2. Close sheet
3. Would add app to list (real implementation)

---

### 5. App Details Page (`/apps/[id]`)

#### Layout Structure

```
+--------------------------------------------------+
| [<-] [Icon] App Name                             |
|             [iOS] v2.1.0    [Upload] [...]       |
+--------------------------------------------------+
| +-----------+ +-----------+ +-----------+        |
| | Latest    | | Total     | | Total     |        |
| | Version   | | Members   | | Downloads |        |
| +-----------+ +-----------+ +-----------+        |
+--------------------------------------------------+
| [Releases] [User Feedback] [Metadata] [Groups]   |
+--------------------------------------------------+
|                                                  |
|              [Tab Content]                       |
|                                                  |
+--------------------------------------------------+
```

#### Header Section

**Desktop Layout:**
```
[Back] [Icon 48x48] [Name + Platform badge + Version] ... [Upload New Release] [3-dot menu]
```

**Mobile Layout:**
```
[Back] [Icon 40x40] [Name]
                    [Platform badge] [Version]
```

**Elements:**

| Element | Desktop | Mobile |
|---------|---------|--------|
| Back button | Visible | Visible |
| App icon | 48x48 | 40x40 |
| App name | Large text | Medium text, truncate |
| Platform badge | Inline | Below name |
| Version | Inline | Below name |
| Upload New Release button | Visible (`hidden md:flex`) | Hidden |
| 3-dot menu | Visible (`hidden md:flex`) | Hidden |

**3-Dot Menu (Desktop Only):**
- Dropdown with single option
- "Delete App" with Trash icon
- Opens delete confirmation dialog

#### Delete App Confirmation Dialog

```
+----------------------------------+
| Delete "Shopping App"?           |
+----------------------------------+
| This action cannot be undone.    |
| This will permanently delete     |
| the app and all its releases.    |
|                                  |
| Type "Shopping App" to confirm:  |
| [_____________________________]  |
|                                  |
+----------------------------------+
| [Cancel]          [Delete App]   |
+----------------------------------+
```

**Validation:**
- Delete button disabled until input matches app name exactly (case-sensitive)
- Cancel button: grey, turns red on hover
- Delete button: red background

#### Stats Section

**Desktop View (Cards):**
```
+------------------+ +------------------+ +------------------+
| Latest Version   | | Total Members    | | Total Downloads  |
| [Icon]           | | [Icon]           | | [Icon]           |
|                  | |                  | |                  |
| 3.0.1            | | 32               | | 711              |
| Uploaded 1/12/24 | | Across 3 groups  | | All releases     |
+------------------+ +------------------+ +------------------+
```

**Mobile View (Option 3 - Compact List with Dividers):**
```
+--------------------------------------------------+
| [Icon] Latest Version              3.0.1         |
|        Uploaded 1/12/2024                        |
+--------------------------------------------------+
| [Icon] Total Members               32            |
|        Across 3 groups                           |
+--------------------------------------------------+
| [Icon] Total Downloads             711           |
|        All releases                              |
+--------------------------------------------------+
```

**Mobile Stats Styling:**
- NO card backgrounds
- Horizontal dividers between items
- Icon on left (small, 16x16)
- Label and value on same line
- Description below in smaller text
- Minimal padding (py-2)
- Compact font sizes (text-sm for values, text-xs for descriptions)

#### Tabs Section

**Tab List:**

| Tab | Desktop | Mobile |
|-----|---------|--------|
| Releases | Visible | Visible |
| User Feedback | Visible | Visible |
| Metadata | Visible | Visible |
| Distribution Groups | Visible | Hidden (`hidden md:block`) |

**Tab Styling:**
- Full width on mobile
- Equal width tabs
- Active tab: accent underline/background

---

#### Tab: Releases

**Content Structure:**
```
+--------------------------------------------------+
| v2.1.0                                           |
| [Calendar] 1/14/2024  [Download] 156 downloads   |
| +----------------------------------------------+ |
| |        [Download Build - colored]            | |
| +----------------------------------------------+ |
| +----------------------------------------------+ |
| |            [View Details]                    | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

**Release Card Elements:**

| Element | Style |
|---------|-------|
| Version number | text-lg font-semibold |
| Release date | text-sm text-muted-foreground, Calendar icon |
| Download count | text-sm text-muted-foreground, Download icon |
| Download Build button | Full width, colored by release type, stacked on top |
| View Details button | Full width, outline style, stacked below |

**Button Stacking:**
- Vertical stack (flex-col)
- Download Build on top
- View Details below
- Gap: 0.5rem

**Download Button Colors:**
- Alpha: bg-[#90e0ef] text-[#1a1a1a]
- Beta: bg-[#0077b6] text-white
- Release Candidate: bg-[#03045e] text-white

**View Details Link:**
- `scroll={false}` to prevent scroll jump
- Links to `/releases/[releaseId]`

**Mock Release Data:**
```javascript
{
  id: "release-1",
  version: "2.1.0",
  date: "1/14/2024",
  downloads: 156,
  releaseType: "Beta",
  size: "45.2 MB",
  minOS: "iOS 14.0",
  releaseNotes: "Bug fixes and performance improvements..."
}
```

---

#### Tab: User Feedback

**Placeholder Content:**
- Message: "User feedback will appear here"
- Could include: ratings, comments, crash reports

---

#### Tab: Metadata

**Placeholder Content:**
- App metadata display
- Bundle ID, supported devices, permissions, etc.

---

#### Tab: Distribution Groups (Desktop Only)

**Header:**
```
+--------------------------------------------------+
| Distribution Groups    [+ Create New Distribution Group] |
+--------------------------------------------------+
```

**Group List:**
```
+--------------------------------------------------+
| Beta Testers                                     |
| 12 members                      [Manage Group]   |
+--------------------------------------------------+
| QA Team                                          |
| 8 members                       [Manage Group]   |
+--------------------------------------------------+
```

**"+ Create New Distribution Group" Button:**
- Opens CreateAppGroupSheet component

---

### 6. Create App Distribution Group Sheet

**Trigger:** "+ Create New Distribution Group" button on app details page

**Type:** Sheet component, slides in from right

**Width:** max-w-md (448px), max-w-[95vw] for mobile

#### Form Structure

```
+--------------------------------+
| Create Distribution Group  [X] |
+--------------------------------+
| Group Name *                   |
| [________________________]     |
|                                |
| Add Members *                  |
| [Email address    ] [Role  v] [Add] |
|                                |
| Added Members:                 |
| +----------------------------+ |
| | john@example.com  Manager [X] | |
| | jane@example.com  Tester  [X] | |
| +----------------------------+ |
|                                |
+--------------------------------+
| [Cancel]      [Create Group]   |
+--------------------------------+
```

#### Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Group Name | Text input | Yes | - |
| Email Address | Text input | Yes (for adding) | Validates email format |
| Role | Select | Yes (for adding) | Manager, Tester |

**Role Options:**
- Manager: "Can upload builds, manage groups"
- Tester: "Can view and install apps"

#### Email + Role Layout

- Side by side on desktop (flex-row)
- Email field: flex-1 (takes remaining space)
- Role dropdown: w-[144px] fixed width
- "Add" button: after role dropdown

#### Added Members List

- Scrollable if many members
- Each row: email, role badge, remove (X) button
- Remove button deletes from pending list

#### Footer Buttons

| Button | Style | State |
|--------|-------|-------|
| Create Group | Primary | Disabled until: name entered AND at least 1 member added |
| Cancel | Ghost | Grey default, red on hover |

---

### 7. Upload New Release Sheet

**Trigger:** "Upload New Release" button on app details page

**Type:** Sheet component, slides in from right, multi-step flow

**Width:** max-w-md (448px)

#### Step 1: Upload Build

```
+--------------------------------+
| Upload New Release (1/2)   [X] |
+--------------------------------+
| Release Notes *                |
| +----------------------------+ |
| |                            | |
| |                            | |
| |  [Large textarea with      | |
| |   max-height and scroll]   | |
| |                            | |
| +----------------------------+ |
|                                |
| Upload Build File *            |
| +----------------------------+ |
| |   [Upload icon]            | |
| |   Drop .ipa file here or   | |
| |   click to browse          | |
| +----------------------------+ |
|                                |
+--------------------------------+
| [Cancel]              [Next]   |
+--------------------------------+
```

**Release Notes Field:**
- Textarea with 10 rows
- Max-height: 200px with overflow-y: auto
- Prevents form expansion on long text
- Placeholder: "Enter release notes for this build..."

**Upload Build File:**
- Compact drag & drop zone (reduced padding: p-4)
- Smaller icon (h-8 w-8)
- File type based on app platform:
  - iOS apps: "Drop .ipa file here"
  - Android apps: "Drop .apk file here"

**Drag & Drop States:**
1. Default: Dashed border, muted colors
2. Drag over: Accent border, highlighted background
3. File uploaded: Shows file name, size, checkmark, remove option

**Metadata Extraction (Mock):**
When file uploaded, simulate extracting:
- Version number
- Build number
- Display in UI as confirmation

**Footer Buttons:**
- Next: Disabled until file uploaded AND release notes entered
- Cancel: Grey, red on hover

---

#### Step 2: Select Distribution Groups

```
+--------------------------------+
| Select Distribution Groups [X] |
+--------------------------------+
| Select at least one group to   |
| distribute this release.       |
|                                |
| [ ] Beta Testers (12 members)  |
| [ ] QA Team (8 members)        |
| [ ] Internal Team (5 members)  |
|                                |
| [!] Please select at least one |
|     group (if none selected)   |
|                                |
+--------------------------------+
| [Publish]                      |
| [Back]                         |
| [Cancel]                       |
+--------------------------------+
```

**Distribution Groups List:**
- Checkboxes for each available group
- Group name + member count
- Blue checkbox borders (#0077b6) for dark mode visibility

**Checkbox Styling:**
```css
border: 2px solid #0077b6;
/* Checked state */
background: #0077b6;
border-color: #0077b6;
```

**Validation:**
- At least one group MUST be selected (mandatory)
- Show validation message if none selected
- Publish button disabled until validation passes

**Footer Buttons (Stacked Vertically):**
1. Publish (top): Primary style, disabled until valid
2. Back (middle): Outline style, goes to Step 1
3. Cancel (bottom): Grey, red on hover, closes sheet

**On Publish:**
1. Log release data
2. Close sheet
3. Would add release to list (real implementation)
4. Would send notifications to users in selected groups

---

### 8. Release Details Page (`/releases/[id]`)

#### Layout Structure

```
+--------------------------------------------------+
| [<-] Shopping App v2.1.0 [Beta]   [Download Build] |
+--------------------------------------------------+
| +------------+ +------------+                     |
| | Release    | | Downloads  |                     |
| | Date       | |            |                     |
| +------------+ +------------+                     |
| +------------+ +------------+                     |
| | Build      | | Min OS     |                     |
| | Size       | | Version    |                     |
| +------------+ +------------+                     |
+--------------------------------------------------+
| Release Notes                                     |
| ------------------------------------------------ |
| Bug fixes and performance improvements...         |
+--------------------------------------------------+
| Distribution Groups                               |
| ------------------------------------------------ |
| Beta Testers, QA Team                            |
+--------------------------------------------------+
```

#### Header Section

**Elements:**
- Back button (navigates to app details)
- App name
- Version number
- Release type badge (colored)
- Download Build button (colored by release type)

**Download Button:**
- VISIBLE on ALL screen sizes including mobile
- Mobile: Icon only (Download icon)
- Desktop: Icon + "Download Build" text
- Colors match release type

#### Stats Section

**Desktop:** 2x2 grid of cards
**Mobile:** 2-column grid, compact styling

**Stats:**
1. Release Date (Calendar icon)
2. Downloads (Download icon)
3. Build Size (HardDrive icon)
4. Min OS Version (Smartphone icon)

**Mobile Optimizations:**
- Reduced padding (p-2 instead of p-4)
- Smaller font sizes
- Compact layout

#### Release Notes Section

- Section header: "Release Notes"
- Full text display
- Proper line breaks preserved

#### Distribution Groups Section

- Section header: "Distribution Groups"
- List of group names this release was sent to
- Badge or comma-separated list

#### Scroll Behavior

```javascript
useEffect(() => {
  window.scrollTo(0, 0);
}, [releaseId]);
```

---

### 9. Groups Page (`/groups?org={orgName}`)

#### Layout Structure

```
+--------------------------------------------------+
| Distribution Groups - Finance        [+ New Group] |
+--------------------------------------------------+
| +----------------------------------------------+ |
| | Beta Testers                                 | |
| | 12 members (8 Managers, 4 Testers)          | |
| | 3 linked apps                    [Manage]   | |
| +----------------------------------------------+ |
| +----------------------------------------------+ |
| | QA Team                                      | |
| | 8 members (2 Managers, 6 Testers)           | |
| | 5 linked apps                    [Manage]   | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

#### Header

- Title: "Distribution Groups - {Organization Name}"
- "+ New Group" button (opens CreateGroupSheet)

#### Group Cards

**Each card shows:**
- Group name (prominent)
- Total member count
- Role breakdown (X Managers, Y Testers)
- Total linked apps count
- "Manage Group" button

#### Create Group Sheet

**Fields:**
- Group name (required)
- Description (optional)

#### Manage Group Sheet

**Tabs:**
1. Members
2. Apps

**Members Tab:**
- List of members with: avatar, name, email, role badge, remove button
- "+ Add User" button (opens AddUserSheet)

**Apps Tab:**
- List of linked apps with: icon, name, platform, remove button
- "+ Add Apps" button (opens AddAppsSheet)

---

### 10. Settings Page (`/settings`)

#### Layout Structure

```
+--------------------------------------------------+
| Settings                                          |
+--------------------------------------------------+
| [Profile] [Notifications] [Organizations] [API Tokens] [Billing] |
+--------------------------------------------------+
|                                                  |
|              [Tab Content]                       |
|                                                  |
+--------------------------------------------------+
```

**5 Tabs Total**

---

#### Tab 1: Profile

```
+--------------------------------------------------+
| Profile Information                               |
+--------------------------------------------------+
| First Name                                        |
| [John_________________________]                   |
|                                                  |
| Last Name                                         |
| [Doe__________________________]                   |
|                                                  |
| Email                                            |
| [john@example.com_____________] [Lock icon]      |
| Your email cannot be changed                     |
|                                                  |
| [Change Password]                                |
|                                                  |
+--------------------------------------------------+
| [Save Changes]                                   |
+--------------------------------------------------+
```

**Fields:**

| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| First Name | Text input | Yes | Required |
| Last Name | Text input | Yes | Required |
| Email | Text input | No (disabled) | Lock icon, helper text |
| Change Password | Button | - | Opens password change flow |

---

#### Tab 2: Notifications

```
+--------------------------------------------------+
| Email Notifications                               |
+--------------------------------------------------+
| New Release Notifications              [Toggle]   |
| Get notified when new releases are available     |
|                                                  |
| Download Alerts                        [Toggle]   |
| Receive alerts for download milestones           |
|                                                  |
| Feedback Notifications                 [Toggle]   |
| Get notified about new user feedback             |
|                                                  |
| Weekly Digest                          [Toggle]   |
| Receive weekly summary of app activity           |
+--------------------------------------------------+
| [Save Preferences]                               |
+--------------------------------------------------+
```

**Toggle Switches:**
- Each notification type has on/off toggle
- Description text below each option

---

#### Tab 3: Organizations

```
+--------------------------------------------------+
| Your Organizations              [+ Create Organization] |
+--------------------------------------------------+
| +----------------------------------------------+ |
| | Finance                                      | |
| | Role: Admin                   [Leave] [Manage]| |
| +----------------------------------------------+ |
| +----------------------------------------------+ |
| | Sales                                        | |
| | Role: Member                  [Leave]        | |
| +----------------------------------------------+ |
| +----------------------------------------------+ |
| | Marketing                                    | |
| | Role: Admin                   [Leave] [Manage]| |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

**Header:**
- Title: "Your Organizations"
- "+ Create Organization" button (visible ONLY for Super Admin role)

**Organization Row:**
- Organization name
- User's role in that org
- Action buttons:
  - "Leave" button (always visible if user has access)
  - "Manage" button (visible ONLY for Admin role users)

---

##### Create Organization Sheet (Super Admin Only)

```
+--------------------------------+
| Create Organization        [X] |
+--------------------------------+
| Organization Name *            |
| [________________________]     |
|                                |
| Additional Admin Email         |
| Addresses (Optional)           |
| [________________________]     |
|                                |
| You will be added as an admin  |
| automatically.                 |
|                                |
+--------------------------------+
| [Cancel]    [Create Organization] |
+--------------------------------+
```

**Fields:**
- Organization Name: Required
- Additional Admin Emails: Optional (creator auto-becomes admin)

**Helper Text:**
- "You will be added as an admin automatically."

---

##### Leave Organization Dialog

```
+----------------------------------+
| Leave "Finance"?                 |
+----------------------------------+
| You will lose access to all apps |
| and groups in this organization. |
|                                  |
| Type "Finance" to confirm:       |
| [_____________________________]  |
|                                  |
+----------------------------------+
| [Cancel]    [Leave Organization] |
+----------------------------------+
```

**Validation:**
- Leave button disabled until input matches org name exactly
- Cancel: grey, red on hover
- Leave: red background

---

##### Manage Organization Sheet (Admin Only)

```
+--------------------------------+
| Manage Organization        [X] |
+--------------------------------+
| Organization Name              |
| [Finance____________________]  |
|                                |
| Administrators                 |
| +----------------------------+ |
| | john@example.com    [Remove]| |
| | jane@example.com    [Remove]| |
| +----------------------------+ |
|                                |
| Add Administrator              |
| [Email address______] [Add]    |
|                                |
+--------------------------------+
| [Cancel]       [Save Changes]  |
+--------------------------------+
```

**Sections:**
1. Organization Name (editable)
2. Current Administrators list with Remove buttons
3. Add Administrator input with Add button

---

##### Remove Admin Confirmation Dialog

```
+----------------------------------+
| Remove Admin?                    |
+----------------------------------+
| Are you sure you want to remove  |
| jane@example.com as an admin?    |
|                                  |
+----------------------------------+
| [Cancel]              [Remove]   |
+----------------------------------+
```

**Buttons:**
- Cancel: grey, red on hover
- Remove: red background

---

#### Tab 4: API Tokens

```
+--------------------------------------------------+
| Generate New Token                                |
+--------------------------------------------------+
| Token Name                                        |
| [CI/CD Pipeline_______________]                   |
|                                                  |
| Access Level                                      |
| [Read & Write              v]                    |
|                                                  |
| [Generate Token]                                 |
+--------------------------------------------------+
| Existing Tokens                                   |
+--------------------------------------------------+
| +----------------------------------------------+ |
| | CI Pipeline Token                            | |
| | Read Only | Created: 1/10/2024    [Revoke]   | |
| +----------------------------------------------+ |
| +----------------------------------------------+ |
| | Mobile App Token                             | |
| | Read & Write | Created: 12/5/2023  [Revoke]  | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

**Generate Token Section:**

| Field | Type | Options |
|-------|------|---------|
| Token Name | Text input | Required |
| Access Level | Select | Read Only, Read & Write |

**Existing Tokens List:**
- Token name
- Access level badge
- Created date
- "Revoke" button (turns red on hover)

**On Generate:**
- Would generate and display new token (show once)
- Add to existing tokens list

**On Revoke:**
- Confirmation might be needed
- Remove from list

---

#### Tab 5: Billing

```
+--------------------------------------------------+
| Current Plan                                      |
+--------------------------------------------------+
| +----------------------+ +----------------------+ |
| | FREE                 | | SUBSCRIPTION         | |
| | [Current Plan]       | |                      | |
| +----------------------+ +----------------------+ |
| | 10 builds per app    | | 30 builds per app    | |
| | 4 app placeholders   | | 15 app placeholders  | |
| | 1 organization       | | Unlimited orgs       | |
| | 10 testers per app   | | Unlimited testers    | |
| +----------------------+ +----------------------+ |
| |                      | | [Upgrade]            | |
| +----------------------+ +----------------------+ |
+--------------------------------------------------+
```

**Plan Cards:**

| Feature | Free Tier | Subscription Tier |
|---------|-----------|-------------------|
| Builds per app | 10 | 30 |
| App placeholders | 4 | 15 |
| Organizations | 1 | Unlimited |
| Testers per app | 10 | Unlimited |

**Current Plan Indicator:**
- "Current Plan" badge on active tier

**Action Buttons:**
- Free tier active: "Upgrade" button on Subscription card
- Subscription active: "Manage Billing" button on Subscription card

---

## Mock Data Specifications

### Organizations

```javascript
const organizations = [
  { id: "org-1", name: "Finance" },
  { id: "org-2", name: "Sales" },
  { id: "org-3", name: "Marketing" }
];
```

### Apps (15 total, 5 per organization)

```javascript
const apps = [
  {
    id: "app-1",
    name: "Budget Tracker",
    icon: "💰",
    platform: "iOS",
    version: "2.1.0",
    releaseType: "Beta",
    organization: "finance",
    testers: 24,
    downloads: 156,
    description: "Track your budget and expenses"
  },
  // ... 14 more apps
];
```

**App Distribution:**
- Finance: Budget Tracker, Expense Report, Invoice Manager, Tax Calculator, Financial Dashboard
- Sales: Sales Pipeline, CRM Mobile, Lead Tracker, Quote Generator, Sales Dashboard
- Marketing: Campaign Manager, Analytics App, Social Scheduler, Content Planner, Marketing Dashboard

**Platform Distribution:**
- Mix of iOS and Android apps across organizations

**Release Type Distribution:**
- Mix of Alpha, Beta, and Release Candidate

### Releases (3-5 per app)

```javascript
const releases = [
  {
    id: "release-1",
    appId: "app-1",
    version: "2.1.0",
    date: "1/14/2024",
    downloads: 156,
    releaseType: "Beta",
    size: "45.2 MB",
    minOS: "iOS 14.0",
    releaseNotes: "Bug fixes and performance improvements. Added new dashboard widgets."
  },
  // ... more releases
];
```

### Distribution Groups

```javascript
const groups = [
  {
    id: "group-1",
    name: "Beta Testers",
    organization: "finance",
    members: [
      { email: "john@example.com", role: "Manager" },
      { email: "jane@example.com", role: "Tester" }
    ],
    linkedApps: ["app-1", "app-2", "app-3"]
  },
  // ... more groups
];
```

### Current User

```javascript
const currentUser = {
  id: "user-1",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  role: "super_admin", // or "admin", "manager", "tester"
  organizations: [
    { id: "org-1", name: "Finance", role: "admin" },
    { id: "org-2", name: "Sales", role: "member" },
    { id: "org-3", name: "Marketing", role: "admin" }
  ]
};
```

---

## Accessibility Implementation

### Skip Link

```html
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
  Skip to main content
</a>
```

### ARIA Landmarks

| Element | Role/Attribute |
|---------|---------------|
| Top header | `role="banner"` |
| Sidebar | `role="navigation"`, `aria-label="Main navigation"` |
| Main content | `role="main"`, `id="main-content"` |

### Interactive Elements

| Element | Attributes |
|---------|-----------|
| Buttons | `aria-label` for icon-only buttons |
| Expandable sections | `aria-expanded="true/false"` |
| Current nav item | `aria-current="page"` |
| Required fields | `aria-required="true"` |
| Toggle buttons | `aria-pressed="true/false"` |

### Focus Management

```css
/* Focus visible styles */
.focus-visible:ring-2 {
  outline: none;
  ring-width: 2px;
  ring-color: var(--ring);
  ring-offset-width: 2px;
  ring-offset-color: var(--background);
}
```

### Screen Reader Text

```html
<span className="sr-only">Open menu</span>
```

### Color Contrast

- All text meets WCAG AA 4.5:1 ratio minimum
- Muted text uses #a1a1aa (passes on dark backgrounds)
- Interactive elements have clear focus indicators

---

## Performance Considerations

### Image Optimization

- Use Next.js Image component for optimized loading
- Lazy load images below the fold
- Appropriate sizing for different breakpoints

### Code Splitting

- Each page is a separate route (automatic code splitting)
- Heavy components could be dynamically imported

### State Management

- URL parameters for shareable state (filters, views)
- Local state for ephemeral UI state
- No global state library needed for current scope

---

## Future Considerations

This specification covers the complete wireframe/prototype. For production:

1. **Authentication:** Implement real auth (NextAuth, Clerk, or custom)
2. **Database:** Add PostgreSQL/MySQL with Prisma or Drizzle
3. **File Storage:** S3 or similar for .ipa/.apk files
4. **API Routes:** REST or tRPC endpoints
5. **Real-time:** WebSockets for notifications
6. **Email:** Transactional email service for notifications
7. **Analytics:** Usage tracking and metrics
8. **Testing:** Unit, integration, and E2E tests

---

## Conclusion

This document provides a complete specification for building the DeployMate beta app distribution platform. Follow the design system strictly, implement all pages as specified, and ensure mobile responsiveness is prioritized throughout development.

The mock data structure allows for immediate UI development while the architecture supports easy integration with real backend services when ready.
