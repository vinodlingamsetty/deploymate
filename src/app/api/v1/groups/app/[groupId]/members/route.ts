import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { z } from 'zod'

const addMembersSchema = z.object({
  members: z.array(
    z.object({
      email: z.string().email(),
      role: z.enum(['MANAGER', 'TESTER']),
    }),
  ).min(1),
})

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  if (!params.groupId.trim()) {
    return errorResponse('BAD_REQUEST', 'Invalid group ID', 400)
  }

  const { db } = await import('@/lib/db')

  const group = await db.appDistGroup.findUnique({
    where: { id: params.groupId },
    include: { app: { select: { orgId: true } } },
  })
  if (!group) {
    return errorResponse('NOT_FOUND', 'Group not found', 404)
  }

  // Verify user belongs to the org that owns this app
  const membership = await db.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId: group.app.orgId } },
  })
  if (!membership) {
    return errorResponse('FORBIDDEN', 'You do not have access to this group', 403)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = addMembersSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { members } = parsed.data

  const emails = members.map((m) => m.email)
  const users = await db.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  })

  const userMap = new Map(users.map((u) => [u.email, u.id]))
  const missingEmails = emails.filter((e) => !userMap.has(e))
  if (missingEmails.length > 0) {
    return errorResponse(
      'BAD_REQUEST',
      `Users not found: ${missingEmails.join(', ')}`,
      400,
    )
  }

  await db.appGroupMember.createMany({
    data: members.map((m) => ({
      groupId: params.groupId,
      userId: userMap.get(m.email)!,
      role: m.role,
    })),
    skipDuplicates: true,
  })

  return successResponse({ added: members.length }, 201)
}
