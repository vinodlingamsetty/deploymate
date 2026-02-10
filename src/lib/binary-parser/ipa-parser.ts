import AdmZip from 'adm-zip'
import plist from 'plist'
import type { IPAMetadata } from './types'

const EMPTY_METADATA: IPAMetadata = {
  bundleId: null,
  version: null,
  buildNumber: null,
  appName: null,
  minimumOSVersion: null,
  supportedDevices: [],
  iconData: null,
}

export function parseIPA(buffer: Buffer): IPAMetadata {
  let zip: AdmZip
  try {
    zip = new AdmZip(buffer)
  } catch {
    return { ...EMPTY_METADATA }
  }

  const entries = zip.getEntries()

  // Find Info.plist at: Payload/<AppName>.app/Info.plist
  const infoPlistEntry = entries.find((e) =>
    /^Payload\/[^/]+\.app\/Info\.plist$/.test(e.entryName),
  )

  if (!infoPlistEntry) {
    return { ...EMPTY_METADATA }
  }

  const plistData = infoPlistEntry.getData()
  let parsed: Record<string, unknown>

  try {
    // IPA Info.plist files are XML plists
    parsed = plist.parse(plistData.toString('utf-8')) as Record<string, unknown>
  } catch {
    // Binary plist — would need a separate binary plist parser; return partial metadata
    return { ...EMPTY_METADATA }
  }

  const bundleId = typeof parsed.CFBundleIdentifier === 'string'
    ? parsed.CFBundleIdentifier
    : null

  const version = typeof parsed.CFBundleShortVersionString === 'string'
    ? parsed.CFBundleShortVersionString
    : null

  const buildNumber = typeof parsed.CFBundleVersion === 'string'
    ? parsed.CFBundleVersion
    : null

  const appName =
    (typeof parsed.CFBundleDisplayName === 'string' ? parsed.CFBundleDisplayName : null) ??
    (typeof parsed.CFBundleName === 'string' ? parsed.CFBundleName : null)

  const minimumOSVersion = typeof parsed.MinimumOSVersion === 'string'
    ? parsed.MinimumOSVersion
    : null

  const deviceFamily = Array.isArray(parsed.UIDeviceFamily)
    ? (parsed.UIDeviceFamily as unknown[])
    : []

  const supportedDevices: string[] = []
  if (deviceFamily.includes(1)) supportedDevices.push('iPhone')
  if (deviceFamily.includes(2)) supportedDevices.push('iPad')

  return {
    bundleId,
    version,
    buildNumber,
    appName,
    minimumOSVersion,
    supportedDevices,
    iconData: null,
  }
}
