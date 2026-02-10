import AdmZip from 'adm-zip'
import type { APKMetadata } from './types'

const EMPTY_METADATA: APKMetadata = {
  packageName: null,
  versionName: null,
  versionCode: null,
  appName: null,
  minSdkVersion: null,
  targetSdkVersion: null,
  permissions: [],
  iconData: null,
}

export function parseAPK(buffer: Buffer): APKMetadata {
  try {
    const zip = new AdmZip(buffer)
    const manifestEntry = zip.getEntry('AndroidManifest.xml')

    if (!manifestEntry) {
      return { ...EMPTY_METADATA }
    }

    // AndroidManifest.xml inside APKs is compiled binary XML (AXML format).
    // Full parsing requires a dedicated AXML parser; we do best-effort string extraction.
    const manifestData = manifestEntry.getData()
    const extracted = extractStringsFromBinaryXml(manifestData)

    return {
      packageName: extracted.packageName,
      versionName: extracted.versionName,
      versionCode: extracted.versionCode,
      appName: extracted.appName,
      minSdkVersion: extracted.minSdkVersion,
      targetSdkVersion: extracted.targetSdkVersion,
      permissions: extracted.permissions,
      iconData: null,
    }
  } catch {
    return { ...EMPTY_METADATA }
  }
}

interface ExtractedManifestStrings {
  packageName: string | null
  versionName: string | null
  versionCode: number | null
  appName: string | null
  minSdkVersion: number | null
  targetSdkVersion: number | null
  permissions: string[]
}

/**
 * Best-effort extraction of human-readable strings from Android binary XML (AXML).
 * The AXML format stores string values in a UTF-16LE string pool near the start of
 * the file. We scan the buffer for the known android.permission.* pattern and
 * reverse-DNS package name patterns rather than implementing a full AXML parser.
 */
function extractStringsFromBinaryXml(data: Buffer): ExtractedManifestStrings {
  // Attempt to decode as UTF-16LE first (AXML string pool encoding), then fall
  // back to treating raw bytes as Latin-1/ASCII for the readable segments.
  const textUtf16 = data.toString('utf16le')
  const textLatin1 = data.toString('latin1')

  // Look for a reverse-DNS package name (e.g. com.example.app) — must have at
  // least three dot-separated segments to avoid false positives.
  const packageRegex = /\b([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){2,})\b/gi
  let packageName: string | null = null

  for (const text of [textUtf16, textLatin1]) {
    const match = packageRegex.exec(text)
    if (match) {
      packageName = match[1]
      break
    }
    packageRegex.lastIndex = 0
  }

  // Collect android.permission.* declarations
  const permRegex = /android\.permission\.[A-Z_]+/g
  const permissionSet = new Set<string>()

  for (const text of [textUtf16, textLatin1]) {
    let permMatch: RegExpExecArray | null
    while ((permMatch = permRegex.exec(text)) !== null) {
      permissionSet.add(permMatch[0])
    }
    permRegex.lastIndex = 0
  }

  return {
    packageName,
    versionName: null,     // requires full AXML parse for attribute values
    versionCode: null,     // requires full AXML parse for attribute values
    appName: null,         // requires resources.arsc lookup
    minSdkVersion: null,   // requires full AXML parse for attribute values
    targetSdkVersion: null,
    permissions: Array.from(permissionSet),
  }
}
