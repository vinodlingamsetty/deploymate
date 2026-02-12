import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const createOrgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens')
    .optional(),
})

export async function GET(): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { db } = await import('@/lib/db')

  const memberships = await db.membership.findMany({
    where: { userId: session.user.id },
    include: {
      org: {
        include: {
          _count: {
            select: {
              memberships: true,
              apps: true,
            },
          },
        },
      },
    },
    orderBy: { org: { name: 'asc' } },
  })

  const organizations = memberships.map(({ org, role }) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    role,
    memberCount: org._count.memberships,
    appCount: org._count.apps,
    createdAt: org.createdAt,
  }))

  return successResponse(organizations)
}

export async function POST(request: NextRequest): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  if (!session.user.isSuperAdmin) {
    return errorResponse('FORBIDDEN', 'Super Admin access required', 403)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = createOrgSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { name, slug: providedSlug } = parsed.data

  const { generateSlug } = await import('@/lib/slug')
  const slug = providedSlug ?? generateSlug(name)

  const { db } = await import('@/lib/db')

  try {
    const org = await db.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: { name, slug },
        select: { id: true, name: true, slug: true, createdAt: true },
      })

      await tx.membership.create({
        data: {
          userId: session.user.id,
          orgId: created.id,
          role: 'ADMIN',
        },
      })

      return created
    })

    return successResponse(org, 201)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return errorResponse('CONFLICT', 'An organization with this slug already exists', 409)
    }
    throw e
  }
}
