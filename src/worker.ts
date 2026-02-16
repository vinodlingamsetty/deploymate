/**
 * Standalone BullMQ worker process.
 * Run with: tsx src/worker.ts (dev) or node dist/worker.js (prod)
 *
 * Requires REDIS_URL to be set — exits with error if missing.
 */
import { Worker } from 'bullmq'
import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
})

if (!process.env.REDIS_URL) {
  logger.fatal('REDIS_URL is required to run the worker')
  process.exit(1)
}

const connection = { url: process.env.REDIS_URL }

// CPU-intensive binary parsing; limited to prevent resource exhaustion
const binaryWorker = new Worker(
  'binary-parsing',
  async (job) => {
    const { processBinaryParsing } = await import('./lib/queue/processors/binary-parsing')
    return processBinaryParsing(job)
  },
  { connection, concurrency: 2 },
)

binaryWorker.on('completed', (job) => {
  logger.info({ jobId: job?.id, queue: 'binary-parsing' }, 'Job completed')
})

binaryWorker.on('failed', (job, err) => {
  logger.error(
    {
      jobId: job?.id,
      queue: 'binary-parsing',
      error: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      attemptsMade: job?.attemptsMade,
    },
    'Job failed'
  )
})

// I/O-bound email sending; higher concurrency for throughput
const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { processNotifications } = await import('./lib/queue/processors/notifications')
    return processNotifications(job)
  },
  { connection, concurrency: 5 },
)

notificationWorker.on('completed', (job) => {
  logger.info({ jobId: job?.id, queue: 'notifications' }, 'Job completed')
})

notificationWorker.on('failed', (job, err) => {
  logger.error(
    {
      jobId: job?.id,
      queue: 'notifications',
      error: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      attemptsMade: job?.attemptsMade,
    },
    'Job failed'
  )
})

logger.info('Worker started — listening for jobs on binary-parsing and notifications queues')

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down workers...')

  const closePromises = Promise.all([
    binaryWorker.close(),
    notificationWorker.close(),
  ])

  try {
    await Promise.race([
      closePromises,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Shutdown timeout after 25s')), 25000)
      ),
    ])
    logger.info('Workers shut down gracefully')
  } catch (err) {
    logger.error({ err }, 'Shutdown timeout or error, forcing exit')
  }

  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
