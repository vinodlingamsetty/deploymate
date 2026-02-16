import { LocalStorageAdapter } from './local-adapter'
import type { StorageAdapter } from './types'

export type { StorageAdapter } from './types'
export type { StorageProvider, UploadResult, SignedUrlOptions, FileMetadata } from './types'

let instance: StorageAdapter | null = null

export function getStorageAdapter(): StorageAdapter {
  if (instance) return instance

  const provider = process.env.STORAGE_PROVIDER ?? 'local'

  switch (provider) {
    case 'aws-s3': {
      const { S3StorageAdapter } = require('./s3-adapter') as typeof import('./s3-adapter')
      instance = new S3StorageAdapter()
      break
    }
    case 'gcp-storage': {
      const { GCSStorageAdapter } = require('./gcs-adapter') as typeof import('./gcs-adapter')
      instance = new GCSStorageAdapter()
      break
    }
    case 'azure-blob': {
      const { AzureBlobStorageAdapter } = require('./azure-adapter') as typeof import('./azure-adapter')
      instance = new AzureBlobStorageAdapter()
      break
    }
    case 'local':
      instance = new LocalStorageAdapter()
      break
    default:
      throw new Error(`Unknown storage provider: "${provider}". Valid values: local, aws-s3, gcp-storage, azure-blob`)
  }

  return instance
}
