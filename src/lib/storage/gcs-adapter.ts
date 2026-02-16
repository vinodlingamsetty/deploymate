import { Storage } from '@google-cloud/storage'
import type { FileMetadata, SignedUrlOptions, StorageAdapter, UploadResult } from './types'

export class GCSStorageAdapter implements StorageAdapter {
  readonly provider = 'gcp-storage' as const
  private readonly storage: Storage
  private readonly bucketName: string

  constructor() {
    const bucketName = process.env.GCS_BUCKET
    if (!bucketName) throw new Error('GCS_BUCKET environment variable is required')
    this.bucketName = bucketName

    const credentials = process.env.GCS_CREDENTIALS
      ? (JSON.parse(process.env.GCS_CREDENTIALS) as Record<string, unknown>)
      : undefined

    this.storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      ...(process.env.GCS_KEY_FILE ? { keyFilename: process.env.GCS_KEY_FILE } : {}),
      ...(credentials ? { credentials } : {}),
    })
  }

  private get bucket() {
    return this.storage.bucket(this.bucketName)
  }

  private file(key: string) {
    return this.bucket.file(key)
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<UploadResult> {
    const file = this.file(key)
    await file.save(data, { contentType })
    return { key, size: data.length }
  }

  async getSignedDownloadUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const [url] = await this.file(key).getSignedUrl({
      action: 'read',
      expires: Date.now() + (options?.expiresIn ?? 3600) * 1000,
      ...(options?.downloadFilename
        ? { responseDisposition: `attachment; filename="${options.downloadFilename}"` }
        : {}),
    })
    return url
  }

  async getSignedUploadUrl(key: string, contentType: string, options?: SignedUrlOptions): Promise<string> {
    const [url] = await this.file(key).getSignedUrl({
      action: 'write',
      expires: Date.now() + (options?.expiresIn ?? 3600) * 1000,
      contentType,
    })
    return url
  }

  async delete(key: string): Promise<void> {
    try {
      await this.file(key).delete()
    } catch (err) {
      if ((err as { code?: number }).code === 404) return
      throw err
    }
  }

  async exists(key: string): Promise<boolean> {
    const [exists] = await this.file(key).exists()
    return exists
  }

  async getBuffer(key: string): Promise<Buffer> {
    const [contents] = await this.file(key).download()
    return Buffer.from(contents)
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const [metadata] = await this.file(key).getMetadata()
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
    await this.file(sourceKey).copy(this.file(destinationKey))
  }

  async list(prefix: string, maxResults?: number): Promise<string[]> {
    const [files] = await this.bucket.getFiles({
      prefix,
      ...(maxResults !== undefined ? { maxResults } : {}),
    })
    return files.map((f) => f.name)
  }
}
