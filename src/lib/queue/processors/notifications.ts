import { Job } from 'bullmq'
import logger from '@/lib/logger'

export interface NotificationJobData {
  releaseId: string
  appName: string
  version: string
  distributionGroups: Array<{ id: string; type: 'app' | 'org' }>
}

export async function processNotifications(job: Job<NotificationJobData>): Promise<void> {
  const log = logger.child({ job: job.name, releaseId: job.data.releaseId })

  log.info('Processing release notifications')

  const { resolveGroupMembers } = await import('@/lib/group-resolver')

  const userIds = await resolveGroupMembers(job.data.distributionGroups)

  log.info(
    { userCount: userIds.length, groupCount: job.data.distributionGroups.length },
    'Resolved group members for notification',
  )

  const { db } = await import('@/lib/db')
  const { sendNewReleaseEmail } = await import('@/lib/email')

  for (const userId of userIds) {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })

      if (!user) {
        log.warn({ userId }, 'User not found, skipping notification')
        continue
      }

      await sendNewReleaseEmail({
        to: user.email,
        appName: job.data.appName,
        version: job.data.version,
      })
    } catch (err) {
      log.error({ err, userId }, 'Failed to send notification email, continuing')
    }
  }
}
