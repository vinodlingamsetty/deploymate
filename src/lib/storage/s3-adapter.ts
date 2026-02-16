import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { FileMetadata, SignedUrlOptions, StorageAdapter, UploadResult } from './types'

export class S3StorageAdapter implements StorageAdapter {
  readonly provider = 'aws-s3' as const
  private readonly client: S3Client
  private readonly bucket: string

  constructor() {
    const bucket = process.env.S3_BUCKET
    if (!bucket) throw new Error('S3_BUCKET environment variable is required')
    this.bucket = bucket

    this.client = new S3Client({
      region: process.env.S3_REGION ?? 'us-east-1',
      ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          }
        : {}),
      ...(process.env.S3_ENDPOINT
        ? {
            endpoint: process.env.S3_ENDPOINT,
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
          }
        : {}),
    })
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      }),
    )
    return { key, size: data.length }
  }

  async getSignedDownloadUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(options?.downloadFilename
        ? { ResponseContentDisposition: `attachment; filename="${options.downloadFilename}"` }
        : {}),
    })
    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn ?? 3600,
    })
  }

  async getSignedUploadUrl(key: string, contentType: string, options?: SignedUrlOptions): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    })
    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn ?? 3600,
    })
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    )
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      )
      return true
    } catch (err) {
      if ((err as { name?: string }).name === 'NotFound') return false
      throw err
    }
  }

  async getBuffer(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    )
    if (!response.Body) throw new Error(`Empty response body for key: ${key}`)
    const bytes = await response.Body.transformToByteArray()
    return Buffer.from(bytes)
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      )
      return {
        key,
        size: response.ContentLength ?? 0,
        contentType: response.ContentType ?? 'application/octet-stream',
        lastModified: response.LastModified ?? new Date(),
      }
    } catch (err) {
      if ((err as { name?: string }).name === 'NotFound') return null
      throw err
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      }),
    )
  }

  async list(prefix: string, maxResults?: number): Promise<string[]> {
    const keys: string[] = []
    let continuationToken: string | undefined

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          MaxKeys: maxResults !== undefined ? Math.min(maxResults - keys.length, 1000) : 1000,
          ContinuationToken: continuationToken,
        }),
      )

      for (const obj of response.Contents ?? []) {
        if (obj.Key) keys.push(obj.Key)
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
    } while (continuationToken && (maxResults === undefined || keys.length < maxResults))

    return maxResults !== undefined ? keys.slice(0, maxResults) : keys
  }
}
