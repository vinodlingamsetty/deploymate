import { Queue } from 'bullmq'
import { isRedisAvailable } from '@/lib/redis'

export const QUEUE_NAMES = {
  BINARY_PARSING: 'binary-parsing',
  NOTIFICATIONS: 'notifications',
} as const

let binaryParsingQueue: Queue | null = null
let notificationQueue: Queue | null = null

function getRedisUrl(): string {
  return process.env.REDIS_URL!
}

export function getBinaryParsingQueue(): Queue | null {
  if (!isRedisAvailable()) return null
  if (binaryParsingQueue) return binaryParsingQueue

  binaryParsingQueue = new Queue(QUEUE_NAMES.BINARY_PARSING, {
    connection: { url: getRedisUrl() },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    },
  })
  return binaryParsingQueue
}

export function getNotificationQueue(): Queue | null {
  if (!isRedisAvailable()) return null
  if (notificationQueue) return notificationQueue

  notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, {
    connection: { url: getRedisUrl() },
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    },
  })
  return notificationQueue
}
