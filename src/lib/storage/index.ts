import { LocalStorageAdapter } from './local-adapter'
import type { StorageAdapter } from './types'

export type { StorageAdapter } from './types'

let instance: StorageAdapter | null = null

export function getStorageAdapter(): StorageAdapter {
  if (instance) return instance

  const provider = process.env.STORAGE_PROVIDER ?? 'local'

  switch (provider) {
    case 'local':
      instance = new LocalStorageAdapter()
      return instance
    default:
      throw new Error(
        `Storage provider "${provider}" is not yet implemented. See Phase 9.`,
      )
  }
}
