# DeployMate: Enterprise GCP Deployment Architecture

> **Document Type:** Deployment Architecture & Implementation Guide  
> **Target Environment:** Enterprise GCP with VPC-SC (e.g., GCP 3.0 patterns)  
> **Pattern:** Cloud Run + External HTTPS LB + Dual GCS Buckets  
> **Version:** 1.0  
> **For:** AI Coding Agents & Developers

---

## Overview

This document describes the architecture for deploying DeployMate in an enterprise GCP environment with strict security controls (VPC Service Controls, Zero Trust networking, pipeline-based provisioning).

**Use this document to:**
- Understand the architecture decisions
- Implement the storage adapter for dual-bucket pattern
- Implement iOS OTA distribution flow
- Configure authentication with pluggable SSO
- Set up infrastructure via Terraform

---

## Architecture Summary

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Compute** | Cloud Run | Managed, autoscaling, enterprise-preferred |
| **Database** | Cloud SQL PostgreSQL | Managed PostgreSQL, private connectivity |
| **App Storage** | GCS (inside VPC-SC) | Protected internal data |
| **Distribution Storage** | GCS (outside VPC-SC) | Public access for iOS OTA |
| **Ingress** | External HTTPS Load Balancer | Google-managed SSL, Cloud Armor |
| **Auth** | NextAuth.js (pluggable) | Email/password + optional SSO |
| **CI/CD** | GitHub Actions | Workload Identity Federation |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMATE - ENTERPRISE GCP ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     PUBLIC INTERNET                                  │    │
│  │         (User devices - mobile phones, laptops)                      │    │
│  └───────────────────────────┬─────────────────────────────────────────┘    │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      CLOUD ARMOR                                     │    │
│  │              (WAF / DDoS Protection Policy)                          │    │
│  │              - XSS protection                                        │    │
│  │              - SQL injection protection                              │    │
│  │              - Rate limiting (100 req/min/IP)                        │    │
│  │              - Auth endpoint protection (10 req/min/IP)              │    │
│  └───────────────────────────┬─────────────────────────────────────────┘    │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                 EXTERNAL HTTPS LOAD BALANCER                         │    │
│  │                                                                      │    │
│  │   Domain: deploymate.example.com                                     │    │
│  │   SSL: Google-managed certificate                                    │    │
│  │                                                                      │    │
│  │   URL Routing:                                                       │    │
│  │   ┌────────────────────────────────────────────────────────────┐    │    │
│  │   │  Path                      │  Backend                      │    │    │
│  │   ├────────────────────────────┼───────────────────────────────┤    │    │
│  │   │  /*  (default)             │  Cloud Run (app)              │    │    │
│  │   │  /dist/*                   │  Backend Bucket (distribution)│    │    │
│  │   └────────────────────────────┴───────────────────────────────┘    │    │
│  │                                                                      │    │
│  └───────────┬─────────────────────────────────┬───────────────────────┘    │
│              │                                 │                            │
│              ▼                                 ▼                            │
│  ┌───────────────────────┐       ┌────────────────────────────────────┐     │
│  │      CLOUD RUN        │       │  GCS - DISTRIBUTION BUCKET         │     │
│  │                       │       │  (OUTSIDE VPC-SC PERIMETER)        │     │
│  │  deploymate-app       │       │                                    │     │
│  │                       │       │  Bucket: deploymate-dist-{env}     │     │
│  │  Container:           │       │                                    │     │
│  │  - Next.js 14 app     │       │  Contents:                         │     │
│  │  - API routes         │       │  ├─ /releases/{id}/{file}.ipa     │     │
│  │  - Auth (NextAuth)    │       │  ├─ /releases/{id}/{file}.apk     │     │
│  │  - Manifest generator │       │  └─ /manifests/{id}/manifest.plist│     │
│  │                       │       │                                    │     │
│  │  Scaling: 1-10        │       │  Access Control:                   │     │
│  │  CPU: 2 vCPU          │       │  - NOT public                      │     │
│  │  Memory: 2 GB         │       │  - Signed URLs only (1hr TTL)      │     │
│  │                       │       │  - CDN enabled for performance     │     │
│  └───────────┬───────────┘       └────────────────────────────────────┘     │
│              │                                                              │
│              │ (Private connectivity - VPC connector / Private IP)          │
│              │                                                              │
│  ┌───────────┴───────────────────────────────────────────────────────┐      │
│  │                    VPC-SC PERIMETER (Protected Zone)               │      │
│  │                                                                    │      │
│  │  ┌─────────────────────────────────────────────────────────────┐  │      │
│  │  │                                                             │  │      │
│  │  │   ┌─────────────────┐       ┌─────────────────────────┐    │  │      │
│  │  │   │   CLOUD SQL     │       │   GCS - APP BUCKET      │    │  │      │
│  │  │   │                 │       │   (INSIDE VPC-SC)       │    │  │      │
│  │  │   │ PostgreSQL 15   │       │                         │    │  │      │
│  │  │   │                 │       │ deploymate-app-{env}    │    │  │      │
│  │  │   │ Tables:         │       │                         │    │  │      │
│  │  │   │ - users         │       │ Contents:               │    │  │      │
│  │  │   │ - organizations │       │ ├─ /icons/{appId}/      │    │  │      │
│  │  │   │ - memberships   │       │ ├─ /temp-uploads/       │    │  │      │
│  │  │   │ - apps          │       │ └─ /backups/            │    │  │      │
│  │  │   │ - releases      │       │                         │    │  │      │
│  │  │   │ - groups        │       │ Access Control:         │    │  │      │
│  │  │   │ - invitations   │       │ - Service account only  │    │  │      │
│  │  │   │ - api_tokens    │       │ - No external access    │    │  │      │
│  │  │   │ - download_logs │       │                         │    │  │      │
│  │  │   │ - feedback      │       │                         │    │  │      │
│  │  │   │                 │       │                         │    │  │      │
│  │  │   │ Connection:     │       │                         │    │  │      │
│  │  │   │ Unix socket     │       │                         │    │  │      │
│  │  │   │ (Cloud SQL      │       │                         │    │  │      │
│  │  │   │  connector)     │       │                         │    │  │      │
│  │  │   │                 │       │                         │    │  │      │
│  │  │   └─────────────────┘       └─────────────────────────┘    │  │      │
│  │  │                                                             │  │      │
│  │  └─────────────────────────────────────────────────────────────┘  │      │
│  │                                                                    │      │
│  └────────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐      │
│  │                         SECRET MANAGER                             │      │
│  │                                                                    │      │
│  │   Secrets:                                                         │      │
│  │   ├─ deploymate-database-url                                       │      │
│  │   ├─ deploymate-nextauth-secret                                    │      │
│  │   ├─ deploymate-sso-client-secret (optional)                       │      │
│  │   └─ deploymate-api-token-salt                                     │      │
│  │                                                                    │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐      │
│  │                    CI/CD - GITHUB ACTIONS                          │      │
│  │                                                                    │      │
│  │   Authentication: Workload Identity Federation (no static keys)    │      │
│  │                                                                    │      │
│  │   Pipeline Steps:                                                  │      │
│  │   1. Checkout code                                                 │      │
│  │   2. Authenticate via WIF                                          │      │
│  │   3. Build Docker image                                            │      │
│  │   4. Push to Artifact Registry                                     │      │
│  │   5. Deploy to Cloud Run                                           │      │
│  │   6. Run database migrations                                       │      │
│  │                                                                    │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Critical Design Decision: Dual-Bucket Storage Pattern

### Why Two Buckets?

iOS OTA installation (`itms-services://` protocol) requires the manifest.plist and .ipa files to be accessible via public HTTPS from personal mobile devices. In enterprise GCP environments with VPC Service Controls (VPC-SC), signed URLs are blocked for requests originating outside the security perimeter.

**Solution:** Two separate GCS buckets with different security postures.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DUAL-BUCKET STORAGE PATTERN                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │     APP BUCKET (Protected)      │   │   DISTRIBUTION BUCKET (Public)  │  │
│  │     Inside VPC-SC Perimeter     │   │   Outside VPC-SC Perimeter      │  │
│  ├─────────────────────────────────┤   ├─────────────────────────────────┤  │
│  │                                 │   │                                 │  │
│  │  Name: deploymate-app-{env}     │   │  Name: deploymate-dist-{env}    │  │
│  │                                 │   │                                 │  │
│  │  Contents:                      │   │  Contents:                      │  │
│  │  ├─ /icons/{appId}/icon.png    │   │  ├─ /releases/{releaseId}/     │  │
│  │  ├─ /temp-uploads/{uuid}       │   │  │   └─ {filename}.ipa         │  │
│  │  └─ /backups/                  │   │  │   └─ {filename}.apk         │  │
│  │                                 │   │  └─ /manifests/{releaseId}/    │  │
│  │                                 │   │      └─ manifest.plist         │  │
│  │  Access:                        │   │                                 │  │
│  │  ├─ Service account only       │   │  Access:                        │  │
│  │  ├─ No signed URLs exposed     │   │  ├─ Signed URLs (1hr TTL)       │  │
│  │  └─ Backend serves files       │   │  ├─ CDN enabled                 │  │
│  │      via streaming             │   │  └─ No public listing           │  │
│  │                                 │   │                                 │  │
│  │  Use Cases:                     │   │  Use Cases:                     │  │
│  │  ├─ App icons (served by app)  │   │  ├─ iOS OTA installation        │  │
│  │  ├─ Temporary upload storage   │   │  ├─ Android APK downloads       │  │
│  │  └─ Database backups           │   │  └─ manifest.plist serving      │  │
│  │                                 │   │                                 │  │
│  └─────────────────────────────────┘   └─────────────────────────────────┘  │
│                                                                             │
│  Data Flow:                                                                 │
│  ───────────                                                                │
│  1. User uploads .ipa/.apk → Temp storage in APP BUCKET                     │
│  2. Server parses metadata, validates file                                  │
│  3. Server copies file to DISTRIBUTION BUCKET                               │
│  4. Server generates manifest.plist → DISTRIBUTION BUCKET                   │
│  5. Temp file deleted from APP BUCKET                                       │
│  6. Release record created in database with distribution paths              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Storage Adapter Interface

```typescript
// src/lib/storage/types.ts

/**
 * Storage configuration for enterprise GCP deployment.
 * Supports dual-bucket pattern for VPC-SC environments.
 */
