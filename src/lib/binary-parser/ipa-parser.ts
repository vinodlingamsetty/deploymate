import AdmZip from 'adm-zip'
import plist from 'plist'
import logger from '@/lib/logger'
import type { IPAMetadata, ProvisioningInfo, ProvisioningType } from './types'

const EMPTY_METADATA: IPAMetadata = {
  bundleId: null,
  version: null,
  buildNumber: null,
  appName: null,
  minimumOSVersion: null,
  supportedDevices: [],
  iconData: null,
  provisioning: null,
}

function determineSigningType(profile: Record<string, unknown>): ProvisioningType {
  // Enterprise (In-House) profiles set ProvisionsAllDevices=true, allowing
  // the app to run on any device without explicit UDID registration.
  if (profile.ProvisionsAllDevices === true) {
    return 'enterprise'
  }

  // Development profiles include the get-task-allow entitlement, which
  // permits attaching a debugger to the running process.
  const entitlements = profile.Entitlements as Record<string, unknown> | undefined
  if (entitlements?.['get-task-allow'] === true) {
    return 'development'
  }

  // Ad Hoc profiles contain an explicit list of provisioned device UDIDs.
  if (Array.isArray(profile.ProvisionedDevices) && profile.ProvisionedDevices.length > 0) {
    return 'adhoc'
  }

  // App Store profiles have no device restrictions and no debug entitlements.
  return 'appstore'
}

function parseProvisioningProfile(data: Buffer): ProvisioningInfo | null {
  try {
    // The mobileprovision file is a CMS/PKCS#7 envelope containing binary
    // DER data around an embedded XML plist. Instead of converting the entire
    // buffer to a string (which is wasteful for the binary envelope), search
    // for XML boundaries directly in the buffer and decode only that slice.
    const xmlStartMarker = '<?xml'
    const xmlEndMarker = '</plist>'

    const xmlStart = data.indexOf(xmlStartMarker)
    const xmlEnd = data.indexOf(xmlEndMarker)
    if (xmlStart === -1 || xmlEnd === -1) return null

    const xmlContent = data.subarray(xmlStart, xmlEnd + xmlEndMarker.length).toString('utf-8')
    const parsed = plist.parse(xmlContent) as Record<string, unknown>

    const signingType = determineSigningType(parsed)

    const profileName = typeof parsed.Name === 'string' && parsed.Name.trim()
      ? parsed.Name
      : null
    const teamName = typeof parsed.TeamName === 'string' && parsed.TeamName.trim()
      ? parsed.TeamName
      : null
    const expirationDate = parsed.ExpirationDate instanceof Date
      ? parsed.ExpirationDate
      : null

    return { signingType, profileName, teamName, expirationDate }
  } catch (err) {
    logger.warn(
      { error: err instanceof Error ? err.message : String(err) },
      'Failed to parse provisioning profile',
    )
    return null
  }
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

  // Parse embedded.mobileprovision for signing info
  const provisionEntry = entries.find((e) =>
    /^Payload\/[^/]+\.app\/embedded\.mobileprovision$/.test(e.entryName),
  )
  const provisioning = provisionEntry
    ? parseProvisioningProfile(provisionEntry.getData())
    : null

  return {
    bundleId,
    version,
    buildNumber,
    appName,
    minimumOSVersion,
    supportedDevices,
    iconData: null,
    provisioning,
  }
}
