import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { isPrismaError } from '@/lib/db'
import { generateInviteToken, getInvitationExpiryDate } from '@/lib/invite-token'
import { sendGroupInvitationEmail } from '@/lib/email'
import logger from '@/lib/logger'
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
    include: { app: { select: { orgId: true, name: true } } },
  })
  if (!group) {
    return errorResponse('NOT_FOUND', 'Group not found', 404)
  }

  // Verify user belongs to the org that owns this app and is a MANAGER+
  const membership = await db.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId: group.app.orgId } },
  })
  if (!membership) {
    return errorResponse('FORBIDDEN', 'You do not have access to this group', 403)
  }
  if (!session.user.isSuperAdmin && membership.role === 'TESTER') {
    return errorResponse('FORBIDDEN', 'Insufficient permissions to add members', 403)
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

  const userMap = new Map(users.map((u) => [u.email.toLowerCase(), u.id]))

  // Get inviter name for email
  const inviter = await db.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, email: true },
  })
  const inviterName =
    inviter?.firstName && inviter?.lastName
      ? `${inviter.firstName} ${inviter.lastName}`
      : (inviter?.email ?? 'Someone')

  const existingMembers = members.filter((m) => userMap.has(m.email.toLowerCase()))
  const newInvites = members.filter((m) => !userMap.has(m.email.toLowerCase()))

  // Add existing users directly
  if (existingMembers.length > 0) {
    await db.appGroupMember.createMany({
      data: existingMembers.map((m) => ({
        groupId: params.groupId,
        userId: userMap.get(m.email.toLowerCase())!,
        role: m.role,
      })),
      skipDuplicates: true,
    })
  }

  // Invite unknown emails
  let invited = 0
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  for (const m of newInvites) {
    const email = m.email.toLowerCase()

    // Check for existing invitation for this group+email
    const existing = await db.groupInvitation.findUnique({
      where: { appGroupId_email: { appGroupId: params.groupId, email } },
    })

    if (existing && existing.status === 'PENDING') {
      // Already has a pending invite — skip
      continue
    }

    const token = generateInviteToken()
    const expiresAt = getInvitationExpiryDate()

    if (existing) {
      // Reset expired/revoked invite
      await db.groupInvitation.update({
        where: { id: existing.id },
        data: { token, expiresAt, status: 'PENDING', invitedById: session.user.id },
      })
    } else {
      try {
        await db.groupInvitation.create({
          data: {
            token,
            email,
            role: m.role,
            appGroupId: params.groupId,
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
    }

    const acceptUrl = `${baseUrl}/invitations/group/${token}/accept`
    try {
      await sendGroupInvitationEmail({
        to: email,
        groupName: group.name,
        contextName: group.app.name,
        inviterName,
        role: m.role.charAt(0) + m.role.slice(1).toLowerCase(),
        acceptUrl,
      })
      invited++
    } catch (err: unknown) {
      logger.warn({ err, email }, 'Failed to send group invitation email')
    }
  }

  return successResponse({ added: existingMembers.length, invited }, 201)
}