export interface StorageConfig {
  /** Bucket for internal app data (inside VPC-SC) */
  appBucket: string;
  
  /** Bucket for public distribution files (outside VPC-SC) */
  distributionBucket: string;
  
  /** GCP project ID */
  projectId: string;
  
  /** Base URL for distribution (load balancer domain) */
  distributionBaseUrl: string;
  
  /** Default signed URL TTL in seconds */
  defaultSignedUrlTtl: number;
}

export interface UploadResult {
  /** Storage key/path for the file */
  key: string;
  
  /** File size in bytes */
  size: number;
  
  /** Content type */
  contentType: string;
  
  /** MD5 hash of file contents */
  md5Hash: string;
}

export interface SignedUrlOptions {
  /** Time-to-live in seconds (default: 3600) */
  ttlSeconds?: number;
  
  /** Content type for response */
  contentType?: string;
  
  /** Filename for Content-Disposition header */
  downloadFilename?: string;
}

export interface StorageAdapter {
  /**
   * Upload a file to the app bucket (internal).
   * Used for icons, temp uploads, etc.
   */
  uploadToAppBucket(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<UploadResult>;
  
  /**
   * Upload a file to the distribution bucket (public via signed URLs).
   * Used for .ipa, .apk, and manifest.plist files.
   */
  uploadToDistributionBucket(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<UploadResult>;
  
  /**
   * Get a signed URL for a file in the distribution bucket.
   * Used for iOS OTA and Android downloads.
   */
  getDistributionSignedUrl(
    key: string,
    options?: SignedUrlOptions
  ): Promise<string>;
  
  /**
   * Read a file from the app bucket.
   * Used for serving icons via the app backend.
   */
  readFromAppBucket(key: string): Promise<Buffer>;
  
  /**
   * Delete a file from either bucket.
   */
  delete(bucket: 'app' | 'distribution', key: string): Promise<void>;
  
  /**
   * Check if a file exists.
   */
  exists(bucket: 'app' | 'distribution', key: string): Promise<boolean>;
  
  /**
   * Copy file from app bucket to distribution bucket.
   * Used after processing upload to move release binary.
   */
  copyToDistribution(appKey: string, distributionKey: string): Promise<void>;
}
```

### 2. GCS Storage Adapter Implementation

```typescript
// src/lib/storage/gcs-enterprise-adapter.ts

import { Storage, Bucket } from '@google-cloud/storage';
import { createHash } from 'crypto';
import { 
  StorageAdapter, 
  StorageConfig, 
  UploadResult, 
  SignedUrlOptions 
} from './types';

/**
 * GCS Storage Adapter for Enterprise GCP environments.
 * 
 * Implements dual-bucket pattern:
 * - App bucket: Inside VPC-SC, accessed by service account only
 * - Distribution bucket: Outside VPC-SC, accessed via signed URLs
 * 
 * This adapter is designed for environments where VPC Service Controls
 * would block signed URL access from external devices.
 */
export class GCSEnterpriseAdapter implements StorageAdapter {
  private storage: Storage;
  private appBucket: Bucket;
  private distBucket: Bucket;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    
    // Initialize GCS client
    // In Cloud Run, uses default service account automatically
    this.storage = new Storage({
      projectId: config.projectId,
    });
    
    this.appBucket = this.storage.bucket(config.appBucket);
    this.distBucket = this.storage.bucket(config.distributionBucket);
  }

  async uploadToAppBucket(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<UploadResult> {
    const file = this.appBucket.file(key);
    
    await file.save(buffer, {
      contentType,
      resumable: false, // Disable for small files
      validation: 'md5',
    });

    const md5Hash = createHash('md5').update(buffer).digest('base64');

    return {
      key,
      size: buffer.length,
      contentType,
      md5Hash,
    };
  }

  async uploadToDistributionBucket(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<UploadResult> {
    const file = this.distBucket.file(key);
    
    await file.save(buffer, {
      contentType,
      resumable: buffer.length > 5 * 1024 * 1024, // Resumable for >5MB
      validation: 'md5',
      metadata: {
        // Cache control for CDN
        cacheControl: 'public, max-age=3600',
      },
    });

    const md5Hash = createHash('md5').update(buffer).digest('base64');

    return {
      key,
      size: buffer.length,
      contentType,
      md5Hash,
    };
  }

  async getDistributionSignedUrl(
    key: string,
    options: SignedUrlOptions = {}
  ): Promise<string> {
    const { 
      ttlSeconds = this.config.defaultSignedUrlTtl,
      contentType,
      downloadFilename,
    } = options;

    const file = this.distBucket.file(key);
    
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + ttlSeconds * 1000,
      // Response headers
      responseDisposition: downloadFilename
        ? `attachment; filename="${downloadFilename}"`
        : undefined,
      responseType: contentType,
    });

    return url;
  }

  async readFromAppBucket(key: string): Promise<Buffer> {
    const file = this.appBucket.file(key);
    const [buffer] = await file.download();
    return buffer;
  }

  async delete(bucket: 'app' | 'distribution', key: string): Promise<void> {
    const targetBucket = bucket === 'app' ? this.appBucket : this.distBucket;
    const file = targetBucket.file(key);
    
    try {
      await file.delete();
    } catch (error: any) {
      // Ignore "not found" errors
      if (error.code !== 404) {
        throw error;
      }
    }
  }

  async exists(bucket: 'app' | 'distribution', key: string): Promise<boolean> {
    const targetBucket = bucket === 'app' ? this.appBucket : this.distBucket;
    const file = targetBucket.file(key);
    const [exists] = await file.exists();
    return exists;
  }

  async copyToDistribution(
    appKey: string, 
    distributionKey: string
  ): Promise<void> {
    const sourceFile = this.appBucket.file(appKey);
    const destFile = this.distBucket.file(distributionKey);
    
    await sourceFile.copy(destFile);
  }
}

/**
 * Factory function to create storage adapter based on environment.
 */
export function createStorageAdapter(): StorageAdapter {
  const config: StorageConfig = {
    appBucket: process.env.GCS_APP_BUCKET!,
    distributionBucket: process.env.GCS_DISTRIBUTION_BUCKET!,
    projectId: process.env.GCP_PROJECT_ID!,
    distributionBaseUrl: process.env.DISTRIBUTION_BASE_URL!,
    defaultSignedUrlTtl: parseInt(process.env.SIGNED_URL_TTL || '3600', 10),
  };

  // Validate required config
  if (!config.appBucket || !config.distributionBucket) {
    throw new Error(
      'Missing required storage configuration. ' +
      'Set GCS_APP_BUCKET and GCS_DISTRIBUTION_BUCKET environment variables.'
    );
  }

  return new GCSEnterpriseAdapter(config);
}
```

### 3. iOS OTA Manifest Generation

```typescript
// src/lib/distribution/ios-manifest.ts

import { createStorageAdapter } from '@/lib/storage/gcs-enterprise-adapter';

export interface ManifestOptions {
  /** Signed URL for the IPA file */
  ipaUrl: string;
  
