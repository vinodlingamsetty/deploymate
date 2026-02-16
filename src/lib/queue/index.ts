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
  })
  return binaryParsingQueue
}

export function getNotificationQueue(): Queue | null {
  if (!isRedisAvailable()) return null
  if (notificationQueue) return notificationQueue

  notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, {
    connection: { url: getRedisUrl() },
  })
  return notificationQueue
}
