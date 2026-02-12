# Plan: Phase 6 — Organizations & Invitations

## Context

Phase 5 (Distribution Groups) is complete. Phase 6 adds organization CRUD and invitation management — the API backbone that the Settings page (Phase 7) will consume. This is 13 PROGRESS.md items, split into 2 sub-phases plus a sidebar integration step.

The Prisma schema already has all needed models (`Organization`, `Membership`, `Invitation`, `Role` enum, `InvitationStatus` enum). The dashboard layout has a TODO comment for replacing mock orgs with real DB queries.

---

## Sub-Phase Breakdown

### Phase 6a: Organization CRUD + Member Management (8 items)
API endpoints for listing, creating, viewing, updating, deleting organizations, plus member listing, role changes, and member removal.

### Phase 6b: Invitation Endpoints (5 items)
Send invitation, list pending, cancel, accept, and email sending stub.

### Phase 6c: Sidebar Integration
Replace hardcoded mock organizations in dashboard layout with real DB query.

---

## New Utility Files (4)

### `src/lib/org-auth.ts` — Shared org authorization helper

Two functions used by all Phase 6 endpoints:

- `requireOrgMembership(slug, userId)` — Look up org by slug, verify user has any membership. Returns `{ org, membership, db }` or `{ error }`.
- `requireOrgRole(slug, userId, minimumRole, isSuperAdmin)` — Same as above but enforces minimum role. Super Admins bypass role check (treated as ADMIN even without explicit membership).

Role hierarchy: `ADMIN: 3 > MANAGER: 2 > TESTER: 1`

### `src/lib/slug.ts` — Slug generation from org name

```
"Finance Corp" → "finance-corp"
```
Lowercase, replace spaces/underscores with hyphens, strip special chars. Slug collisions caught via P2002 → 409.

### `src/lib/invite-token.ts` — Token generation + expiry

- `generateInviteToken()` → `crypto.randomBytes(32).toString('hex')` (64-char hex)
- `getInvitationExpiryDate()` → `now + 7 days`

### `src/lib/email.ts` — Email sending stub

- `sendInvitationEmail({ to, organizationName, inviterName, role, acceptUrl })` → `console.log` stub
- Real service (Resend/SendGrid/SES) plugged in later

---

## Phase 6a: Organization CRUD + Members

### Files to Create (4)

| File | Handlers | Purpose |
|------|----------|---------|
| `src/app/api/v1/organizations/route.ts` | GET, POST | List user's orgs + Create org (Super Admin) |
| `src/app/api/v1/organizations/[slug]/route.ts` | GET, PATCH, DELETE | Org details, update (Admin), delete (Super Admin) |
| `src/app/api/v1/organizations/[slug]/members/route.ts` | GET | List org members |
| `src/app/api/v1/organizations/[slug]/members/[id]/route.ts` | PATCH, DELETE | Update member role (Admin), remove member (Admin) |

### Endpoint Details

#### `GET /api/v1/organizations`
- Auth required, no role requirement
- `db.membership.findMany({ where: { userId } })` with org details + `_count`
- Returns: `[{ id, name, slug, role, memberCount, appCount, createdAt }]`

#### `POST /api/v1/organizations`
- **Super Admin only** (`session.user.isSuperAdmin`)
- Zod: `{ name: string (1-100), slug?: string (regex: /^[a-z0-9-]+$/) }`
- If slug not provided, generate from name via `generateSlug()`
- `db.$transaction`: create Organization + create Membership(ADMIN) for creator
- P2002 on slug → 409 CONFLICT

#### `GET /api/v1/organizations/:slug`
- Auth + any org membership (via `requireOrgMembership`)
- Return org details with counts

#### `PATCH /api/v1/organizations/:slug`
- Auth + ADMIN role (via `requireOrgRole(..., 'ADMIN', isSuperAdmin)`)
- Zod: `{ name?: string (1-100) }` — slug NOT updatable
- P2002 handling not needed (name is not unique-constrained)