  /** App bundle identifier */
  bundleId: string;
  
  /** App version string */
  version: string;
  
  /** App display name */
  title: string;
  
  /** Optional icon URL (57x57) */
  iconUrl?: string;
  
  /** Optional large icon URL (512x512) */
  fullSizeIconUrl?: string;
}

/**
 * Generate iOS OTA manifest.plist content.
 * 
 * This manifest tells iOS where to download the app and its metadata.
 * The IPA URL must be a signed URL accessible from the device.
 */
export function generateManifestPlist(options: ManifestOptions): string {
  const { ipaUrl, bundleId, version, title, iconUrl, fullSizeIconUrl } = options;

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

  if (fullSizeIconUrl) {
    assetsXml += `
                <dict>
                    <key>kind</key>
                    <string>full-size-image</string>
                    <key>url</key>
                    <string>${escapeXml(fullSizeIconUrl)}</string>
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

/**
 * Generate and upload manifest.plist, return signed URL for itms-services.
 */
export async function createIOSInstallManifest(
  releaseId: string,
  release: {
    bundleId: string;
    version: string;
    fileKey: string;
    app: { name: string; iconUrl?: string };
  },
  ttlSeconds: number = 3600
): Promise<{ manifestUrl: string; installUrl: string }> {
  const storage = createStorageAdapter();

  // Generate signed URL for IPA (must be accessible from phone)
  const ipaUrl = await storage.getDistributionSignedUrl(release.fileKey, {
    ttlSeconds,
    contentType: 'application/octet-stream',
  });

  // Generate manifest content
  const manifestContent = generateManifestPlist({
    ipaUrl,
    bundleId: release.bundleId,
    version: release.version,
    title: release.app.name,
    iconUrl: release.app.iconUrl,
  });

  // Upload manifest to distribution bucket
  const manifestKey = `manifests/${releaseId}/manifest.plist`;
  await storage.uploadToDistributionBucket(
    Buffer.from(manifestContent, 'utf-8'),
    manifestKey,
    'application/xml'
  );

  // Generate signed URL for manifest
  const manifestUrl = await storage.getDistributionSignedUrl(manifestKey, {
    ttlSeconds,
    contentType: 'application/xml',
  });

  // Build itms-services URL
  const installUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`;

  return { manifestUrl, installUrl };
}
```

### 4. Install Link API Endpoint

```typescript
// src/app/api/v1/releases/[id]/install-link/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createIOSInstallManifest } from '@/lib/distribution/ios-manifest';
import { createStorageAdapter } from '@/lib/storage/gcs-enterprise-adapter';

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/v1/releases/:id/install-link
 * 
 * Generate a time-limited install link for a release.
 * - iOS: Returns itms-services:// URL with signed manifest
 * - Android: Returns signed URL for direct APK download
 * 
 * Security:
 * - User must be authenticated
 * - User must have access to the release (via distribution group)
 * - Download attempt is logged for audit
 * - URLs expire after 1 hour (configurable)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Verify authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // Get release with app info
  const release = await db.release.findUnique({
    where: { id: params.id },
    include: {
      app: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!release) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Release not found' } },
      { status: 404 }
    );
  }

  // Check user has access to this release
  const hasAccess = await checkUserAccessToRelease(session.user.id, release.id);
  if (!hasAccess) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied to this release' } },
      { status: 403 }
    );
  }

  // Log the download attempt (audit trail)
  await db.downloadLog.create({
    data: {
      releaseId: release.id,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      action: 'INSTALL_LINK_GENERATED',
    },
  });

  // Generate install URL based on platform
  const ttlSeconds = 3600; // 1 hour
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  if (release.app.platform === 'IOS') {
    // iOS: Generate manifest and itms-services URL
    const { installUrl } = await createIOSInstallManifest(
      release.id,
      {
        bundleId: release.bundleId || release.app.bundleId,
        version: release.version,
        fileKey: release.fileKey,
        app: {
          name: release.app.name,
          iconUrl: release.app.iconUrl || undefined,
        },
      },
      ttlSeconds
    );

    return NextResponse.json({
      success: true,
      data: {
        platform: 'IOS',
        installUrl,
        expiresAt: expiresAt.toISOString(),
        instructions: 'Open this link in Safari on your iOS device to install the app.',
      },
    });
  } else {
    // Android: Generate signed URL for APK
    const storage = createStorageAdapter();
    const downloadUrl = await storage.getDistributionSignedUrl(release.fileKey, {
      ttlSeconds,
      contentType: 'application/vnd.android.package-archive',
      downloadFilename: `${release.app.name}-${release.version}.apk`,
    });

    return NextResponse.json({
      success: true,
      data: {
        platform: 'ANDROID',
        downloadUrl,
        expiresAt: expiresAt.toISOString(),
        instructions: 'Download the APK and tap to install. You may need to enable "Install from unknown sources".',
      },
    });
  }
}

