import logger from '@/lib/logger'

let redisInstance: import('ioredis').default | null = null

/**
 * Check if Redis is configured via the REDIS_URL env var.
 */
export function isRedisAvailable(): boolean {
  return !!process.env.REDIS_URL
}

/**
 * Get a singleton Redis (IORedis) connection.
 * Returns null when REDIS_URL is not set — callers should fall back to
 * synchronous/inline behaviour.
 */
export function getRedisConnection(): import('ioredis').default | null {
  if (!isRedisAvailable()) return null

  if (redisInstance) return redisInstance

  // Dynamic require to avoid bundling ioredis when Redis is not configured
  const IORedis = require('ioredis').default as typeof import('ioredis').default
  redisInstance = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null, // required by BullMQ
  })

  redisInstance.on('error', (err) => {
    logger.error({ err }, 'Redis connection error')
  })

  redisInstance.on('connect', () => {
    logger.info('Redis connected')
  })

  return redisInstance
}