#### `DELETE /api/v1/organizations/:slug?confirm=true`
- **Super Admin only**
- Must have `?confirm=true` query param, else 400
- Cascading delete removes memberships, invitations, apps, groups

#### `GET /api/v1/organizations/:slug/members`
- Auth + any org membership
- `db.membership.findMany({ where: { orgId } })` with user details
- Returns: `[{ id, userId, email, firstName, lastName, avatarUrl, role, createdAt }]`

#### `PATCH /api/v1/organizations/:slug/members/:id`
- Auth + ADMIN role
- Zod: `{ role: 'ADMIN' | 'MANAGER' | 'TESTER' }`
- `:id` is the Membership record ID
- Verify target membership belongs to this org
- **Last admin guard**: If demoting the last ADMIN, reject with error
- Update role, return updated membership

#### `DELETE /api/v1/organizations/:slug/members/:id`
- Auth + ADMIN role
- Verify target membership belongs to this org
- **Last admin guard**: Cannot remove the last ADMIN
- Delete membership record
- Also clean up: remove user from org-level group memberships (`OrgGroupMember` where group belongs to this org)

---

## Phase 6b: Invitation Endpoints

### Files to Create (3)

| File | Handlers | Purpose |
|------|----------|---------|
| `src/app/api/v1/organizations/[slug]/invitations/route.ts` | GET, POST | List pending + Send invitation (Admin) |
| `src/app/api/v1/invitations/[id]/route.ts` | DELETE | Cancel/revoke invitation (Admin) |
| `src/app/api/v1/invitations/[token]/accept/route.ts` | POST | Accept invitation (authenticated user) |

### Endpoint Details

#### `POST /api/v1/organizations/:slug/invitations`
- Auth + ADMIN role
- Zod: `{ email: string (email), role?: 'ADMIN' | 'MANAGER' | 'TESTER' (default: TESTER) }`
- Normalize email to lowercase
- Check: user already a member → 409
- Check: pending invitation already exists for this email+org → 409
- Generate token + expiry date
- Create Invitation record
- Call `sendInvitationEmail()` (console.log stub)
- Return 201 with invitation details (id, email, role, status, expiresAt)

#### `GET /api/v1/organizations/:slug/invitations`
- Auth + ADMIN role
- First: batch-update expired invitations (`expiresAt < now() AND status = PENDING` → set `EXPIRED`)
- Then: query remaining PENDING invitations
- Include `invitedBy` user details
- Returns: `[{ id, email, role, status, invitedBy: { email, firstName, lastName }, expiresAt, createdAt }]`

#### `DELETE /api/v1/invitations/:id`
- Auth required
- Look up invitation by ID → 404 if missing
- Look up org from invitation's `orgId`
- Verify caller is ADMIN of that org
- Must be PENDING status, else 400
- Update status to `REVOKED`
- Return `{ revoked: true }`

#### `POST /api/v1/invitations/:token/accept`
- **Auth required** (user must be logged in — "Public" means no org membership needed, not unauthenticated)
- Look up invitation by token → 404 if missing
- Status checks: ACCEPTED → "already accepted", EXPIRED/REVOKED → appropriate error
- Expiry check: if `expiresAt < now()`, mark EXPIRED and return error
- **Email match**: session user's email must match invitation email (case-insensitive) → 403 if mismatch
- If user already a member of the org → mark invitation ACCEPTED, return success (idempotent)
- `db.$transaction`: create Membership + update Invitation (status=ACCEPTED, acceptedById, acceptedAt)
- Return `{ orgId, orgName, orgSlug, role }`

---

## Phase 6c: Sidebar Integration

### File to Modify (1)

| File | Change |
|------|--------|
| `src/app/(dashboard)/layout.tsx` | Replace hardcoded mock orgs (lines 14-18) with real DB query |

Replace:
```ts
const organizations = [
  { name: 'Finance', slug: 'finance' },
  ...
]
```