/**
 * Check if user has access to a release via distribution groups.
 */
async function checkUserAccessToRelease(
  userId: string,
  releaseId: string
): Promise<boolean> {
  // Check if user is in any distribution group for this release
  const releaseGroup = await db.releaseGroup.findFirst({
    where: {
      releaseId,
      OR: [
        // App-level group membership
        {
          appDistGroupId: {
            not: null,
          },
          appDistGroup: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
        // Org-level group membership
        {
          orgDistGroupId: {
            not: null,
          },
          orgDistGroup: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      ],
    },
  });

  if (releaseGroup) {
    return true;
  }

  // Also check if user is admin/manager of the app's organization
  const release = await db.release.findUnique({
    where: { id: releaseId },
    include: {
      app: {
        include: {
          organization: {
            include: {
              memberships: {
                where: {
                  userId,
                  role: { in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
                },
              },
            },
          },
        },
      },
    },
  });

  return (release?.app.organization.memberships.length ?? 0) > 0;
}
```

### 5. Release Upload Flow

```typescript
// src/app/api/v1/apps/[appId]/releases/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createStorageAdapter } from '@/lib/storage/gcs-enterprise-adapter';
import { parseIPA } from '@/lib/binary-parser/ipa-parser';
import { parseAPK } from '@/lib/binary-parser/apk-parser';
import { generateId } from '@/lib/utils';

interface RouteParams {
  params: { appId: string };
}

/**
 * POST /api/v1/apps/:appId/releases
 * 
 * Upload a new release.
 * 
 * Flow:
 * 1. Receive file upload
 * 2. Store temporarily in app bucket
 * 3. Parse binary metadata (IPA/APK)
 * 4. Copy to distribution bucket
 * 5. Delete temp file
 * 6. Create database record
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED' } },
      { status: 401 }
    );
  }

  // Verify user has Manager+ permission on this app
  const app = await db.app.findUnique({
    where: { id: params.appId },
    include: {
      organization: {
        include: {
          memberships: {
            where: {
              userId: session.user.id,
              role: { in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
            },
          },
        },
      },
    },
  });

  if (!app) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'App not found' } },
      { status: 404 }
    );
  }

  if (app.organization.memberships.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Manager role required' } },
      { status: 403 }
    );
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const releaseType = formData.get('releaseType') as string;
  const releaseNotes = formData.get('releaseNotes') as string | null;

  if (!file) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'File is required' } },
      { status: 400 }
    );
  }

  // Validate file extension
  const fileName = file.name.toLowerCase();
  const isIPA = fileName.endsWith('.ipa');
  const isAPK = fileName.endsWith('.apk');

  if (!isIPA && !isAPK) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'File must be .ipa or .apk' } },
      { status: 400 }
    );
  }

  // Validate platform matches
  if ((app.platform === 'IOS' && !isIPA) || (app.platform === 'ANDROID' && !isAPK)) {
    return NextResponse.json(
      { success: false, error: { 
        code: 'VALIDATION_ERROR', 
        message: `Expected ${app.platform === 'IOS' ? '.ipa' : '.apk'} file for this app` 
      }},
      { status: 400 }
    );
  }

  const storage = createStorageAdapter();
  const releaseId = generateId();
  const buffer = Buffer.from(await file.arrayBuffer());

  // Step 1: Upload to temp location in app bucket
  const tempKey = `temp-uploads/${releaseId}/${file.name}`;
  await storage.uploadToAppBucket(buffer, tempKey, 'application/octet-stream');

  try {
    // Step 2: Parse binary metadata
    let metadata;
    let provisioningData = {};

    if (isIPA) {
      const ipaMetadata = await parseIPA(buffer);
      metadata = {
        bundleId: ipaMetadata.bundleId,
        version: ipaMetadata.version,
        buildNumber: ipaMetadata.buildNumber,
        minOSVersion: ipaMetadata.minimumOSVersion,
      };

      // Extract provisioning info
      if (ipaMetadata.provisioningProfile) {
        provisioningData = {
          provisioningType: ipaMetadata.provisioningProfile.provisioningType,
          provisioningName: ipaMetadata.provisioningProfile.name,
          teamId: ipaMetadata.provisioningProfile.teamId,
          teamName: ipaMetadata.provisioningProfile.teamName,
          provisioningExpiry: ipaMetadata.provisioningProfile.expirationDate,
        };
      }

      // Save icon if extracted
      if (ipaMetadata.iconData) {
        const iconKey = `icons/${app.id}/icon.png`;
        await storage.uploadToAppBucket(ipaMetadata.iconData, iconKey, 'image/png');
        await db.app.update({
          where: { id: app.id },
          data: { iconKey },
        });
      }
    } else {
      const apkMetadata = await parseAPK(buffer);
      metadata = {
        bundleId: apkMetadata.packageName,
        version: apkMetadata.versionName,
        buildNumber: String(apkMetadata.versionCode),
        minOSVersion: apkMetadata.minSdkVersion 
          ? `API ${apkMetadata.minSdkVersion}` 
          : null,
      };

      // Save icon if extracted
      if (apkMetadata.iconData) {
        const iconKey = `icons/${app.id}/icon.png`;
        await storage.uploadToAppBucket(apkMetadata.iconData, iconKey, 'image/png');
        await db.app.update({
          where: { id: app.id },
          data: { iconKey },
        });
      }
    }

    // Step 3: Copy to distribution bucket
    const distKey = `releases/${releaseId}/${file.name}`;
    await storage.copyToDistribution(tempKey, distKey);

    // Step 4: Delete temp file
    await storage.delete('app', tempKey);

    // Step 5: Create database record
    const release = await db.release.create({
      data: {
        id: releaseId,
        appId: app.id,
        version: metadata.version,
        buildNumber: metadata.buildNumber,
        bundleId: metadata.bundleId,
        minOSVersion: metadata.minOSVersion,
        fileKey: distKey,
        fileName: file.name,
        fileSize: buffer.length,
        releaseType: releaseType as 'ALPHA' | 'BETA' | 'RELEASE_CANDIDATE',
        releaseNotes,
        uploadedById: session.user.id,
        ...provisioningData,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: release },
      { status: 201 }
    );
  } catch (error) {
    // Cleanup temp file on error
    await storage.delete('app', tempKey);
    throw error;
  }
}
```

### 6. Authentication Configuration (Pluggable SSO)

```typescript
// src/lib/auth.config.ts

import { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';
import GoogleProvider from 'next-auth/providers/google';
import OktaProvider from 'next-auth/providers/okta';
import { verifyPassword } from '@/lib/auth/password';
import { db } from '@/lib/db';

/**
 * NextAuth configuration with pluggable authentication providers.
 * 
 * Default: Email/Password authentication
 * Enterprise: Add SSO via environment variables (no code changes)
 * 
 * Supported SSO providers (configure via environment):
 * - Azure AD / Entra ID: AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID
 * - Google Workspace: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 * - Okta: OKTA_CLIENT_ID, OKTA_CLIENT_SECRET, OKTA_ISSUER
 */
export const authConfig: NextAuthConfig = {
  providers: [
    // ========================================
    // Default: Email/Password (always available)
    // ========================================
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        
        // Check allowed domains (if configured)
        const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',');
        if (allowedDomains && allowedDomains.length > 0) {
          const domain = email.split('@')[1];
          if (!allowedDomains.includes(domain)) {
            return null;
          }
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),

    // ========================================
    // Enterprise SSO: Azure AD / Entra ID
    // ========================================
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
            authorization: {
              params: {
                scope: 'openid email profile User.Read',
              },
            },
          }),
        ]
      : []),

    // ========================================
    // Enterprise SSO: Google Workspace
    // ========================================
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                // Restrict to specific Google Workspace domain
                hd: process.env.GOOGLE_WORKSPACE_DOMAIN,
              },
            },
          }),
        ]
      : []),

    // ========================================
    // Enterprise SSO: Okta
    // ========================================
    ...(process.env.OKTA_CLIENT_ID && process.env.OKTA_CLIENT_SECRET
      ? [
          OktaProvider({
            clientId: process.env.OKTA_CLIENT_ID,
            clientSecret: process.env.OKTA_CLIENT_SECRET,
            issuer: process.env.OKTA_ISSUER,
          }),
        ]
      : []),
  ],

  callbacks: {
    /**
     * Handle sign-in - create user if SSO first login
     */
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return false;
      }

      const email = user.email.toLowerCase();

      // Check allowed domains
      const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',');
      if (allowedDomains && allowedDomains.length > 0) {
        const domain = email.split('@')[1];
        if (!allowedDomains.includes(domain)) {
          return false;
        }
      }

      // For SSO providers, create user on first login
      if (account?.provider !== 'credentials') {
        const existingUser = await db.user.findUnique({
          where: { email },
        });

        if (!existingUser) {
          await db.user.create({
            data: {
              email,
              name: user.name || email.split('@')[0],
              emailVerified: new Date(),
              // No password hash - SSO only
            },
          });
        } else if (!existingUser.emailVerified) {
          // Mark as verified since SSO confirms email
          await db.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: new Date() },
          });
        }
      }

      return true;
    },

    /**
     * Add user ID to JWT token
     */
    async jwt({ token, user, account }) {
      if (user) {
        // Get user ID from database
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: { id: true },
        });
        token.userId = dbUser?.id;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },

    /**
     * Add user ID to session
     */
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
};
```

---

## Environment Variables

```bash
# .env.example

