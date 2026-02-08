# DeployMate - Claude Code Instructions

## Project Overview

DeployMate is an open-source, self-hosted platform for distributing beta iOS (.ipa) and Android (.apk) apps to testers. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, and NextAuth.js v5.

## Key Reference Documents

| Document | Purpose |
|----------|---------|
| `docs/PROGRESS.md` | **Implementation checklist — mark `[x]` when a feature is done** |
| `docs/deploymate-requirements.md` | Architecture, API spec, database schema |
| `docs/DeployMate-Specification.md` | UI wireframes, layouts, interactions |
| `docs/technical-implementation-details.md` | iOS OTA, APK install, binary parsing details |
| `.cursor/rules.md` | Coding patterns, TypeScript rules, component templates |
| `prisma/schema.prisma` | Database models |

## Progress Tracking

After completing any feature:
1. Read `docs/PROGRESS.md`
2. Find the relevant checkbox item
3. Change `- [ ]` to `- [x]`
4. Update the Quick Stats table at the bottom
5. This file is shared between Claude Code and Cursor — keep it in sync

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript strict
- **Styling:** Tailwind CSS v3, shadcn/ui, Lucide React icons
- **Fonts:** Space Grotesk (sans), Courier Prime (mono)
- **Database:** PostgreSQL via Prisma
- **Auth:** NextAuth.js v5, credentials provider, JWT, Argon2 hashing
- **Validation:** Zod + React Hook Form
- **Primary color:** #0077b6

## Important Rules

- Server Components by default; `'use client'` only when hooks/browser APIs are needed
- Mobile-first CSS (no prefix = mobile, `md:` = tablet+)
- No `any` types — use `unknown` and narrow
- All API responses: `{ data, meta }` or `{ error: { code, message } }`
- Versioned API routes under `/api/v1/`
- No billing features — this is open source only
- Organizations are invite-only — no public registration into orgs
- Settings page has exactly 4 tabs: Profile, Notifications, Organizations, API Tokens
- Release type badge colors: Alpha=#90e0ef, Beta=#0077b6, RC=#03045e

## Common Commands

```bash
pnpm dev           # Start dev server
pnpm build         # Production build
pnpm lint          # Lint
npx prisma studio  # Open Prisma Studio
npx prisma migrate dev  # Run migrations
```
