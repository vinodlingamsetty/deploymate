import fs from 'fs/promises'
import path from 'path'
import type { StorageAdapter } from './types'

export class LocalStorageAdapter implements StorageAdapter {
  private readonly basePath: string

  constructor() {
    this.basePath = process.env.LOCAL_STORAGE_PATH ?? './data/uploads'
  }

  private resolvePath(key: string): string {
    // Prevent path traversal: strip leading slashes and resolve segments
    const safeParts = key
      .split('/')
      .filter((segment) => segment.length > 0 && segment !== '..' && segment !== '.')
    return path.join(this.basePath, ...safeParts)
  }

  async upload(key: string, data: Buffer, _contentType: string): Promise<{ key: string; size: number }> {
    const filePath = this.resolvePath(key)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, data)
    return { key, size: data.length }
  }

  async getBuffer(key: string): Promise<Buffer> {
    const filePath = this.resolvePath(key)
    const data = await fs.readFile(filePath)
    return Buffer.from(data)
  }

  async getSignedDownloadUrl(key: string, _expiresIn?: number): Promise<string> {
    // For local dev, return a direct API route — no signing needed
    return `/api/files/${encodeURIComponent(key)}`
  }

  async getSignedUploadUrl(key: string, _contentType: string, _expiresIn?: number): Promise<string> {
    // For local dev, direct uploads go through the create-release endpoint
    // This URL is returned to the client but not actually used for local storage
    return `/api/v1/storage/upload?key=${encodeURIComponent(key)}`
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolvePath(key)
    try {
      await fs.unlink(filePath)
    } catch (err) {
      // Ignore ENOENT — file already gone
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.resolvePath(key)
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}