# ============================================
# Required Configuration
# ============================================

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/deploymate"

# NextAuth
NEXTAUTH_URL="https://deploymate.example.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# GCP Storage (Enterprise dual-bucket pattern)
GCP_PROJECT_ID="your-project-id"
GCS_APP_BUCKET="deploymate-app-prod"
GCS_DISTRIBUTION_BUCKET="deploymate-dist-prod"
DISTRIBUTION_BASE_URL="https://deploymate.example.com"
SIGNED_URL_TTL="3600"

# ============================================
# Optional: Email Domain Restriction
# ============================================
# Comma-separated list of allowed email domains
# Leave empty to allow any domain
ALLOWED_EMAIL_DOMAINS="example.com,subsidiary.com"

# ============================================
# Optional: Disable credential registration
# ============================================
# Set to "true" to only allow SSO login (no email/password signup)
DISABLE_CREDENTIALS_REGISTRATION="false"

# ============================================
# Optional: SSO Providers
# Configure one or more for enterprise SSO
# ============================================

# Azure AD / Microsoft Entra ID
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""

# Google Workspace
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_WORKSPACE_DOMAIN=""

# Okta
OKTA_CLIENT_ID=""
OKTA_CLIENT_SECRET=""
OKTA_ISSUER=""
```

---

## Terraform Infrastructure

```hcl
# terraform/main.tf