With:
```ts
const { db } = await import('@/lib/db')
const memberships = await db.membership.findMany({
  where: { userId: session.user.id },
  include: { org: { select: { name: true, slug: true } } },
  orderBy: { org: { name: 'asc' } },
})
const organizations = memberships.map((m) => ({ name: m.org.name, slug: m.org.slug }))
```

---

## Complete File Inventory

**New files: 11** | **Modified files: 2**

### New Files
| # | File | Phase |
|---|------|-------|
| 1 | `src/lib/org-auth.ts` | 6a |
| 2 | `src/lib/slug.ts` | 6a |
| 3 | `src/lib/invite-token.ts` | 6b |
| 4 | `src/lib/email.ts` | 6b |
| 5 | `src/app/api/v1/organizations/route.ts` | 6a |
| 6 | `src/app/api/v1/organizations/[slug]/route.ts` | 6a |
| 7 | `src/app/api/v1/organizations/[slug]/members/route.ts` | 6a |
| 8 | `src/app/api/v1/organizations/[slug]/members/[id]/route.ts` | 6a |
| 9 | `src/app/api/v1/organizations/[slug]/invitations/route.ts` | 6b |
| 10 | `src/app/api/v1/invitations/[id]/route.ts` | 6b |
| 11 | `src/app/api/v1/invitations/[token]/accept/route.ts` | 6b |

### Modified Files
| # | File | Phase | Change |
|---|------|-------|--------|
| 1 | `src/app/(dashboard)/layout.tsx` | 6c | Replace mock orgs with real DB query |
| 2 | `docs/PROGRESS.md` | all | Mark 13 items done, update stats |

---

## Implementation Order

```
Step 1: Utility files (parallel, no dependencies)
  ├── src/lib/org-auth.ts
  ├── src/lib/slug.ts
  ├── src/lib/invite-token.ts
  └── src/lib/email.ts

Step 2: Org CRUD (depends on org-auth + slug)
  ├── src/app/api/v1/organizations/route.ts
  └── src/app/api/v1/organizations/[slug]/route.ts

Step 3: Member management (depends on org-auth)
  ├── src/app/api/v1/organizations/[slug]/members/route.ts
  └── src/app/api/v1/organizations/[slug]/members/[id]/route.ts

Step 4: Invitations (depends on org-auth + invite-token + email)
  ├── src/app/api/v1/organizations/[slug]/invitations/route.ts
  ├── src/app/api/v1/invitations/[id]/route.ts
  └── src/app/api/v1/invitations/[token]/accept/route.ts

Step 5: Sidebar integration
  └── src/app/(dashboard)/layout.tsx

Step 6: PROGRESS.md update
```

---

## Key Edge Cases

1. **Last admin guard** — Cannot demote or remove the last ADMIN of an org (count remaining ADMINs before action)
2. **Slug collision** — P2002 on org creation → 409 with helpful message
3. **Expired invitations** — Batch-update on list query; check on accept
4. **Re-invitation** — Allow new invitation if previous was REVOKED/EXPIRED
5. **Email match on accept** — Case-insensitive comparison, 403 if mismatch
6. **Self-removal** — Allowed, but last-admin check still applies
7. **Member removal cleanup** — Also delete user's `OrgGroupMember` records for groups in that org

---

## Verification

### After 6a:
1. `pnpm build` + `pnpm lint` clean
2. All org CRUD endpoints respond with correct status codes
3. Super Admin guard works on POST/DELETE org
4. Admin guard works on PATCH org, PATCH/DELETE members
5. Last admin protection prevents demotion/removal

### After 6b:
1. `pnpm build` + `pnpm lint` clean
2. Invitation send creates record + logs email to console
3. List shows only PENDING (expired ones auto-updated)
4. Cancel sets status to REVOKED
5. Accept creates membership + updates invitation
6. Email mismatch on accept returns 403

### After 6c:
1. `pnpm build` + `pnpm lint` clean
2. Sidebar shows real organizations from DB (empty if no memberships)
3. Existing pages still work with org query params
