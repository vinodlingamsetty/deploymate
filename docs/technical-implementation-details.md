# DeployMate - Technical Implementation Details

> **Purpose:** Deep technical specifications for mobile app installation and binary parsing
> **Audience:** AI coding tools and developers
> **Version:** 1.0

---

## Table of Contents

1. [iOS Over-The-Air (OTA) Installation](#1-ios-over-the-air-ota-installation)
2. [Android APK Installation](#2-android-apk-installation)
3. [IPA Binary Parsing](#3-ipa-binary-parsing)
4. [APK Binary Parsing](#4-apk-binary-parsing)
5. [Mobile Install Page Implementation](#5-mobile-install-page-implementation)
6. [Code Signing Detection](#6-code-signing-detection)

---

## 1. iOS Over-The-Air (OTA) Installation

### 1.1 How iOS OTA Installation Works

iOS apps distributed outside the App Store use the `itms-services://` protocol. This is how TestFlight alternatives, enterprise apps, and ad-hoc distributions work.

```
┌─────────────────────────────────────────────────────────────────┐
│                 iOS OTA INSTALLATION FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User opens install page on iPhone Safari                    │
│                         │                                       │
│                         ▼                                       │
│  2. User taps "Install" button                                  │
│                         │                                       │
│                         ▼                                       │
│  3. Browser opens: itms-services://?action=download-manifest    │
│                    &url=https://example.com/manifest.plist      │
│                         │                                       │
│                         ▼                                       │
│  4. iOS downloads and parses manifest.plist                     │
│                         │                                       │
│                         ▼                                       │
│  5. iOS shows "Install [App Name]?" confirmation dialog         │
│                         │                                       │
│                         ▼                                       │
│  6. iOS downloads .ipa from URL specified in manifest           │
│                         │                                       │
│                         ▼                                       │
│  7. iOS verifies code signature                                 │
│                         │                                       │
│                         ▼                                       │
│  8. App installed on home screen                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Critical Requirements

| Requirement | Details |
|-------------|---------|
| **HTTPS Required** | The manifest.plist URL MUST be served over HTTPS with a valid SSL certificate |
| **Safari Only** | OTA installation only works in Safari, not Chrome or other browsers |
| **Manifest URL** | Must be publicly accessible (no authentication on manifest itself) |
| **IPA URL** | Can use signed URLs with expiration for security |
| **Device UDID** | For Ad-Hoc distribution, device UDID must be in provisioning profile |

### 1.3 Manifest.plist Structure

The manifest.plist is an XML property list file that tells iOS where to download the app and provides metadata.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <!-- The IPA file -->
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>https://example.com/apps/MyApp.ipa</string>
                </dict>
                <!-- App icon (57x57) - Optional but recommended -->
                <dict>
                    <key>kind</key>
                    <string>display-image</string>
                    <key>url</key>
                    <string>https://example.com/apps/icon-57.png</string>
                </dict>
                <!-- Large app icon (512x512) - Optional -->
                <dict>
                    <key>kind</key>
                    <string>full-size-image</string>
                    <key>url</key>
                    <string>https://example.com/apps/icon-512.png</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>com.example.myapp</string>
                <key>bundle-version</key>
                <string>1.2.3</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>My App Name</string>
                <!-- Optional: Subtitle shown during install -->
                <key>subtitle</key>
                <string>Beta Version</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>
```

### 1.4 Implementation: Manifest Generation API

```typescript
// app/api/v1/releases/[id]/manifest/route.ts

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getStorage } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Get release with app info
  const release = await db.release.findUnique({
    where: { id: params.id },
    include: { app: true },
  });

  if (!release) {
    return new Response('Not Found', { status: 404 });
  }

  // Generate signed URL for IPA (expires in 1 hour)
  const storage = getStorage();
  const ipaUrl = await storage.getSignedUrl(release.fileKey, 3600);
  
  // Generate icon URLs if available
  const iconUrl = release.app.iconUrl || null;
  
  // Build manifest XML
  const manifest = generateManifestPlist({
    ipaUrl,
    bundleId: release.bundleId || release.app.bundleId,
    version: release.version,
    title: release.app.name,
    iconUrl,
  });

  // Return as XML with correct content type
  return new Response(manifest, {
    headers: {
      'Content-Type': 'application/xml',
      // Allow caching for 5 minutes
      'Cache-Control': 'public, max-age=300',
    },
  });
}

interface ManifestOptions {
  ipaUrl: string;
  bundleId: string;
  version: string;
  title: string;
  iconUrl?: string | null;
}

function generateManifestPlist(options: ManifestOptions): string {
  const { ipaUrl, bundleId, version, title, iconUrl } = options;

  // Build assets array
  let assetsXml = `
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>${escapeXml(ipaUrl)}</string>
                </dict>`;

  if (iconUrl) {
    assetsXml += `
                <dict>
                    <key>kind</key>
                    <string>display-image</string>
                    <key>url</key>
                    <string>${escapeXml(iconUrl)}</string>
                </dict>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>${assetsXml}
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>${escapeXml(bundleId)}</string>
                <key>bundle-version</key>
                <string>${escapeXml(version)}</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>${escapeXml(title)}</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

### 1.5 Install Button Implementation

```tsx
// components/releases/ios-install-button.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Download, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface IOSInstallButtonProps {
  releaseId: string;
  appName: string;
  version: string;
}

export function IOSInstallButton({ releaseId, appName, version }: IOSInstallButtonProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Detect Safari (not Chrome on iOS)
    const safari = /Safari/.test(navigator.userAgent) && 
                   !/CriOS|Chrome/.test(navigator.userAgent);
    setIsSafari(safari);
  }, []);

  const manifestUrl = `${window.location.origin}/api/v1/releases/${releaseId}/manifest`;
  const installUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`;

  const handleInstall = () => {
    if (!isIOS) {
      alert('iOS app can only be installed on iPhone or iPad');
      return;
    }
    
    if (!isSafari) {
      alert('Please open this page in Safari to install the app');
      return;
    }

    // Open the itms-services URL
    window.location.href = installUrl;
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleInstall}
        className="w-full bg-[#0077b6] hover:bg-[#006399] text-white"
        size="lg"
      >
        <Download className="mr-2 h-5 w-5" />
        Install {appName} v{version}
      </Button>
      
      {isIOS && !isSafari && (
        <p className="text-sm text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          Open in Safari to install
        </p>
      )}
      
      {!isIOS && (
        <p className="text-sm text-muted-foreground">
          Open this page on your iPhone or iPad to install
        </p>
      )}
    </div>
  );
}
```

### 1.6 iOS Provisioning Profile Types

| Profile Type | Who Can Install | Requirements |
|--------------|-----------------|--------------|
| **Development** | Registered device UDIDs only (max 100) | Device must be registered in Apple Developer Portal |
| **Ad Hoc** | Registered device UDIDs only (max 100) | Device UDID must be in provisioning profile |
| **Enterprise (In-House)** | Any device | Requires Apple Enterprise Developer Program ($299/year) |
| **App Store** | N/A (TestFlight or App Store only) | Cannot be installed via OTA |

**DeployMate supports:** Development, Ad Hoc, and Enterprise profiles.

---

## 2. Android APK Installation

### 2.1 How Android APK Installation Works

Android APK installation is simpler than iOS - it's a direct file download.

```
┌─────────────────────────────────────────────────────────────────┐
│                 ANDROID APK INSTALLATION FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User opens install page on Android browser                  │
│                         │                                       │
│                         ▼                                       │
│  2. User taps "Download APK" button                             │
│                         │                                       │
│                         ▼                                       │
│  3. Browser downloads .apk file                                 │
│                         │                                       │
│                         ▼                                       │
│  4. User taps downloaded file (or notification)                 │
│                         │                                       │
│                         ▼                                       │
│  5. Android prompts "Install from unknown sources?" (if needed) │
│                         │                                       │
│                         ▼                                       │
│  6. User confirms installation                                  │
│                         │                                       │
│                         ▼                                       │
│  7. App installed                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Implementation: APK Download Endpoint

```typescript
// app/api/v1/releases/[id]/download/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getStorage } from '@/lib/storage';
import { authenticateRequest } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate user
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get release
  const release = await db.release.findUnique({
    where: { id: params.id },
    include: { app: true },
  });

  if (!release) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Check user has access (via distribution group)
  const hasAccess = await checkUserHasAccessToRelease(auth.user.id, release.id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Log the download
  await db.downloadLog.create({
    data: {
      releaseId: release.id,
      userId: auth.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.ip,
      userAgent: request.headers.get('user-agent'),
    },
  });

  // Increment download count
  await db.release.update({
    where: { id: release.id },
    data: { downloadCount: { increment: 1 } },
  });

  // Generate signed URL
  const storage = getStorage();
  const signedUrl = await storage.getSignedUrl(release.fileKey, 3600);

  // For Android, we want to trigger a download with proper filename
  // Redirect to signed URL
  return NextResponse.redirect(signedUrl, 302);
}
```

### 2.3 Android Install Button Implementation

```tsx
// components/releases/android-install-button.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface AndroidInstallButtonProps {
  releaseId: string;
  appName: string;
  version: string;
  fileSize: number;
}

export function AndroidInstallButton({ 
  releaseId, 
  appName, 
  version,
  fileSize 
}: AndroidInstallButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    // Trigger download
    window.location.href = `/api/v1/releases/${releaseId}/download`;
    
    // Reset state after a delay
    setTimeout(() => setIsDownloading(false), 3000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <Button 
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full bg-[#0077b6] hover:bg-[#006399] text-white"
        size="lg"
      >
        <Download className="mr-2 h-5 w-5" />
        {isDownloading ? 'Downloading...' : `Download APK (${formatFileSize(fileSize)})`}
      </Button>
      
      <div className="text-sm text-muted-foreground space-y-1">
        <p className="font-medium">{appName} v{version}</p>
        <p className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          After download, tap the file to install
        </p>
      </div>
      
      {/* Instructions for unknown sources */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Can't install? Enable unknown sources
        </summary>
        <div className="mt-2 p-3 bg-muted rounded-md space-y-2">
          <p><strong>Android 8.0+:</strong></p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Open Settings → Apps & notifications</li>
            <li>Tap "Special app access"</li>
            <li>Tap "Install unknown apps"</li>
            <li>Select your browser and enable "Allow from this source"</li>
          </ol>
        </div>
      </details>
    </div>
  );
}
```

---

## 3. IPA Binary Parsing

### 3.1 IPA File Structure

An IPA file is a ZIP archive with a specific structure:

```
MyApp.ipa (ZIP archive)
├── Payload/
│   └── MyApp.app/                    # The actual app bundle
│       ├── Info.plist                # App metadata (CRITICAL)
│       ├── embedded.mobileprovision  # Provisioning profile (CRITICAL)
│       ├── MyApp                     # Executable binary
│       ├── Assets.car                # Compiled assets
│       ├── Base.lproj/               # Localization
│       ├── AppIcon60x60@2x.png       # App icons
│       ├── AppIcon76x76@2x~ipad.png
│       └── ...
├── iTunesArtwork                     # 512x512 icon (optional)
├── iTunesArtwork@2x                  # 1024x1024 icon (optional)
└── iTunesMetadata.plist              # iTunes metadata (optional)
```

### 3.2 Metadata to Extract from IPA

| Field | Source | Plist Key |
|-------|--------|-----------|
| Bundle ID | Info.plist | `CFBundleIdentifier` |
| Version | Info.plist | `CFBundleShortVersionString` |
| Build Number | Info.plist | `CFBundleVersion` |
| App Name | Info.plist | `CFBundleDisplayName` or `CFBundleName` |
| Minimum iOS Version | Info.plist | `MinimumOSVersion` |
| Supported Devices | Info.plist | `UIDeviceFamily` (1=iPhone, 2=iPad) |
| Required Capabilities | Info.plist | `UIRequiredDeviceCapabilities` |

### 3.3 IPA Parser Implementation

```typescript
// packages/binary-parser/src/ipa-parser.ts

import AdmZip from 'adm-zip';
import plist from 'plist';
import { IPAMetadata, ProvisioningProfile, ProvisioningType } from './types';

/**
 * Parse an IPA file and extract metadata.
 * 
 * @param buffer - The IPA file as a Buffer
 * @returns Parsed metadata including app info and provisioning details
 */
export async function parseIPA(buffer: Buffer): Promise<IPAMetadata> {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  // Find the .app directory in Payload/
  const appEntry = entries.find(entry => 
    entry.entryName.startsWith('Payload/') && 
    entry.entryName.endsWith('.app/') &&
    entry.entryName.split('/').length === 3
  );

  if (!appEntry) {
    throw new Error('Invalid IPA: Could not find .app bundle in Payload/');
  }

  const appPath = appEntry.entryName;

  // Extract Info.plist
  const infoPlistEntry = entries.find(entry => 
    entry.entryName === `${appPath}Info.plist`
  );

  if (!infoPlistEntry) {
    throw new Error('Invalid IPA: Could not find Info.plist');
  }

  const infoPlistData = infoPlistEntry.getData();
  const infoPlist = parsePlist(infoPlistData);

  // Extract embedded.mobileprovision (provisioning profile)
  const provisionEntry = entries.find(entry =>
    entry.entryName === `${appPath}embedded.mobileprovision`
  );

  let provisioningProfile: ProvisioningProfile | null = null;
  if (provisionEntry) {
    provisioningProfile = parseProvisioningProfile(provisionEntry.getData());
  }

  // Try to extract app icon
  let iconData: Buffer | null = null;
  const iconEntry = entries.find(entry =>
    entry.entryName.includes('AppIcon') && 
    entry.entryName.endsWith('.png') &&
    !entry.entryName.includes('~ipad')
  );
  if (iconEntry) {
    iconData = iconEntry.getData();
  }

  // Build metadata object
  const metadata: IPAMetadata = {
    bundleId: infoPlist.CFBundleIdentifier as string,
    version: infoPlist.CFBundleShortVersionString as string || '1.0',
    buildNumber: infoPlist.CFBundleVersion as string || '1',
    appName: (infoPlist.CFBundleDisplayName || infoPlist.CFBundleName) as string,
    minimumOSVersion: infoPlist.MinimumOSVersion as string || null,
    supportedDevices: parseDeviceFamily(infoPlist.UIDeviceFamily as number[]),
    provisioningProfile,
    iconData,
    rawInfoPlist: infoPlist,
  };

  return metadata;
}

/**
 * Parse a plist file (handles both XML and binary formats).
 */
function parsePlist(data: Buffer): Record<string, unknown> {
  // Check if binary plist (starts with 'bplist')
  if (data.slice(0, 6).toString() === 'bplist') {
    // Use plist library which handles binary format
    return plist.parse(data.toString('utf-8')) as Record<string, unknown>;
  }
  
  // XML plist
  return plist.parse(data.toString('utf-8')) as Record<string, unknown>;
}

/**
 * Parse the embedded.mobileprovision file.
 * 
 * The provisioning profile is a CMS (PKCS#7) signed plist.
 * We extract the plist content from between the XML tags.
 */
function parseProvisioningProfile(data: Buffer): ProvisioningProfile {
  const content = data.toString('utf-8');
  
  // The plist is embedded in the CMS signature
  // Find the plist XML between markers
  const plistStart = content.indexOf('<?xml');
  const plistEnd = content.indexOf('</plist>') + '</plist>'.length;
  
  if (plistStart === -1 || plistEnd === -1) {
    throw new Error('Could not parse provisioning profile');
  }
  
  const plistXml = content.slice(plistStart, plistEnd);
  const profile = plist.parse(plistXml) as Record<string, unknown>;
  
  // Determine provisioning type
  const provisioningType = determineProvisioningType(profile);
  
  return {
    name: profile.Name as string,
    teamId: profile.TeamIdentifier?.[0] as string,
    teamName: profile.TeamName as string,
    appIdPrefix: profile.ApplicationIdentifierPrefix?.[0] as string,
    creationDate: new Date(profile.CreationDate as string),
    expirationDate: new Date(profile.ExpirationDate as string),
    provisioningType,
    provisionedDevices: (profile.ProvisionedDevices as string[]) || [],
    isExpired: new Date(profile.ExpirationDate as string) < new Date(),
    entitlements: profile.Entitlements as Record<string, unknown>,
  };
}

/**
 * Determine the type of provisioning profile.
 */
function determineProvisioningType(profile: Record<string, unknown>): ProvisioningType {
  const hasDevices = Array.isArray(profile.ProvisionedDevices) && 
                     profile.ProvisionedDevices.length > 0;
  const hasAllDevices = profile.ProvisionsAllDevices === true;
  const getTaskAllow = (profile.Entitlements as Record<string, unknown>)?.['get-task-allow'];
  
  if (hasAllDevices) {
    // Enterprise/In-House distribution
    return 'enterprise';
  }
  
  if (getTaskAllow === true) {
    // Development profile (allows debugging)
    return 'development';
  }
  
  if (hasDevices) {
    // Ad Hoc distribution
    return 'adhoc';
  }
  
  // App Store distribution (no devices, no get-task-allow)
  return 'appstore';
}

/**
 * Parse UIDeviceFamily array to human-readable device support.
 */
function parseDeviceFamily(deviceFamily?: number[]): string[] {
  if (!deviceFamily) return ['iPhone', 'iPad'];
  
  const devices: string[] = [];
  if (deviceFamily.includes(1)) devices.push('iPhone');
  if (deviceFamily.includes(2)) devices.push('iPad');
  return devices;
}
```

### 3.4 IPA Metadata Types

```typescript
// packages/binary-parser/src/types.ts

export interface IPAMetadata {
  /** Bundle identifier (e.g., "com.example.myapp") */
  bundleId: string;
  
  /** Marketing version (e.g., "2.1.0") */
  version: string;
  
  /** Build number (e.g., "42") */
  buildNumber: string;
  
  /** Display name of the app */
  appName: string;
  
  /** Minimum iOS version required (e.g., "14.0") */
  minimumOSVersion: string | null;
  
  /** Supported device types */
  supportedDevices: string[];
  
  /** Provisioning profile information */
  provisioningProfile: ProvisioningProfile | null;
  
  /** App icon as PNG buffer (if found) */
  iconData: Buffer | null;
  
  /** Raw Info.plist contents for additional data */
  rawInfoPlist: Record<string, unknown>;
}

export interface ProvisioningProfile {
  /** Profile name (e.g., "MyApp Ad Hoc") */
  name: string;
  
  /** Apple Team ID (e.g., "ABCD1234EF") */
  teamId: string;
  
  /** Team name (e.g., "My Company LLC") */
  teamName: string;
  
  /** App ID prefix */
  appIdPrefix: string;
  
  /** When the profile was created */
  creationDate: Date;
  
  /** When the profile expires */
  expirationDate: Date;
  
  /** Type of provisioning */
  provisioningType: ProvisioningType;
  
  /** List of provisioned device UDIDs (for dev/adhoc) */
  provisionedDevices: string[];
  
  /** Whether the profile is expired */
  isExpired: boolean;
  
  /** Entitlements dictionary */
  entitlements: Record<string, unknown>;
}

export type ProvisioningType = 
  | 'development'   // For testing on registered devices with debugging
  | 'adhoc'         // For distribution to registered devices (max 100)
  | 'enterprise'    // For enterprise/in-house distribution (any device)
  | 'appstore';     // For App Store / TestFlight distribution
```

---

## 4. APK Binary Parsing

### 4.1 APK File Structure

An APK file is also a ZIP archive:

```
MyApp.apk (ZIP archive)
├── AndroidManifest.xml       # Binary XML - App metadata (CRITICAL)
├── classes.dex               # Compiled Java/Kotlin code
├── classes2.dex              # Additional DEX files
├── resources.arsc            # Compiled resources
├── res/
│   ├── drawable-hdpi/        # Images
│   ├── drawable-xhdpi/
│   ├── layout/               # XML layouts (binary)
│   └── ...
├── lib/
│   ├── armeabi-v7a/          # Native libraries
│   ├── arm64-v8a/
│   └── x86_64/
├── assets/                   # Raw assets
├── META-INF/
│   ├── MANIFEST.MF           # JAR manifest
│   ├── CERT.SF               # Signature file
│   └── CERT.RSA              # Certificate
└── kotlin/                   # Kotlin metadata
```

### 4.2 Metadata to Extract from APK

| Field | Source | Manifest Attribute |
|-------|--------|-------------------|
| Package Name | AndroidManifest.xml | `package` |
| Version Name | AndroidManifest.xml | `android:versionName` |
| Version Code | AndroidManifest.xml | `android:versionCode` |
| App Name | AndroidManifest.xml | `android:label` (resolved from resources) |
| Min SDK Version | AndroidManifest.xml | `android:minSdkVersion` |
| Target SDK Version | AndroidManifest.xml | `android:targetSdkVersion` |
| Permissions | AndroidManifest.xml | `<uses-permission>` elements |

### 4.3 APK Parser Implementation

```typescript
// packages/binary-parser/src/apk-parser.ts

import ApkReader from 'adbkit-apkreader';
import AdmZip from 'adm-zip';
import { APKMetadata } from './types';

/**
 * Parse an APK file and extract metadata.
 * 
 * @param buffer - The APK file as a Buffer
 * @returns Parsed metadata including package info and permissions
 */
export async function parseAPK(buffer: Buffer): Promise<APKMetadata> {
  // adbkit-apkreader needs a file path, so we use the buffer API
  const reader = await ApkReader.open(buffer);
  const manifest = await reader.readManifest();
  
  // Extract icon from APK
  let iconData: Buffer | null = null;
  try {
    const zip = new AdmZip(buffer);
    // Try to find the highest resolution icon
    const iconPaths = [
      'res/mipmap-xxxhdpi-v4/ic_launcher.png',
      'res/mipmap-xxhdpi-v4/ic_launcher.png',
      'res/mipmap-xhdpi-v4/ic_launcher.png',
      'res/drawable-xxxhdpi/ic_launcher.png',
      'res/drawable-xxhdpi/ic_launcher.png',
    ];
    
    for (const iconPath of iconPaths) {
      const entry = zip.getEntry(iconPath);
      if (entry) {
        iconData = entry.getData();
        break;
      }
    }
  } catch {
    // Icon extraction failed, continue without it
  }

  // Build metadata
  const metadata: APKMetadata = {
    packageName: manifest.package,
    versionName: manifest.versionName || '1.0',
    versionCode: manifest.versionCode || 1,
    appName: resolveAppName(manifest),
    minSdkVersion: manifest.usesSdk?.minSdkVersion || null,
    targetSdkVersion: manifest.usesSdk?.targetSdkVersion || null,
    permissions: extractPermissions(manifest),
    iconData,
    rawManifest: manifest,
  };

  return metadata;
}

/**
 * Resolve the app name from manifest.
 * The label can be a string or a resource reference.
 */
function resolveAppName(manifest: any): string {
  const label = manifest.application?.label;
  
  if (typeof label === 'string') {
    return label;
  }
  
  // If it's a resource reference, we can't easily resolve it
  // Return the package name as fallback
  return manifest.package.split('.').pop() || manifest.package;
}

/**
 * Extract permission names from manifest.
 */
function extractPermissions(manifest: any): string[] {
  if (!manifest.usesPermissions) {
    return [];
  }
  
  return manifest.usesPermissions.map((p: any) => {
    // Remove android.permission. prefix for readability
    const name = p.name || '';
    return name.replace('android.permission.', '');
  });
}

/**
 * Map SDK version numbers to Android version names.
 */
export function sdkVersionToAndroidVersion(sdkVersion: number): string {
  const versionMap: Record<number, string> = {
    21: 'Android 5.0 (Lollipop)',
    22: 'Android 5.1 (Lollipop)',
    23: 'Android 6.0 (Marshmallow)',
    24: 'Android 7.0 (Nougat)',
    25: 'Android 7.1 (Nougat)',
    26: 'Android 8.0 (Oreo)',
    27: 'Android 8.1 (Oreo)',
    28: 'Android 9 (Pie)',
    29: 'Android 10',
    30: 'Android 11',
    31: 'Android 12',
    32: 'Android 12L',
    33: 'Android 13',
    34: 'Android 14',
    35: 'Android 15',
  };
  
  return versionMap[sdkVersion] || `API ${sdkVersion}`;
}
```

### 4.4 APK Metadata Types

```typescript
// packages/binary-parser/src/types.ts (continued)

export interface APKMetadata {
  /** Package name (e.g., "com.example.myapp") */
  packageName: string;
  
  /** Marketing version (e.g., "2.1.0") */
  versionName: string;
  
  /** Internal version code (e.g., 42) */
  versionCode: number;
  
  /** Display name of the app */
  appName: string;
  
  /** Minimum Android SDK version required */
  minSdkVersion: number | null;
  
  /** Target Android SDK version */
  targetSdkVersion: number | null;
  
  /** List of permissions requested */
  permissions: string[];
  
  /** App icon as PNG buffer (if found) */
  iconData: Buffer | null;
  
  /** Raw manifest for additional data */
  rawManifest: Record<string, unknown>;
}
```

---

## 5. Mobile Install Page Implementation

### 5.1 Unified Install Page Component

```tsx
// app/(public)/install/[releaseId]/page.tsx

import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { IOSInstallButton } from '@/components/releases/ios-install-button';
import { AndroidInstallButton } from '@/components/releases/android-install-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface InstallPageProps {
  params: { releaseId: string };
}

export default async function InstallPage({ params }: InstallPageProps) {
  const release = await db.release.findUnique({
    where: { id: params.releaseId },
    include: { app: true },
  });

  if (!release) {
    notFound();
  }

  const isIOS = release.app.platform === 'IOS';
  
  // Format file size
  const fileSize = release.fileSize;
  const fileSizeFormatted = fileSize > 1024 * 1024 
    ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
    : `${(fileSize / 1024).toFixed(1)} KB`;

  // Parse provisioning info for iOS
  const provisioningType = release.provisioningType as string | null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <div className="max-w-md mx-auto pt-8 space-y-6">
        {/* App Header */}
        <div className="text-center space-y-4">
          {release.app.iconUrl ? (
            <img 
              src={release.app.iconUrl} 
              alt={release.app.name}
              className="w-20 h-20 rounded-2xl mx-auto shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl mx-auto bg-primary/10 flex items-center justify-center">
              <span className="text-3xl">
                {isIOS ? '🍎' : '🤖'}
              </span>
            </div>
          )}
          
          <div>
            <h1 className="text-2xl font-bold">{release.app.name}</h1>
            <p className="text-muted-foreground">
              Version {release.version} ({release.buildNumber})
            </p>
          </div>
          
          <div className="flex justify-center gap-2">
            <Badge variant="secondary">
              {isIOS ? 'iOS' : 'Android'}
            </Badge>
            <Badge className={getReleaseTypeStyle(release.releaseType)}>
              {release.releaseType}
            </Badge>
          </div>
        </div>

        {/* Install Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Install App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isIOS ? (
              <IOSInstallButton 
                releaseId={release.id}
                appName={release.app.name}
                version={release.version}
              />
            ) : (
              <AndroidInstallButton 
                releaseId={release.id}
                appName={release.app.name}
                version={release.version}
                fileSize={release.fileSize}
              />
            )}
            
            <p className="text-sm text-muted-foreground text-center">
              File size: {fileSizeFormatted}
            </p>
          </CardContent>
        </Card>

        {/* iOS Provisioning Warning */}
        {isIOS && provisioningType && (
          <Card className={getProvisioningCardStyle(provisioningType)}>
            <CardContent className="pt-4">
              <div className="flex gap-3">
                {getProvisioningIcon(provisioningType)}
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    {getProvisioningTitle(provisioningType)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getProvisioningDescription(provisioningType)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Release Notes */}
        {release.releaseNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's New</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {release.releaseNotes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Distributed via DeployMate
        </p>
      </div>
    </div>
  );
}

function getReleaseTypeStyle(releaseType: string): string {
  switch (releaseType) {
    case 'ALPHA': return 'bg-[#90e0ef] text-[#1a1a1a]';
    case 'BETA': return 'bg-[#0077b6] text-white';
    case 'RELEASE_CANDIDATE': return 'bg-[#03045e] text-white';
    default: return '';
  }
}

function getProvisioningCardStyle(type: string): string {
  switch (type) {
    case 'development': return 'border-amber-500/50 bg-amber-500/5';
    case 'adhoc': return 'border-blue-500/50 bg-blue-500/5';
    case 'enterprise': return 'border-green-500/50 bg-green-500/5';
    default: return '';
  }
}

function getProvisioningIcon(type: string) {
  switch (type) {
    case 'development': 
      return <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
    case 'adhoc': 
      return <Shield className="h-5 w-5 text-blue-500 flex-shrink-0" />;
    case 'enterprise': 
      return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
    default: 
      return null;
  }
}

function getProvisioningTitle(type: string): string {
  switch (type) {
    case 'development': return 'Development Build';
    case 'adhoc': return 'Ad Hoc Distribution';
    case 'enterprise': return 'Enterprise Distribution';
    default: return 'Unknown Distribution';
  }
}

function getProvisioningDescription(type: string): string {
  switch (type) {
    case 'development': 
      return 'This build can only be installed on registered development devices.';
    case 'adhoc': 
      return 'This build can only be installed on devices registered in the provisioning profile.';
    case 'enterprise': 
      return 'This build can be installed on any device. For internal use only.';
    default: 
      return '';
  }
}
```

---

## 6. Code Signing Detection

### 6.1 Database Schema Addition

Add to Prisma schema for storing signing info:

```prisma
model Release {
  // ... existing fields ...
  
  // Code signing information (iOS only)
  provisioningType    String?   // 'development', 'adhoc', 'enterprise', 'appstore'
  provisioningName    String?   // Profile name
  teamId              String?   // Apple Team ID
  teamName            String?   // Team display name
  provisioningExpiry  DateTime? // When profile expires
  
  // Android signing (optional tracking)
  signingType         String?   // 'debug', 'release'
}
```

### 6.2 Processing Upload with Signing Detection

```typescript
// app/api/v1/apps/[appId]/releases/route.ts (updated POST handler)

import { parseIPA } from '@/packages/binary-parser/src/ipa-parser';
import { parseAPK } from '@/packages/binary-parser/src/apk-parser';

export async function POST(request: NextRequest) {
  // ... authentication and validation ...

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const buffer = Buffer.from(await file.arrayBuffer());

  const app = await db.app.findUnique({ where: { id: params.appId } });
  
  let metadata;
  let provisioningData = {};

  if (app.platform === 'IOS') {
    // Parse IPA
    const ipaMetadata = await parseIPA(buffer);
    
    metadata = {
      bundleId: ipaMetadata.bundleId,
      version: ipaMetadata.version,
      buildNumber: ipaMetadata.buildNumber,
      minOSVersion: ipaMetadata.minimumOSVersion,
    };
    
    // Extract provisioning profile info
    if (ipaMetadata.provisioningProfile) {
      const pp = ipaMetadata.provisioningProfile;
      provisioningData = {
        provisioningType: pp.provisioningType,
        provisioningName: pp.name,
        teamId: pp.teamId,
        teamName: pp.teamName,
        provisioningExpiry: pp.expirationDate,
      };
      
      // Warn if profile is expired
      if (pp.isExpired) {
        console.warn(`Warning: Provisioning profile "${pp.name}" is expired`);
      }
    }
    
    // Save icon if extracted
    if (ipaMetadata.iconData) {
      const iconKey = `apps/${app.id}/icon.png`;
      await storage.upload(ipaMetadata.iconData, iconKey, {
        contentType: 'image/png',
      });
      await db.app.update({
        where: { id: app.id },
        data: { 
          iconKey,
          iconUrl: await storage.getSignedUrl(iconKey, 86400 * 365), // 1 year
        },
      });
    }
  } else {
    // Parse APK
    const apkMetadata = await parseAPK(buffer);
    
    metadata = {
      bundleId: apkMetadata.packageName,
      version: apkMetadata.versionName,
      buildNumber: String(apkMetadata.versionCode),
      minOSVersion: apkMetadata.minSdkVersion 
        ? `Android ${apkMetadata.minSdkVersion}` 
        : null,
    };
    
    // Save icon if extracted
    if (apkMetadata.iconData) {
      const iconKey = `apps/${app.id}/icon.png`;
      await storage.upload(apkMetadata.iconData, iconKey, {
        contentType: 'image/png',
      });
      await db.app.update({
        where: { id: app.id },
        data: { 
          iconKey,
          iconUrl: await storage.getSignedUrl(iconKey, 86400 * 365),
        },
      });
    }
  }

  // Upload binary to storage
  const fileKey = `releases/${app.id}/${releaseId}.${app.platform === 'IOS' ? 'ipa' : 'apk'}`;
  await storage.upload(buffer, fileKey, {
    contentType: 'application/octet-stream',
  });

  // Create release record
  const release = await db.release.create({
    data: {
      appId: app.id,
      version: metadata.version,
      buildNumber: metadata.buildNumber,
      bundleId: metadata.bundleId,
      minOSVersion: metadata.minOSVersion,
      fileKey,
      fileName: file.name,
      fileSize: buffer.length,
      releaseType: formData.get('releaseType') as string,
      releaseNotes: formData.get('releaseNotes') as string,
      uploadedById: auth.user.id,
      ...provisioningData,
    },
  });

  return successResponse(release, 201);
}
```

---

## Summary

| Feature | iOS | Android |
|---------|-----|---------|
| Installation Protocol | `itms-services://` with manifest.plist | Direct APK download |
| HTTPS Required | Yes (mandatory) | No (recommended) |
| Browser Support | Safari only | Any browser |
| Code Signing | Development, Ad Hoc, Enterprise | Debug, Release |
| Metadata Source | Info.plist + embedded.mobileprovision | AndroidManifest.xml |
| Device Restrictions | Based on provisioning profile | "Unknown sources" setting |

---

*This document supplements deploymate-requirements.md with deep technical implementation details.*