terraform {
  required_version = ">= 1.5"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    bucket = "your-terraform-state-bucket"
    prefix = "deploymate"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ============================================
# Variables
# ============================================

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "domain" {
  description = "Domain for the application"
  type        = string
}

# ============================================
# Service Account
# ============================================

resource "google_service_account" "cloud_run" {
  account_id   = "deploymate-${var.environment}"
  display_name = "DeployMate Cloud Run Service Account"
}

# ============================================
# GCS Buckets
# ============================================

# App bucket (inside VPC-SC perimeter)
resource "google_storage_bucket" "app" {
  name     = "deploymate-app-${var.environment}"
  location = var.region
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = false
  }
  
  lifecycle_rule {
    condition {
      age = 7
      matches_prefix = ["temp-uploads/"]
    }
    action {
      type = "Delete"
    }
  }
}

# Distribution bucket (outside VPC-SC perimeter)
resource "google_storage_bucket" "distribution" {
  name     = "deploymate-dist-${var.environment}"
  location = var.region
  
  uniform_bucket_level_access = true
  
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type", "Content-Length", "Content-Disposition"]
    max_age_seconds = 3600
  }
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
}

# IAM bindings
resource "google_storage_bucket_iam_member" "app_admin" {
  bucket = google_storage_bucket.app.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_storage_bucket_iam_member" "dist_admin" {
  bucket = google_storage_bucket.distribution.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}

