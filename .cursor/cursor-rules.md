# DeployMate - Cursor/AI IDE Development Rules

> **Location:** Place this file at `.cursor/rules.md` in your project root
> **Purpose:** Complete context for AI-assisted development
> **Version:** 2.0 (Final)

---

## 1. Project Context

**DeployMate** is an open-source, self-hosted platform for distributing beta iOS and Android applications to testers.

| Aspect | Decision |
|--------|----------|
| License | Apache 2.0 (open source) |
| Hosting | Self-hosted only (no managed SaaS) |
| Storage | BYOC - AWS S3, GCP, Azure, Salesforce, Local |
| Architecture | Monorepo with Next.js |
| Organization Model | Invite-only (no self-registration to orgs) |

---

## 2. Technology Stack (Exact Versions - DO NOT DEVIATE)

```json
{
  "framework": "Next.js 14.1+ (App Router)",
  "language": "TypeScript 5.3+ (strict: true)",
  "styling": "Tailwind CSS v4",
  "components": "shadcn/ui",
  "database": "PostgreSQL 15+ via Prisma 5.9+",
  "auth": "NextAuth.js v5 (Auth.js)",
  "validation": "Zod 3.22+",
  "forms": "React Hook Form 7.50+",
  "icons": "Lucide React",
  "passwords": "Argon2 via @node-rs/argon2",
  "fonts": "Space Grotesk (UI), Courier Prime (mono)"
}
```

**DO NOT** introduce other libraries without explicit approval from the user.

---

## 3. Project Structure (FOLLOW EXACTLY)

```
deploymate/
├── apps/web/                         # Next.js application
│   └── src/
│       ├── app/                      # App Router
│       │   ├── (auth)/               # Unauthenticated pages
│       │   │   └── login/page.tsx
│       │   ├── (dashboard)/          # Authenticated pages
│       │   │   ├── layout.tsx        # Dashboard shell
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── apps/[id]/page.tsx
│       │   │   ├── releases/[id]/page.tsx
│       │   │   ├── groups/page.tsx
│       │   │   └── settings/page.tsx
│       │   ├── api/v1/               # REST API (versioned)
│       │   │   ├── apps/
│       │   │   ├── releases/
│       │   │   ├── organizations/
│       │   │   ├── groups/
│       │   │   ├── users/
│       │   │   └── tokens/
│       │   ├── layout.tsx            # Root layout
│       │   ├── page.tsx              # Redirects to /login
│       │   └── globals.css           # Tailwind + tokens
│       │
│       ├── components/
│       │   ├── ui/                   # shadcn/ui (DO NOT MODIFY)
│       │   ├── layout/               # Sidebar, Header
│       │   ├── apps/                 # App-related
│       │   ├── releases/             # Release-related
│       │   ├── groups/               # Group-related
│       │   ├── settings/             # Settings-related
│       │   └── forms/                # Form components
│       │
│       ├── lib/
│       │   ├── db.ts                 # Prisma singleton
│       │   ├── auth.ts               # NextAuth config
│       │   ├── auth-utils.ts         # Auth helpers
│       │   ├── permissions.ts        # Permission checks
│       │   ├── storage.ts            # Storage adapter
│       │   ├── api-utils.ts          # API response helpers
│       │   ├── validations.ts        # Zod schemas
│       │   └── utils.ts              # cn(), formatDate(), etc.
│       │
│       ├── hooks/                    # Custom React hooks
│       ├── types/                    # TypeScript types
│       └── config/                   # Constants, env config
│
├── packages/
│   ├── database/                     # Prisma schema
│   ├── storage-adapters/             # S3, GCS, Azure, etc.
│   └── binary-parser/                # IPA/APK parsing
│
├── docker/
├── docs/
└── package.json                      # Workspace root
```

---

## 4. TypeScript Rules (MANDATORY)

```typescript
// ✅ ALWAYS: Explicit return types
async function getUser(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}

// ✅ ALWAYS: Explicit parameter types  
function createApp(data: CreateAppInput, userId: string): Promise<App> {
  // implementation
}

// ✅ ALWAYS: Interface for object shapes
interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isSuperAdmin: boolean;
}

// ✅ ALWAYS: Type for unions
type Platform = 'IOS' | 'ANDROID';
type ReleaseType = 'ALPHA' | 'BETA' | 'RELEASE_CANDIDATE';
type Role = 'ADMIN' | 'MANAGER' | 'TESTER';

// ❌ NEVER: any type
function bad(data: any) { }  // FORBIDDEN

// ❌ NEVER: Implicit any
function bad(data) { }  // FORBIDDEN

// ✅ INSTEAD: Use unknown and narrow
function process(data: unknown): string {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  throw new Error('Expected string');
}
```

---

## 5. React/Next.js Rules

