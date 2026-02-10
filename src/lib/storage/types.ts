export interface StorageAdapter {
  upload(key: string, data: Buffer, contentType: string): Promise<{ key: string; size: number }>
  getSignedDownloadUrl(key: string, expiresIn?: number): Promise<string>
  getSignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  getBuffer(key: string): Promise<Buffer>
}
