import fs from 'fs/promises'
import path from 'path'
import type { FileMetadata, SignedUrlOptions, StorageAdapter, UploadResult } from './types'

const MIME_TYPES: Record<string, string> = {
  '.ipa': 'application/octet-stream',
  '.apk': 'application/vnd.android.package-archive',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.plist': 'application/xml',
}

export class LocalStorageAdapter implements StorageAdapter {
  readonly provider = 'local' as const
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

  async upload(key: string, data: Buffer, _contentType: string): Promise<UploadResult> {
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

  async getSignedDownloadUrl(key: string, _options?: SignedUrlOptions): Promise<string> {
    // For local dev, return a direct API route — no signing needed
    return `/api/files/${encodeURIComponent(key)}`
  }

  async getSignedUploadUrl(key: string, _contentType: string, _options?: SignedUrlOptions): Promise<string> {
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

  async getMetadata(key: string): Promise<FileMetadata | null> {
    const filePath = this.resolvePath(key)
    try {
      const stat = await fs.stat(filePath)
      const ext = path.extname(filePath).toLowerCase()
      return {
        key,
        size: stat.size,
        contentType: MIME_TYPES[ext] ?? 'application/octet-stream',
        lastModified: stat.mtime,
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null
      }
      throw err
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    const srcPath = this.resolvePath(sourceKey)
    const dstPath = this.resolvePath(destinationKey)
    await fs.mkdir(path.dirname(dstPath), { recursive: true })
    await fs.copyFile(srcPath, dstPath)
  }

  async list(prefix: string, maxResults?: number): Promise<string[]> {
    const basePath = this.resolvePath(prefix)
    const results: string[] = []

    const collect = async (dir: string): Promise<void> => {
      let entries: string[]
      try {
        entries = await fs.readdir(dir)
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return
        throw err
      }

      for (const name of entries) {
        if (maxResults !== undefined && results.length >= maxResults) return

        const fullPath = path.join(dir, name)
        const stat = await fs.stat(fullPath)
        if (stat.isDirectory()) {
          await collect(fullPath)
        } else {
          const relative = path.relative(this.basePath, fullPath)
          results.push(relative.split(path.sep).join('/'))
        }
      }
    }

    await collect(basePath)
    return maxResults !== undefined ? results.slice(0, maxResults) : results
  }
}