```tsx
// ✅ Server Components by default (NO directive)
// app/(dashboard)/apps/page.tsx
export default async function AppsPage() {
  const session = await getServerSession();
  const apps = await db.app.findMany({
    where: { org: { memberships: { some: { userId: session.user.id } } } }
  });
  return <AppGrid apps={apps} />;
}

// ✅ Client Components ONLY when needed (hooks, browser APIs)
// components/apps/app-search.tsx
'use client';
import { useState } from 'react';

export function AppSearch({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');
  return (
    <input 
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        onSearch(e.target.value);
      }}
    />
  );
}

// ✅ Server Actions for mutations
// app/actions/apps.ts
'use server';
import { revalidatePath } from 'next/cache';

export async function createApp(formData: FormData) {
  const session = await getServerSession();
  if (!session) throw new Error('Unauthorized');
  
  // Create app...
  revalidatePath('/dashboard');
}

// ❌ NEVER: Fetch in useEffect when Server Component works
// ❌ NEVER: 'use client' without actual need
```

---

## 6. Styling Rules (Tailwind CSS)

```tsx
// ✅ Mobile-first (no prefix = mobile)
<div className="p-4 md:p-6 lg:p-8">
<div className="flex flex-col md:flex-row gap-4">
<Button className="w-full md:w-auto">

// ✅ Use CSS variables for design tokens
<button className="bg-primary text-primary-foreground">

// ✅ Release type colors (EXACT values from v0 spec)
const releaseStyles = {
  ALPHA: 'bg-[#90e0ef] text-[#1a1a1a]',           // Light blue
  BETA: 'bg-[#0077b6] text-white',                 // Medium blue
  RELEASE_CANDIDATE: 'bg-[#03045e] text-white',    // Dark blue
};

// ✅ Cancel button pattern (grey → red on hover)
<Button 
  variant="ghost"
  className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500"
>
  Cancel
</Button>

// ✅ Checkbox with visible border in dark mode
<Checkbox className="border-2 border-[#0077b6] data-[state=checked]:bg-[#0077b6]" />

// ❌ NEVER: Arbitrary values without strong reason
<div className="p-[13px]">  // Use scale: p-3 or p-4

// ❌ NEVER: Inline styles
<div style={{ padding: 16 }}>  // Use Tailwind
```

---

## 7. API Route Template (COPY THIS PATTERN)

```typescript
// app/api/v1/apps/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/permissions';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-utils';

// 1. Define validation schema
const createAppSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  platform: z.enum(['ios', 'android']),
  orgId: z.string().cuid(),
  description: z.string().max(1000).optional(),
});

// GET /api/v1/apps - List apps
export async function GET(request: NextRequest) {
  // Step 1: Authenticate
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  // Step 2: Parse query parameters
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') || '20')));
  const orgSlug = searchParams.get('org');
  const search = searchParams.get('search');

  // Step 3: Build query with permission filtering
  const where = {
    org: {
      memberships: { some: { userId: auth.user.id } },
      ...(orgSlug && { slug: orgSlug }),
    },
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };

  // Step 4: Execute query
  const [apps, total] = await Promise.all([
    db.app.findMany({
      where,
      include: {
        org: { select: { id: true, name: true, slug: true } },
        releases: { take: 1, orderBy: { createdAt: 'desc' } },
        _count: { select: { releases: true } },
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    }),
    db.app.count({ where }),
  ]);

  // Step 5: Return paginated response
  return paginatedResponse(apps, page, perPage, total);
}

// POST /api/v1/apps - Create app
export async function POST(request: NextRequest) {
  // Step 1: Authenticate
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  // Step 2: Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const validation = createAppSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse('VALIDATION_ERROR', 'Invalid input', 400, validation.error.issues);
  }

  // Step 3: Check permissions
  const membership = await db.membership.findFirst({
    where: { userId: auth.user.id, orgId: validation.data.orgId },
  });

  if (!membership) {
    return errorResponse('FORBIDDEN', 'Not a member of this organization', 403);
  }

  if (!hasPermission('app:create', membership.role, auth.user.isSuperAdmin)) {
    return errorResponse('FORBIDDEN', 'No permission to create apps', 403);
  }

  // Step 4: Create resource
  try {
    const app = await db.app.create({
      data: {
        name: validation.data.name,
        platform: validation.data.platform.toUpperCase() as 'IOS' | 'ANDROID',
        orgId: validation.data.orgId,
        description: validation.data.description,
      },
      include: { org: true },
    });

    return successResponse(app);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return errorResponse('CONFLICT', 'App already exists', 409);
    }
    throw error;
  }
}
```

---

## 8. Response Format Standards

```typescript
// lib/api-utils.ts

import { NextResponse } from 'next/server';

// Success response
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

// Error response
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details && { details }) } },
    { status }
  );
}

// Paginated response
export function paginatedResponse<T>(
  data: T[],
  page: number,
  perPage: number,
  total: number
) {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
      hasMore: page * perPage < total,
    },
  });
}
```

---

## 9. Permission System

