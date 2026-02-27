import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { isPrismaError } from '@/lib/db'
import { requireAppRole } from '@/lib/permissions'
import { generateInviteToken, getInvitationExpiryDate } from '@/lib/invite-token'
import { sendGroupInvitationEmail } from '@/lib/email'
import logger from '@/lib/logger'
import { z } from 'zod'

const memberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['MANAGER', 'TESTER']),
})

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  members: z.array(memberSchema).default([]),
})

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { db } = await import('@/lib/db')

  const app = await db.app.findUnique({
    where: { id: params.id },
    select: { id: true, orgId: true },
  })
  if (!app) {
    return errorResponse('NOT_FOUND', 'App not found', 404)
  }

  // Verify user belongs to the org that owns this app
  const membership = await db.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId: app.orgId } },
  })
  if (!membership) {
    return errorResponse('FORBIDDEN', 'You do not have access to this app', 403)
  }

  const groups = await db.appDistGroup.findMany({
    where: { appId: params.id },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const data = groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    memberCount: g._count.members,
    createdAt: g.createdAt.toISOString(),
  }))

  return successResponse(data)
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const roleResult = await requireAppRole(params.id, session.user.id, 'MANAGER', session.user.isSuperAdmin)
  if (roleResult.error) return roleResult.error

  const { db } = await import('@/lib/db')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = createGroupSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request',
      400,
    )
  }

  const { name, description, members } = parsed.data

  // Look up app for name + org info
  const app = await db.app.findUnique({
    where: { id: params.id },
    select: { name: true, orgId: true },
  })
  if (!app) {
    return errorResponse('NOT_FOUND', 'App not found', 404)
  }

  // Look up users by email
  const emails = members.map((m) => m.email)
  const users = emails.length > 0
    ? await db.user.findMany({
        where: { email: { in: emails } },
        select: { id: true, email: true },
      })
    : []

  const userMap = new Map(users.map((u) => [u.email.toLowerCase(), u.id]))
  const existingMembers = members.filter((m) => userMap.has(m.email.toLowerCase()))
  const newInvites = members.filter((m) => !userMap.has(m.email.toLowerCase()))

  let group: { id: string; name: string; description: string | null; _count: { members: number }; createdAt: Date }

  try {
    group = await db.appDistGroup.create({
      data: {
        appId: params.id,
        name,
        description: description ?? null,
        members: existingMembers.length > 0
          ? {
              create: existingMembers.map((m) => ({
                userId: userMap.get(m.email.toLowerCase())!,
                role: m.role,
              })),
            }
          : undefined,
      },
      include: { _count: { select: { members: true } } },
    })
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2002')) {
      return errorResponse('CONFLICT', 'A group with this name already exists for this app', 409)
    }
    throw err
  }

  // Send invites for unknown emails
  if (newInvites.length > 0) {
    const inviter = await db.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true, email: true },
    })
    const inviterName =
      inviter?.firstName && inviter?.lastName
        ? `${inviter.firstName} ${inviter.lastName}`
        : (inviter?.email ?? 'Someone')

    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    for (const m of newInvites) {
      const email = m.email.toLowerCase()
      const token = generateInviteToken()
      const expiresAt = getInvitationExpiryDate()

      try {
        await db.groupInvitation.create({
          data: {
            token,
            email,
            role: m.role,
            appGroupId: group.id,
            invitedById: session.user.id,
            expiresAt,
          },
        })
      } catch (err: unknown) {
        // Race condition: another concurrent request created the same invite
        if (isPrismaError(err, 'P2002')) {
          continue
        }
        throw err
      }

      const acceptUrl = `${baseUrl}/invitations/group/${token}/accept`
      try {
        await sendGroupInvitationEmail({
          to: email,
          groupName: name,
          contextName: app.name,
          inviterName,
          role: m.role.charAt(0) + m.role.slice(1).toLowerCase(),
          acceptUrl,
        })
      } catch (err: unknown) {
        logger.warn({ err, email }, 'Failed to send group invitation email')
      }
    }
  }

  return successResponse(
    {
      id: group.id,
      name: group.name,
      description: group.description,
      memberCount: group._count.members,
      createdAt: group.createdAt.toISOString(),
    },
    201,
  )
}
