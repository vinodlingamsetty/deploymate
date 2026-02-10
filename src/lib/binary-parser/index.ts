import { parseIPA } from './ipa-parser'
import { parseAPK } from './apk-parser'
import type { ParsedBinaryMetadata } from './types'

export type { IPAMetadata, APKMetadata, ParsedBinaryMetadata } from './types'

export function parseBinary(buffer: Buffer, platform: 'IOS' | 'ANDROID'): ParsedBinaryMetadata {
  try {
    if (platform === 'IOS') {
      const meta = parseIPA(buffer)
      return {
        bundleId: meta.bundleId,
        version: meta.version,
        buildNumber: meta.buildNumber,
        appName: meta.appName,
        minOSVersion: meta.minimumOSVersion,
      }
    } else {
      const meta = parseAPK(buffer)
      return {
        bundleId: meta.packageName,
        version: meta.versionName,
        buildNumber: meta.versionCode !== null ? String(meta.versionCode) : null,
        appName: meta.appName,
        minOSVersion: meta.minSdkVersion !== null ? `Android API ${meta.minSdkVersion}` : null,
      }
    }
  } catch {
    return {
      bundleId: null,
      version: null,
      buildNumber: null,
      appName: null,
      minOSVersion: null,
    }
  }
}
