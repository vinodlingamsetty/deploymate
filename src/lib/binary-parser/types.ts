export interface IPAMetadata {
  bundleId: string | null
  version: string | null
  buildNumber: string | null
  appName: string | null
  minimumOSVersion: string | null
  supportedDevices: string[]
  iconData: Buffer | null
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
}
