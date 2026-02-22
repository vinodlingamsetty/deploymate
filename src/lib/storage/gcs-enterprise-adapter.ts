import { Storage } from '@google-cloud/storage'
import type { Bucket, File } from '@google-cloud/storage'
import type { FileMetadata, SignedUrlOptions, StorageAdapter, UploadResult } from './types'

const DISTRIBUTION_PREFIXES = ['releases/', 'manifests/'] as const
const APP_PREFIXES = ['icons/', 'temp-uploads/', 'backups/'] as const

function startsWithAny(value: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => value.startsWith(prefix))
}

function isDistributionKey(key: string): boolean {
  return startsWithAny(key, DISTRIBUTION_PREFIXES)
}

function isAppKey(key: string): boolean {
  return startsWithAny(key, APP_PREFIXES)
}

/**
 * Enterprise dual-bucket adapter for GCP environments with restricted internal
 * storage and externally reachable distribution artifacts.
 */
export class GCSEnterpriseStorageAdapter implements StorageAdapter {
  readonly provider = 'gcp-enterprise' as const
  private readonly storage: Storage
  private readonly appBucketName: string
  private readonly distributionBucketName: string

  constructor() {
    const appBucketName = process.env.GCS_APP_BUCKET
    if (!appBucketName) throw new Error('GCS_APP_BUCKET environment variable is required')
    this.appBucketName = appBucketName

    const distributionBucketName = process.env.GCS_DISTRIBUTION_BUCKET
    if (!distributionBucketName) {
      throw new Error('GCS_DISTRIBUTION_BUCKET environment variable is required')
    }
    this.distributionBucketName = distributionBucketName

    const credentials = process.env.GCS_CREDENTIALS
      ? (JSON.parse(process.env.GCS_CREDENTIALS) as Record<string, unknown>)
      : undefined

    this.storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      ...(process.env.GCS_KEY_FILE ? { keyFilename: process.env.GCS_KEY_FILE } : {}),
      ...(credentials ? { credentials } : {}),
    })
  }

  private get appBucket(): Bucket {
    return this.storage.bucket(this.appBucketName)
  }

  private get distributionBucket(): Bucket {
    return this.storage.bucket(this.distributionBucketName)
  }

  private resolveBucketForKey(key: string): Bucket {
    if (isDistributionKey(key)) return this.distributionBucket
    if (isAppKey(key)) return this.appBucket
    // Default to app bucket for safety to avoid accidental public placement.
    return this.appBucket
  }

  private resolveFile(key: string): File {
    return this.resolveBucketForKey(key).file(key)
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<UploadResult> {
    await this.resolveFile(key).save(data, { contentType })
    return { key, size: data.length }
  }

  async getSignedDownloadUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const [url] = await this.resolveFile(key).getSignedUrl({
      action: 'read',
      expires: Date.now() + (options?.expiresIn ?? 3600) * 1000,
      ...(options?.downloadFilename
        ? { responseDisposition: `attachment; filename="${options.downloadFilename}"` }
        : {}),
    })
    return url
  }

  async getSignedUploadUrl(key: string, contentType: string, options?: SignedUrlOptions): Promise<string> {
    const [url] = await this.resolveFile(key).getSignedUrl({
      action: 'write',
      expires: Date.now() + (options?.expiresIn ?? 3600) * 1000,
      contentType,
    })
    return url
  }

  async delete(key: string): Promise<void> {
    try {
      await this.resolveFile(key).delete()
    } catch (err) {
      if ((err as { code?: number }).code === 404) return
      throw err
    }
  }

  async exists(key: string): Promise<boolean> {
    const [exists] = await this.resolveFile(key).exists()
    return exists
  }

  async getBuffer(key: string): Promise<Buffer> {
    const [contents] = await this.resolveFile(key).download()
    return Buffer.from(contents)
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const [metadata] = await this.resolveFile(key).getMetadata()
      return {
        key,
        size: Number(metadata.size ?? 0),
        contentType: (metadata.contentType as string) ?? 'application/octet-stream',
        lastModified: new Date(metadata.updated as string),
      }
    } catch (err) {
      if ((err as { code?: number }).code === 404) return null
      throw err
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    const sourceFile = this.resolveFile(sourceKey)
    const destinationFile = this.resolveFile(destinationKey)
    await sourceFile.copy(destinationFile)
  }

  async list(prefix: string, maxResults?: number): Promise<string[]> {
    const bucket = isDistributionKey(prefix) ? this.distributionBucket : this.appBucket
    const [files] = await bucket.getFiles({
      prefix,
      ...(maxResults !== undefined ? { maxResults } : {}),
    })
    return files.map((file) => file.name)
  }
}