```typescript
// lib/permissions.ts

import type { Role } from '@prisma/client';

type Permission =
  | 'org:create' | 'org:delete' | 'org:update' | 'org:invite' | 'org:remove_member'
  | 'app:create' | 'app:update' | 'app:delete' | 'app:view'
  | 'release:upload' | 'release:delete' | 'release:download'
  | 'group:create_app' | 'group:create_org' | 'group:delete' | 'group:manage_members'
  | 'feedback:submit' | 'feedback:view_all';

const PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'org:update', 'org:invite', 'org:remove_member',
    'app:create', 'app:update', 'app:delete', 'app:view',
    'release:upload', 'release:delete', 'release:download',
    'group:create_app', 'group:create_org', 'group:delete', 'group:manage_members',
    'feedback:submit', 'feedback:view_all',
  ],
  MANAGER: [
    'app:update', 'app:view',
    'release:upload', 'release:delete', 'release:download',
    'group:create_app', 'group:manage_members',
    'feedback:submit', 'feedback:view_all',
  ],
  TESTER: [
    'app:view', 'release:download', 'feedback:submit',
  ],
};

const SUPER_ADMIN_ONLY: Permission[] = ['org:create', 'org:delete'];

export function hasPermission(
  permission: Permission,
  role: Role | null,
  isSuperAdmin: boolean
): boolean {
  // Super admin has all permissions
  if (isSuperAdmin) return true;
  
  // Check super admin only permissions
  if (SUPER_ADMIN_ONLY.includes(permission)) return false;
  
  // Check role permissions
  if (!role) return false;
  return PERMISSIONS[role]?.includes(permission) ?? false;
}
```

---

## 10. Form Component Pattern (COPY THIS)

```tsx
// components/forms/example-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// 1. Define schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof formSchema>;

// 2. Define props
interface ExampleFormProps {
  onSuccess?: (data: FormData) => void;
  onCancel?: () => void;
}

// 3. Implement component
export function ExampleForm({ onSuccess, onCancel }: ExampleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Something went wrong');
      }

      onSuccess?.(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register('name')}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
```

---

## 11. Accessibility Checklist (MANDATORY)

Every component MUST have:

```tsx
// ✅ Labels for all inputs
<Label htmlFor="email">Email</Label>
<Input id="email" />

// ✅ Error messages linked to inputs
<Input aria-invalid={!!error} aria-describedby="email-error" />
{error && <p id="email-error">{error}</p>}

// ✅ Aria labels for icon-only buttons
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// ✅ Focus management in dialogs
<Dialog>
  <DialogContent aria-labelledby="dialog-title">
    <DialogTitle id="dialog-title">Title</DialogTitle>
  </DialogContent>
</Dialog>

// ✅ Keyboard navigation
// - All interactive elements focusable via Tab
// - Escape closes modals
// - Enter submits forms
```

---

## 12. What NOT To Do (VIOLATIONS)

```typescript
// ❌ VIOLATION: Using 'any'
const data: any = await response.json();

// ❌ VIOLATION: Missing error handling
const data = await response.json();  // What if network fails?

// ❌ VIOLATION: Client component without need
'use client';  // But no hooks or browser APIs used

// ❌ VIOLATION: Hardcoded colors
<div className="bg-[#ff5500]">  // Use design tokens

// ❌ VIOLATION: Missing accessibility
<button><X /></button>  // No aria-label

// ❌ VIOLATION: Not following mobile-first
<div className="md:p-4 p-8">  // Wrong order: should be p-4 md:p-8

// ❌ VIOLATION: Introducing unlisted dependencies
import someLibrary from 'random-library';  // Not in tech stack!

// ❌ VIOLATION: Changing patterns without asking
// Existing code uses X pattern, but AI uses Y pattern
```

---

## 13. When AI MUST Ask for Clarification

**STOP and ask the user when:**

1. The request conflicts with any documented decision
2. Multiple valid approaches exist (present options)
3. Security implications are unclear
4. The request would modify existing patterns
5. The scope is ambiguous ("make it better")
6. Third-party services not in tech stack are needed
7. The file might already exist (check first!)
8. Performance trade-offs need human decision

**Example question format:**

```
Before proceeding, I need clarification:

1. [Specific question about the request]

2. I see two approaches:
   - Option A: [Description + pros/cons]
   - Option B: [Description + pros/cons]
   
   Which would you prefer?

3. [Any concerns or blockers]
```

---

## 14. Reference Documents

| Document | Purpose |
|----------|---------|
| `deploymate-requirements-v2.md` | Architecture, API spec, database schema |
| `DeployMate-Specification.md` | UI wireframes, layouts, interactions |
| `.cursor/rules.md` (this file) | AI coding rules |
| `packages/database/prisma/schema.prisma` | Database models |

**ALWAYS check these before implementing anything.**

---

## 15. Pre-Implementation Checklist

Before writing ANY code, verify:

```
□ Read the relevant section in requirements doc
□ Check if similar code exists (don't duplicate)
□ Confirm file location matches project structure
□ Identify all types needed
□ Plan error handling
□ Plan loading states
□ Plan accessibility requirements
□ Plan mobile responsiveness
```

---

*This file is the source of truth for AI development. Follow it exactly.*
