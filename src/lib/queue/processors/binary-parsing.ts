import { Job } from 'bullmq'
import logger from '@/lib/logger'

export interface BinaryParsingJobData {
  releaseId: string
  fileKey: string
  platform: 'IOS' | 'ANDROID'
}

export async function processBinaryParsing(job: Job<BinaryParsingJobData>): Promise<void> {
  const log = logger.child({ job: job.name, releaseId: job.data.releaseId })

  log.info('Starting binary parsing')

  const { getStorageAdapter } = await import('@/lib/storage')
  const { parseBinary } = await import('@/lib/binary-parser')
  const { db } = await import('@/lib/db')

  const storage = getStorageAdapter()
  const fileBuffer = await storage.getBuffer(job.data.fileKey)
  const metadata = parseBinary(fileBuffer, job.data.platform)

  const version = metadata.version ?? '0.0.0'
  const buildNumber = metadata.buildNumber ?? '0'

  await db.release.update({
    where: { id: job.data.releaseId },
    data: {
      version,
      buildNumber,
      fileSize: fileBuffer.length,
      minOSVersion: metadata.minOSVersion,
      extractedBundleId: metadata.bundleId,
      status: 'READY',
    },
  })

  log.info({ version, buildNumber }, 'Binary parsing completed')
}
