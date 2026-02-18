export type ProvisioningType = 'development' | 'adhoc' | 'enterprise' | 'appstore'

export interface ProvisioningInfo {
  signingType: ProvisioningType
  profileName: string | null
  teamName: string | null
  expirationDate: Date | null
}

export interface IPAMetadata {
  bundleId: string | null
  version: string | null
  buildNumber: string | null
  appName: string | null
  minimumOSVersion: string | null
  supportedDevices: string[]
  iconData: Buffer | null
  provisioning: ProvisioningInfo | null
}

export interface APKMetadata {
  packageName: string | null
  versionName: string | null
  versionCode: number | null
  appName: string | null
  minSdkVersion: number | null
  targetSdkVersion: number | null
  permissions: string[]
  iconData: Buffer | null
}

export interface ParsedBinaryMetadata {
  bundleId: string | null
  version: string | null
  buildNumber: string | null
  appName: string | null
  minOSVersion: string | null
  signingType: string | null
  provisioningName: string | null
  teamName: string | null
  provisioningExpiry: Date | null
}