# ============================================
# Cloud SQL
# ============================================

resource "google_sql_database_instance" "main" {
  name             = "deploymate-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.environment == "prod" ? "db-custom-2-4096" : "db-f1-micro"
    availability_type = var.environment == "prod" ? "REGIONAL" : "ZONAL"
    
    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = var.environment == "prod"
    }

    ip_configuration {
      ipv4_enabled = false
    }
  }

  deletion_protection = var.environment == "prod"
}

resource "google_sql_database" "app" {
  name     = "deploymate"
  instance = google_sql_database_instance.main.name
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "google_sql_user" "app" {
  name     = "deploymate"
  instance = google_sql_database_instance.main.name
  password = random_password.db_password.result
}

# ============================================
# Secret Manager
# ============================================

resource "google_secret_manager_secret" "database_url" {
  secret_id = "deploymate-database-url"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "database_url" {
  secret = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://deploymate:${random_password.db_password.result}@localhost/${google_sql_database.app.name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
}

resource "google_secret_manager_secret" "nextauth_secret" {
  secret_id = "deploymate-nextauth-secret"
  
  replication {
    auto {}
  }
}

resource "random_password" "nextauth_secret" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret_version" "nextauth_secret" {
  secret      = google_secret_manager_secret.nextauth_secret.id
  secret_data = random_password.nextauth_secret.result
}

# Secret accessor for Cloud Run
resource "google_secret_manager_secret_iam_member" "database_url_accessor" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "nextauth_accessor" {
  secret_id = google_secret_manager_secret.nextauth_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

# ============================================
# Cloud Run
# ============================================

resource "google_cloud_run_v2_service" "app" {
  name     = "deploymate"
  location = var.region
  
  template {
    service_account = google_service_account.cloud_run.email
    
    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }
    
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/deploymate/app:latest"
      
      ports {
        container_port = 3000
      }
      
      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }
      
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      
      env {
        name  = "GCS_APP_BUCKET"
        value = google_storage_bucket.app.name
      }
      
      env {
        name  = "GCS_DISTRIBUTION_BUCKET"
        value = google_storage_bucket.distribution.name
      }
      
      env {
        name  = "NEXTAUTH_URL"
        value = "https://${var.domain}"
      }
      
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }
      
      env {
        name = "NEXTAUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.nextauth_secret.secret_id
            version = "latest"
          }
        }
      }
    }
    
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }
  }
  
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# Allow unauthenticated access (auth handled by app)
resource "google_cloud_run_service_iam_member" "public" {
  location = google_cloud_run_v2_service.app.location
  service  = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ============================================
# Load Balancer
# ============================================

resource "google_compute_global_address" "default" {
  name = "deploymate-ip"
}

resource "google_compute_managed_ssl_certificate" "default" {
  name = "deploymate-cert"
  
  managed {
    domains = [var.domain]
  }
}

resource "google_compute_region_network_endpoint_group" "cloud_run" {
  name                  = "deploymate-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"
  
  cloud_run {
    service = google_cloud_run_v2_service.app.name
  }
}

resource "google_compute_backend_service" "cloud_run" {
  name                  = "deploymate-backend"
  protocol              = "HTTP"
  port_name             = "http"
  timeout_sec           = 300
  load_balancing_scheme = "EXTERNAL"
  
  backend {
    group = google_compute_region_network_endpoint_group.cloud_run.id
  }
  
  security_policy = google_compute_security_policy.default.id
}

resource "google_compute_backend_bucket" "distribution" {
  name        = "deploymate-dist-backend"
  bucket_name = google_storage_bucket.distribution.name
  enable_cdn  = true
}

resource "google_compute_url_map" "default" {
  name            = "deploymate-url-map"
  default_service = google_compute_backend_service.cloud_run.id
  
  host_rule {
    hosts        = [var.domain]
    path_matcher = "main"
  }
  
  path_matcher {
    name            = "main"
    default_service = google_compute_backend_service.cloud_run.id
    
    path_rule {
      paths   = ["/dist/*"]
      service = google_compute_backend_bucket.distribution.id
    }
  }
}

resource "google_compute_target_https_proxy" "default" {
  name             = "deploymate-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]
}

resource "google_compute_global_forwarding_rule" "https" {
  name                  = "deploymate-https"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL"
  port_range            = "443"
  target                = google_compute_target_https_proxy.default.id
  ip_address            = google_compute_global_address.default.id
}

# ============================================
# Cloud Armor
# ============================================

resource "google_compute_security_policy" "default" {
  name = "deploymate-security-policy"
  
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow"
  }
  
  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "XSS protection"
  }
  
  rule {
    action   = "deny(403)"
    priority = "1001"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "SQL injection protection"
  }
  
  rule {
    action   = "throttle"
    priority = "2000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
    }
    description = "Rate limiting"
  }
}

