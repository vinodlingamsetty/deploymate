export type StorageProvider = 'aws-s3' | 'gcp-storage' | 'gcp-enterprise' | 'azure-blob' | 'local'

export interface UploadResult {
  key: string
  size: number
}

export interface SignedUrlOptions {
  expiresIn?: number
  downloadFilename?: string
}

export interface FileMetadata {
  key: string
  size: number
  contentType: string
  lastModified: Date
}

export interface StorageAdapter {
  readonly provider: StorageProvider

  upload(key: string, data: Buffer, contentType: string): Promise<UploadResult>
  getSignedDownloadUrl(key: string, options?: SignedUrlOptions): Promise<string>
  getSignedUploadUrl(key: string, contentType: string, options?: SignedUrlOptions): Promise<string>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  getBuffer(key: string): Promise<Buffer>
  getMetadata(key: string): Promise<FileMetadata | null>
  copy(sourceKey: string, destinationKey: string): Promise<void>
  list(prefix: string, maxResults?: number): Promise<string[]>
}
