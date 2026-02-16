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

  // TODO: Send actual emails when email service is configured.
  // For now, log the notification intent for each user.
  for (const userId of userIds) {
    log.info(
      { userId, appName: job.data.appName, version: job.data.version },
      'Notification: new release available',
    )
  }
}