# ============================================
# Outputs
# ============================================

output "load_balancer_ip" {
  value = google_compute_global_address.default.address
}

output "cloud_run_url" {
  value = google_cloud_run_v2_service.app.uri
}

output "app_bucket" {
  value = google_storage_bucket.app.name
}

output "distribution_bucket" {
  value = google_storage_bucket.distribution.name
}
```

---

## Summary for Coding Agent

When implementing DeployMate for enterprise GCP deployment:

### Key Implementation Points

1. **Storage Pattern:** Implement `GCSEnterpriseAdapter` with dual-bucket pattern
   - App bucket: Internal data (inside VPC-SC)
   - Distribution bucket: Release binaries (outside VPC-SC for iOS OTA)

2. **iOS OTA Flow:** 
   - Generate signed URL for .ipa → embed in manifest.plist → upload manifest → generate signed URL for manifest → return `itms-services://` URL

3. **Authentication:** 
   - Default: Email/password via CredentialsProvider
   - Enterprise SSO: Enable via environment variables (no code changes)

4. **Release Upload:** 
   - Temp upload to app bucket → parse metadata → copy to distribution bucket → cleanup temp → create DB record

5. **Infrastructure:**
   - Cloud Run for compute
   - Cloud SQL PostgreSQL for database
   - External HTTPS LB with Cloud Armor
   - Google-managed SSL certificate

---

*This document is designed for use with AI coding agents and developers implementing DeployMate in enterprise GCP environments.*
