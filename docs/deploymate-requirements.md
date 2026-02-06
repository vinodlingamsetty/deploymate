# DeployMate: Complete Requirements & Architecture Document

> **Version:** 2.0.0  
> **Last Updated:** February 2025  
> **Status:** Ready for Development  
> **License:** Apache 2.0 (Open Source, Self-Hosted Only)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Decisions (LOCKED)](#2-project-decisions-locked)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [Storage Adapters (BYOC)](#5-storage-adapters-byoc)
6. [Database Schema](#6-database-schema)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [API Specification](#8-api-specification)
9. [UI/UX Specification](#9-uiux-specification)
10. [Accessibility Requirements](#10-accessibility-requirements)
11. [Development Phases](#11-development-phases)
12. [Deployment & Self-Hosting](#12-deployment--self-hosting)
13. [Website & Documentation](#13-website--documentation)
14. [AI Development Guidelines](#14-ai-development-guidelines)

---

## 1. Executive Summary

### 1.1 What is DeployMate?

DeployMate is an **open-source, self-hosted platform** for distributing beta iOS (.ipa) and Android (.apk) applications to testers. It is an alternative to Microsoft App Center, TestFlight, and Firebase App Distribution.

### 1.2 Core Principles

| Principle | Description |
|-----------|-------------|
| **Self-Hosted Only** | No managed/cloud version. Users deploy on their own infrastructure. |
| **BYOC (Bring Your Own Cloud)** | Users configure their own storage (AWS S3, GCP, Azure, Salesforce). |
| **Open Source** | Apache 2.0 license. Free to use, modify, and distribute. |
| **Zero Vendor Lock-in** | Works with any cloud provider or on-premises infrastructure. |
| **Invite-Only Access** | Users can only join organizations via email invitation. No self-registration into orgs. |

### 1.3 Target Users

- Enterprise IT teams wanting full control over beta distribution
- Development agencies managing multiple client apps
- Companies with data sovereignty requirements
- Teams needing on-premises deployment

### 1.4 What DeployMate is NOT

- ❌ NOT a managed SaaS service (no cloud hosting by us)
- ❌ NOT a commercial product (no paid tiers, no subscriptions)
- ❌ NOT providing customer support (community-driven via GitHub)
- ❌ Does NOT handle Apple Enterprise Certificate compliance (user's responsibility)

---

## 2. Project Decisions (LOCKED)

**These decisions are FINAL and must not be changed during development:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Hosting Model** | Self-hosted only | No managed service complexity, user accountability |
| **License** | Apache 2.0 | Maximum enterprise adoption, permissive |
| **Cloud Storage** | BYOC with adapters | AWS S3, GCP Cloud Storage, Azure Blob, Salesforce Files, Local |
| **Organization Model** | Invite-only (Model B) | Prevents duplicate orgs, ensures accountability |
| **Architecture** | Monorepo | Single deployment, easier contributions |
| **Framework** | Next.js 14+ (App Router) | Full-stack, excellent AI training data |
| **Database** | PostgreSQL | Reliable, self-hostable, excellent tooling |
| **Starting Point** | Fresh Next.js project | Do NOT use v0 export directly; reference it for UI only |
| **Billing/Payments** | NONE | No monetization features, no billing tab |
| **Settings Tabs** | 4 tabs only | Profile, Notifications, Organizations, API Tokens |

---

## 3. Technology Stack

### 3.1 Complete Stack Specification

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  Framework:        Next.js 14.x (App Router, NOT Pages Router)  │
│  Language:         TypeScript 5.x (strict mode enabled)         │
│  Styling:          Tailwind CSS 4.x                             │
│  Components:       shadcn/ui (copy into project, customize)     │
│  Icons:            Lucide React                                 │
│  Forms:            React Hook Form + Zod validation             │
│  State:            URL params (filters) + React state (UI)      │
│  Fonts:            Space Grotesk (UI) + Courier Prime (mono)    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  API:              Next.js Route Handlers (app/api/*)           │
│  Database:         PostgreSQL 15+                               │
│  ORM:              Prisma 5.x                                   │
│  Authentication:   NextAuth.js v5 (Auth.js) - Credentials only  │
│  File Processing:  BullMQ + Redis (background jobs)             │
│  Binary Parsing:   Custom (plist, adm-zip, apk-parser)          │
│  Password Hashing: Argon2                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE ADAPTERS (BYOC)                       │
├─────────────────────────────────────────────────────────────────┤
│  AWS S3:           @aws-sdk/client-s3                           │
│  GCP Storage:      @google-cloud/storage                        │
│  Azure Blob:       @azure/storage-blob                          │
│  Salesforce:       jsforce (Salesforce Files/ContentVersion)    │
│  Local:            Node.js fs (development/small deployments)   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE                              │
├─────────────────────────────────────────────────────────────────┤
│  Containerization: Docker + Docker Compose                      │
│  Process Manager:  PM2 (for non-Docker deployments)             │
│  Reverse Proxy:    Nginx (optional, for production)             │
│  CI/CD:            GitHub Actions (for testing/building)        │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Package Versions (Use These Exact Versions)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "@prisma/client": "^5.14.0",
    "next-auth": "^5.0.0-beta.18",
    "zod": "^3.23.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.0",
    "tailwindcss": "^4.0.0",
    "lucide-react": "^0.378.0",
    "@aws-sdk/client-s3": "^3.577.0",
    "@aws-sdk/s3-request-presigner": "^3.577.0",
    "@google-cloud/storage": "^7.11.0",
    "@azure/storage-blob": "^12.17.0",
    "jsforce": "^1.11.0",
    "bullmq": "^5.7.0",
    "ioredis": "^5.4.0",
    "argon2": "^0.40.0",
    "adm-zip": "^0.5.12",
    "plist": "^3.1.0"
  },
  "devDependencies": {
    "prisma": "^5.14.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "@typescript-eslint/eslint-plugin": "^7.8.0"
  }
}
```

---

## 4. Repository Structure

### 4.1 Monorepo Layout (EXACT Structure to Follow)

```
deploymate/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint, type-check, test on PR
│   │   ├── build.yml                 # Build Docker image on release
│   │   └── docs.yml                  # Build documentation site
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
│
├── apps/
│   └── web/                          # Main Next.js application
│       ├── src/
│       │   ├── app/                  # App Router pages
│       │   │   ├── (auth)/           # Auth pages (no dashboard layout)
│       │   │   │   ├── login/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── setup/        # First user setup
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── register/     # Invitation acceptance
│       │   │   │   │   └── page.tsx
│       │   │   │   └── layout.tsx
│       │   │   │
│       │   │   ├── (dashboard)/      # Dashboard pages (with layout)
│       │   │   │   ├── dashboard/
│       │   │   │   │   └── page.tsx  # Main apps view
│       │   │   │   ├── apps/
│       │   │   │   │   └── [id]/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── releases/
│       │   │   │   │   └── [id]/
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── groups/
│       │   │   │   │   └── page.tsx  # Requires ?org= param
│       │   │   │   ├── settings/
│       │   │   │   │   └── page.tsx  # 4 tabs: Profile, Notifications, Orgs, Tokens
│       │   │   │   └── layout.tsx    # Dashboard layout
│       │   │   │
│       │   │   ├── api/
│       │   │   │   ├── auth/
│       │   │   │   │   └── [...nextauth]/
│       │   │   │   │       └── route.ts
│       │   │   │   └── v1/           # Versioned API
│       │   │   │       ├── apps/
│       │   │   │       │   ├── route.ts              # GET, POST
│       │   │   │       │   └── [id]/
│       │   │   │       │       ├── route.ts          # GET, PATCH, DELETE
│       │   │   │       │       ├── releases/
│       │   │   │       │       │   ├── route.ts      # GET, POST
│       │   │   │       │       │   ├── upload-url/
│       │   │   │       │       │   │   └── route.ts  # POST
│       │   │   │       │       │   └── latest/
│       │   │   │       │       │       └── route.ts  # GET
│       │   │   │       │       └── groups/
│       │   │   │       │           └── route.ts      # GET, POST
│       │   │   │       ├── releases/
│       │   │   │       │   └── [id]/
│       │   │   │       │       ├── route.ts          # GET, DELETE
│       │   │   │       │       └── download/
│       │   │   │       │           └── route.ts      # GET
│       │   │   │       ├── groups/
│       │   │   │       │   ├── app/
│       │   │   │       │   │   └── [groupId]/
│       │   │   │       │   │       ├── route.ts      # GET, PATCH, DELETE
│       │   │   │       │   │       └── members/
│       │   │   │       │   │           └── route.ts  # POST
│       │   │   │       │   └── org/
│       │   │   │       │       └── [groupId]/
│       │   │   │       │           ├── route.ts
│       │   │   │       │           ├── members/
│       │   │   │       │           │   └── route.ts
│       │   │   │       │           └── apps/
│       │   │   │       │               └── route.ts
│       │   │   │       ├── organizations/
│       │   │   │       │   ├── route.ts              # GET, POST
│       │   │   │       │   └── [slug]/
│       │   │   │       │       ├── route.ts          # GET, PATCH, DELETE
│       │   │   │       │       ├── members/
│       │   │   │       │       │   └── route.ts      # GET
│       │   │   │       │       ├── invitations/
│       │   │   │       │       │   └── route.ts      # GET, POST
│       │   │   │       │       └── groups/
│       │   │   │       │           └── route.ts      # GET, POST
│       │   │   │       ├── invitations/
│       │   │   │       │   └── [token]/
│       │   │   │       │       └── accept/
│       │   │   │       │           └── route.ts      # POST
│       │   │   │       ├── users/
│       │   │   │       │   └── me/
│       │   │   │       │       ├── route.ts          # GET, PATCH
│       │   │   │       │       └── change-password/
│       │   │   │       │           └── route.ts      # POST
│       │   │   │       └── tokens/
│       │   │   │           ├── route.ts              # GET, POST
│       │   │   │           └── [id]/
│       │   │   │               └── route.ts          # DELETE
│       │   │   │
│       │   │   ├── layout.tsx        # Root layout
│       │   │   ├── page.tsx          # Redirects to /login
│       │   │   └── globals.css       # Tailwind + design tokens
│       │   │
│       │   ├── components/
│       │   │   ├── ui/               # shadcn/ui primitives
│       │   │   │   ├── button.tsx
│       │   │   │   ├── input.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── sheet.tsx
│       │   │   │   ├── dialog.tsx
│       │   │   │   ├── tabs.tsx
│       │   │   │   ├── checkbox.tsx
│       │   │   │   ├── badge.tsx
│       │   │   │   ├── dropdown-menu.tsx
│       │   │   │   ├── avatar.tsx
│       │   │   │   ├── separator.tsx
│       │   │   │   └── ... (other shadcn components)
│       │   │   │
│       │   │   ├── layout/
│       │   │   │   ├── dashboard-layout.tsx
│       │   │   │   ├── sidebar.tsx
│       │   │   │   └── top-header.tsx
│       │   │   │
│       │   │   ├── forms/
│       │   │   │   ├── login-form.tsx
│       │   │   │   ├── new-app-sheet.tsx
│       │   │   │   ├── upload-release-sheet.tsx
│       │   │   │   ├── create-app-group-sheet.tsx
│       │   │   │   ├── create-org-group-sheet.tsx
│       │   │   │   ├── manage-group-sheet.tsx
│       │   │   │   ├── add-user-sheet.tsx
│       │   │   │   └── add-apps-sheet.tsx
│       │   │   │
│       │   │   ├── dashboard/
│       │   │   │   ├── dashboard-header.tsx
│       │   │   │   ├── app-grid.tsx
│       │   │   │   └── app-card.tsx
│       │   │   │
│       │   │   ├── apps/
│       │   │   │   ├── app-details-content.tsx
│       │   │   │   ├── app-stats.tsx
│       │   │   │   ├── releases-tab.tsx
│       │   │   │   ├── feedback-tab.tsx
│       │   │   │   ├── metadata-tab.tsx
│       │   │   │   └── groups-tab.tsx
│       │   │   │
│       │   │   ├── releases/
│       │   │   │   └── release-details-content.tsx
│       │   │   │
│       │   │   ├── groups/
│       │   │   │   └── groups-content.tsx
│       │   │   │
│       │   │   └── settings/
│       │   │       ├── settings-content.tsx
│       │   │       ├── profile-tab.tsx
│       │   │       ├── notifications-tab.tsx
│       │   │       ├── organizations-tab.tsx
│       │   │       └── api-tokens-tab.tsx
│       │   │
│       │   ├── lib/
│       │   │   ├── auth.ts           # NextAuth configuration
│       │   │   ├── db.ts             # Prisma client singleton
│       │   │   ├── storage.ts        # Storage adapter factory
│       │   │   ├── permissions.ts    # Permission checking
│       │   │   ├── api-utils.ts      # API response helpers
│       │   │   └── validations.ts    # Zod schemas
│       │   │
│       │   ├── hooks/
│       │   │   ├── use-dashboard-filters.ts
│       │   │   └── use-permissions.ts
│       │   │
│       │   └── types/
│       │       ├── api.ts
│       │       └── next-auth.d.ts    # NextAuth type extensions
│       │
│       ├── public/
│       │   ├── logo.svg
│       │   └── login-background.jpg
│       │
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── database/                     # Prisma schema & migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   └── index.ts              # Export Prisma client
│   │   └── package.json
│   │
│   ├── storage-adapters/             # Cloud storage implementations
│   │   ├── src/
│   │   │   ├── index.ts              # Factory & exports
│   │   │   ├── types.ts              # Interface definitions
│   │   │   ├── s3-adapter.ts
│   │   │   ├── gcs-adapter.ts
│   │   │   ├── azure-adapter.ts
│   │   │   ├── salesforce-adapter.ts
│   │   │   └── local-adapter.ts
│   │   └── package.json
│   │
│   ├── binary-parser/                # IPA/APK metadata extraction
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── ipa-parser.ts
│   │   │   └── apk-parser.ts
│   │   └── package.json
│   │
│   └── config/                       # Shared configurations
│       ├── eslint/
│       │   └── base.js
│       ├── typescript/
│       │   └── base.json
│       └── package.json
│
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── nginx.conf
│
├── docs/                             # Docusaurus documentation
│   ├── docs/
│   │   ├── getting-started/
│   │   ├── configuration/
│   │   ├── api-reference/
│   │   └── deployment/
│   └── docusaurus.config.js
│
├── website/                          # Minimal landing page
│   └── (simple static site)
│
├── .env.example
├── docker-compose.yml
├── docker-compose.dev.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── LICENSE                           # Apache 2.0
├── README.md
├── CONTRIBUTING.md
└── CHANGELOG.md
```

---

## 5. Storage Adapters (BYOC)

### 5.1 Storage Adapter Interface

**Every storage adapter MUST implement this exact interface:**

```typescript
// packages/storage-adapters/src/types.ts

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface SignedUrlOptions {
  expiresIn?: number;           // Seconds, default 3600
  downloadFilename?: string;    // Force download filename
  contentType?: string;
}

export interface FileMetadata {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag?: string;
  customMetadata?: Record<string, string>;
}

export interface StorageAdapter {
  readonly provider: 'aws-s3' | 'gcp-storage' | 'azure-blob' | 'salesforce' | 'local';
  
  upload(
    key: string,
    data: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult>;
  
  getSignedDownloadUrl(key: string, options?: SignedUrlOptions): Promise<string>;
  
  getSignedUploadUrl(
    key: string,
    contentType: string,
    options?: SignedUrlOptions
  ): Promise<string>;
  
  delete(key: string): Promise<void>;
  
  exists(key: string): Promise<boolean>;
  
  getMetadata(key: string): Promise<FileMetadata | null>;
  
  copy(sourceKey: string, destinationKey: string): Promise<void>;
  
  list(prefix: string, maxResults?: number): Promise<string[]>;
}
```

### 5.2 Environment Variables for Each Provider

```bash
# .env.example

# ============================================================
# STORAGE PROVIDER SELECTION
# ============================================================
# Choose ONE of: aws-s3 | gcp-storage | azure-blob | salesforce | local
STORAGE_PROVIDER=local

# ============================================================
# AWS S3 CONFIGURATION
# Required when STORAGE_PROVIDER=aws-s3
# ============================================================
# S3_BUCKET=your-bucket-name
# S3_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# S3_ENDPOINT=                    # Optional: For MinIO/compatible services
# S3_FORCE_PATH_STYLE=false       # Set true for MinIO

# ============================================================
# GOOGLE CLOUD STORAGE CONFIGURATION
# Required when STORAGE_PROVIDER=gcp-storage
# ============================================================
# GCS_BUCKET=your-bucket-name
# GCS_PROJECT_ID=your-project-id
# GCS_KEY_FILE=/path/to/service-account.json
# # OR provide JSON directly:
# GCS_CREDENTIALS={"type":"service_account",...}

# ============================================================
# AZURE BLOB STORAGE CONFIGURATION
# Required when STORAGE_PROVIDER=azure-blob
# ============================================================
# AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
# # OR use explicit credentials:
# AZURE_STORAGE_ACCOUNT_NAME=your-account-name
# AZURE_STORAGE_ACCOUNT_KEY=your-account-key
# AZURE_STORAGE_CONTAINER_NAME=deploymate

# ============================================================
# SALESFORCE FILES CONFIGURATION
# Required when STORAGE_PROVIDER=salesforce
# NOTE: Salesforce has limitations - no true signed URLs
# ============================================================
# SALESFORCE_LOGIN_URL=https://login.salesforce.com
# SALESFORCE_USERNAME=your-username
# SALESFORCE_PASSWORD=your-password
# SALESFORCE_SECURITY_TOKEN=your-security-token
# SALESFORCE_FOLDER_ID=               # Optional: ContentWorkspace ID

# ============================================================
# LOCAL STORAGE CONFIGURATION
# Required when STORAGE_PROVIDER=local
# Use only for development or small deployments
# ============================================================
LOCAL_STORAGE_PATH=./data/uploads
LOCAL_STORAGE_BASE_URL=http://localhost:3000/api/files
LOCAL_STORAGE_SIGNING_SECRET=change-this-to-random-32-char-string
```

### 5.3 Storage Adapter Factory

```typescript
// packages/storage-adapters/src/index.ts

import { S3StorageAdapter } from './s3-adapter';
import { GCSStorageAdapter } from './gcs-adapter';
import { AzureBlobStorageAdapter } from './azure-adapter';
import { SalesforceStorageAdapter } from './salesforce-adapter';
import { LocalStorageAdapter } from './local-adapter';
import type { StorageAdapter } from './types';

export type StorageProvider = 'aws-s3' | 'gcp-storage' | 'azure-blob' | 'salesforce' | 'local';

export function createStorageAdapter(): StorageAdapter {
  const provider = process.env.STORAGE_PROVIDER as StorageProvider;
  
  switch (provider) {
    case 'aws-s3':
      return new S3StorageAdapter({
        bucket: process.env.S3_BUCKET!,
        region: process.env.S3_REGION!,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      });
      
    case 'gcp-storage':
      return new GCSStorageAdapter({
        bucket: process.env.GCS_BUCKET!,
        projectId: process.env.GCS_PROJECT_ID!,
        credentials: process.env.GCS_KEY_FILE || 
                     JSON.parse(process.env.GCS_CREDENTIALS || '{}'),
      });
      
    case 'azure-blob':
      return new AzureBlobStorageAdapter({
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
        accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
        accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
        containerName: process.env.AZURE_STORAGE_CONTAINER_NAME!,
      });
      
    case 'salesforce':
      return new SalesforceStorageAdapter({
        loginUrl: process.env.SALESFORCE_LOGIN_URL!,
        username: process.env.SALESFORCE_USERNAME!,
        password: process.env.SALESFORCE_PASSWORD!,
        securityToken: process.env.SALESFORCE_SECURITY_TOKEN!,
        folderId: process.env.SALESFORCE_FOLDER_ID,
      });
      
    case 'local':
    default:
      return new LocalStorageAdapter({
        basePath: process.env.LOCAL_STORAGE_PATH || './data/uploads',
        baseUrl: process.env.LOCAL_STORAGE_BASE_URL || 'http://localhost:3000/api/files',
        signingSecret: process.env.LOCAL_STORAGE_SIGNING_SECRET!,
      });
  }
}

// Export singleton instance
let storageAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!storageAdapter) {
    storageAdapter = createStorageAdapter();
  }
  return storageAdapter;
}
```

---

## 6. Database Schema

### 6.1 Complete Prisma Schema

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// USERS & AUTHENTICATION
// ============================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  avatarUrl     String?
  
  // Super Admin can create organizations
  isSuperAdmin  Boolean   @default(false)
  
  emailVerified Boolean   @default(false)
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  memberships         Membership[]
  apiTokens           ApiToken[]
  invitationsSent     Invitation[]  @relation("InvitationsSent")
  invitationsReceived Invitation[]  @relation("InvitationsReceived")
  appGroupMembers     AppGroupMember[]
  orgGroupMembers     OrgGroupMember[]
  downloadLogs        DownloadLog[]
  feedback            Feedback[]
  auditLogs           AuditLog[]
  
  @@index([email])
}

model ApiToken {
  id           String    @id @default(cuid())
  userId       String
  name         String
  tokenHash    String    @unique
  tokenPrefix  String               // First 8 chars: dm_xxxxxxxx
  permissions  String[]             // ['apps:read', 'releases:write', ...]
  orgId        String?              // Optional: restrict to org
  lastUsedAt   DateTime?
  expiresAt    DateTime?
  isRevoked    Boolean   @default(false)
  createdAt    DateTime  @default(now())

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization? @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
}

// ============================================================
// ORGANIZATIONS
// ============================================================

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  logoUrl     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  memberships  Membership[]
  invitations  Invitation[]
  apps         App[]
  orgGroups    OrgDistGroup[]
  apiTokens    ApiToken[]
  auditLogs    AuditLog[]

  @@index([slug])
}

model Membership {
  id        String   @id @default(cuid())
  userId    String
  orgId     String
  role      Role     @default(TESTER)
  joinedAt  DateTime @default(now())
  addedById String?

  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  org       Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([userId, orgId])
  @@index([orgId])
}

enum Role {
  ADMIN      // Full org control
  MANAGER    // Upload releases, manage groups
  TESTER     // View and download only
}

// ============================================================
// INVITATIONS (Invite-Only Model)
// ============================================================

model Invitation {
  id            String           @id @default(cuid())
  email         String
  orgId         String
  role          Role             @default(TESTER)
  token         String           @unique
  status        InvitationStatus @default(PENDING)
  invitedById   String
  acceptedById  String?
  acceptedAt    DateTime?
  expiresAt     DateTime
  createdAt     DateTime         @default(now())

  organization  Organization     @relation(fields: [orgId], references: [id], onDelete: Cascade)
  invitedBy     User             @relation("InvitationsSent", fields: [invitedById], references: [id])
  acceptedBy    User?            @relation("InvitationsReceived", fields: [acceptedById], references: [id])

  @@index([email])
  @@index([token])
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  CANCELLED
}

// ============================================================
// APPS
// ============================================================

model App {
  id          String   @id @default(cuid())
  name        String
  bundleId    String?
  platform    Platform
  orgId       String
  iconKey     String?
  iconUrl     String?
  description String?
  createdById String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  organization Organization   @relation(fields: [orgId], references: [id], onDelete: Cascade)
  releases     Release[]
  appGroups    AppDistGroup[]
  orgGroupApps OrgGroupApp[]

  @@unique([orgId, bundleId])
  @@index([orgId])
}

enum Platform {
  IOS
  ANDROID
}

// ============================================================
// RELEASES
// ============================================================

model Release {
  id            String      @id @default(cuid())
  appId         String
  version       String
  buildNumber   String
  releaseType   ReleaseType @default(BETA)
  releaseNotes  String?
  fileKey       String
  fileName      String
  fileSize      Int
  minOSVersion  String?
  bundleId      String?
  downloadCount Int         @default(0)
  uploadedById  String?
  createdAt     DateTime    @default(now())

  app           App             @relation(fields: [appId], references: [id], onDelete: Cascade)
  releaseGroups ReleaseGroup[]
  downloadLogs  DownloadLog[]
  feedback      Feedback[]

  @@unique([appId, version, buildNumber])
  @@index([appId])
  @@index([createdAt])
}

enum ReleaseType {
  ALPHA
  BETA
  RELEASE_CANDIDATE
}

// ============================================================
// DISTRIBUTION GROUPS
// ============================================================

model AppDistGroup {
  id          String   @id @default(cuid())
  name        String
  appId       String
  description String?
  createdById String?
  createdAt   DateTime @default(now())

  app           App               @relation(fields: [appId], references: [id], onDelete: Cascade)
  members       AppGroupMember[]
  releaseGroups ReleaseGroup[]

  @@unique([appId, name])
}

model AppGroupMember {
  id        String   @id @default(cuid())
  groupId   String
  userId    String
  addedById String?
  createdAt DateTime @default(now())

  group     AppDistGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

model OrgDistGroup {
  id          String   @id @default(cuid())
  name        String
  orgId       String
  description String?
  createdById String?
  createdAt   DateTime @default(now())

  organization  Organization     @relation(fields: [orgId], references: [id], onDelete: Cascade)
  members       OrgGroupMember[]
  apps          OrgGroupApp[]
  releaseGroups ReleaseGroup[]

  @@unique([orgId, name])
}

model OrgGroupMember {
  id        String   @id @default(cuid())
  groupId   String
  userId    String
  addedById String?
  createdAt DateTime @default(now())

  group     OrgDistGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

model OrgGroupApp {
  id        String   @id @default(cuid())
  groupId   String
  appId     String
  addedById String?
  createdAt DateTime @default(now())

  group     OrgDistGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  app       App          @relation(fields: [appId], references: [id], onDelete: Cascade)

  @@unique([groupId, appId])
}

model ReleaseGroup {
  id           String  @id @default(cuid())
  releaseId    String
  appGroupId   String?
  orgGroupId   String?

  release      Release       @relation(fields: [releaseId], references: [id], onDelete: Cascade)
  appGroup     AppDistGroup? @relation(fields: [appGroupId], references: [id], onDelete: Cascade)
  orgGroup     OrgDistGroup? @relation(fields: [orgGroupId], references: [id], onDelete: Cascade)

  @@unique([releaseId, appGroupId])
  @@unique([releaseId, orgGroupId])
}

// ============================================================
// ANALYTICS
// ============================================================

model DownloadLog {
  id        String   @id @default(cuid())
  releaseId String
  userId    String
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  release   Release @relation(fields: [releaseId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([releaseId])
  @@index([createdAt])
}

model Feedback {
  id        String   @id @default(cuid())
  releaseId String
  userId    String
  rating    Int?
  comment   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  release   Release @relation(fields: [releaseId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  orgId       String?
  action      String
  entityType  String
  entityId    String
  oldValue    Json?
  newValue    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization? @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

---

## 7. Authentication & Authorization

### 7.1 Authentication Flow (Invite-Only)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOWS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FIRST USER (Super Admin Setup)                                 │
│  ═══════════════════════════════                                │
│  1. Deploy DeployMate (database is empty)                       │
│  2. Visit any page → Redirect to /setup                         │
│  3. Create first account with email + password                  │
│  4. User is automatically set as isSuperAdmin=true              │
│  5. User can now create organizations and invite others         │
│                                                                 │
│  INVITED USER                                                   │
│  ════════════                                                   │
│  1. Admin sends invitation via Settings > Organizations         │
│  2. Invitee receives email with link: /register?token=xxx       │
│  3. Invitee creates account (email pre-filled, cannot change)   │
│  4. On submit:                                                  │
│     - If email matches existing user → Add to org               │
│     - If new email → Create user + Add to org                   │
│  5. Redirect to /dashboard                                      │
│                                                                 │
│  EXISTING USER LOGIN                                            │
│  ═══════════════════                                            │
│  1. Visit /login                                                │
│  2. Enter email + password                                      │
│  3. Server validates with Argon2                                │
│  4. Create JWT session (30 days)                                │
│  5. Redirect to /dashboard                                      │
│                                                                 │
│  ⚠️  IMPORTANT: There is NO public registration page.           │
│      Users can ONLY create accounts via:                        │
│      - Being the first user (/setup)                            │
│      - Accepting an invitation (/register?token=xxx)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Role Permissions Matrix

| Action | Super Admin | Admin | Manager | Tester |
|--------|:-----------:|:-----:|:-------:|:------:|
| Create Organization | ✅ | ❌ | ❌ | ❌ |
| Delete Organization | ✅ | ❌ | ❌ | ❌ |
| Update Org Settings | ✅ | ✅ | ❌ | ❌ |
| Invite Users | ✅ | ✅ | ❌ | ❌ |
| Remove Users | ✅ | ✅ | ❌ | ❌ |
| Change User Roles | ✅ | ✅ | ❌ | ❌ |
| Create App | ✅ | ✅ | ❌ | ❌ |
| Delete App | ✅ | ✅ | ❌ | ❌ |
| Upload Release | ✅ | ✅ | ✅ | ❌ |
| Delete Release | ✅ | ✅ | ✅ | ❌ |
| Create Group | ✅ | ✅ | ✅ | ❌ |
| Manage Group Members | ✅ | ✅ | ✅ | ❌ |
| View Apps | ✅ | ✅ | ✅ | ✅ |
| Download Releases | ✅ | ✅ | ✅ | ✅ |
| Submit Feedback | ✅ | ✅ | ✅ | ✅ |

**Note:** `isSuperAdmin` is a platform-level flag (not per-org). It allows creating new organizations. Regular Admins are organization-scoped.

---

## 8. API Specification

### 8.1 API Design Rules

```
┌─────────────────────────────────────────────────────────────────┐
│                      API DESIGN RULES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. VERSIONING: All routes under /api/v1/                       │
│                                                                 │
│  2. AUTHENTICATION:                                             │
│     - Web: Session cookie (NextAuth)                            │
│     - API: Authorization: Bearer dm_xxxxxxxxxx                  │
│                                                                 │
│  3. RESPONSE FORMAT:                                            │
│     Success: { "data": {...}, "meta"?: {...} }                  │
│     Error:   { "error": { "code": "...", "message": "..." } }   │
│                                                                 │
│  4. HTTP STATUS CODES:                                          │
│     200 OK, 201 Created, 204 No Content                         │
│     400 Bad Request, 401 Unauthorized, 403 Forbidden            │
│     404 Not Found, 409 Conflict, 500 Internal Error             │
│                                                                 │
│  5. PAGINATION: ?page=1&limit=20                                │
│     Response: { meta: { page, limit, total, totalPages } }      │
│                                                                 │
│  6. FILTERING: ?orgId=xxx&platform=ios                          │
│                                                                 │
│  7. SORTING: ?sort=createdAt&order=desc                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Complete Endpoint List

#### Organizations
```
GET    /api/v1/organizations                    List user's orgs
POST   /api/v1/organizations                    Create org (Super Admin only)
GET    /api/v1/organizations/:slug              Get org details
PATCH  /api/v1/organizations/:slug              Update org (Admin)
DELETE /api/v1/organizations/:slug?confirm=true Delete org (Super Admin)
GET    /api/v1/organizations/:slug/members      List members (Admin)
PATCH  /api/v1/organizations/:slug/members/:id  Update member role (Admin)
DELETE /api/v1/organizations/:slug/members/:id  Remove member (Admin)
```

#### Invitations
```
POST   /api/v1/organizations/:slug/invitations  Send invitation (Admin)
GET    /api/v1/organizations/:slug/invitations  List pending invitations (Admin)
DELETE /api/v1/invitations/:id                  Cancel invitation (Admin)
POST   /api/v1/invitations/:token/accept        Accept invitation (Public)
```

#### Apps
```
GET    /api/v1/apps                             List accessible apps
POST   /api/v1/apps                             Create app (Admin)
GET    /api/v1/apps/:id                         Get app details
PATCH  /api/v1/apps/:id                         Update app (Admin)
DELETE /api/v1/apps/:id?confirm=AppName         Delete app (Admin)
```

#### Releases
```
GET    /api/v1/apps/:appId/releases             List releases
POST   /api/v1/apps/:appId/releases/upload-url  Get signed upload URL (Manager+)
POST   /api/v1/apps/:appId/releases             Create release after upload (Manager+)
GET    /api/v1/apps/:appId/releases/latest      Get latest release
GET    /api/v1/releases/:id                     Get release details
DELETE /api/v1/releases/:id                     Delete release (Manager+)
GET    /api/v1/releases/:id/download            Get signed download URL
```

#### Distribution Groups
```
# App-level groups
GET    /api/v1/apps/:appId/groups               List app groups
POST   /api/v1/apps/:appId/groups               Create app group (Manager+)
GET    /api/v1/groups/app/:groupId              Get app group details
PATCH  /api/v1/groups/app/:groupId              Update app group (Manager+)
DELETE /api/v1/groups/app/:groupId              Delete app group (Manager+)
POST   /api/v1/groups/app/:groupId/members      Add members (Manager+)
DELETE /api/v1/groups/app/:groupId/members/:uid Remove member (Manager+)

# Org-level groups
GET    /api/v1/organizations/:slug/groups       List org groups
POST   /api/v1/organizations/:slug/groups       Create org group (Manager+)
GET    /api/v1/groups/org/:groupId              Get org group details
PATCH  /api/v1/groups/org/:groupId              Update org group (Manager+)
DELETE /api/v1/groups/org/:groupId              Delete org group (Manager+)
POST   /api/v1/groups/org/:groupId/members      Add members (Manager+)
DELETE /api/v1/groups/org/:groupId/members/:uid Remove member (Manager+)
POST   /api/v1/groups/org/:groupId/apps         Add apps to group (Manager+)
DELETE /api/v1/groups/org/:groupId/apps/:appId  Remove app from group (Manager+)
```

#### Users
```
GET    /api/v1/users/me                         Get current user
PATCH  /api/v1/users/me                         Update profile
POST   /api/v1/users/me/change-password         Change password
```

#### API Tokens
```
GET    /api/v1/tokens                           List user's tokens
POST   /api/v1/tokens                           Create token
DELETE /api/v1/tokens/:id                       Revoke token
```

### 8.3 Key API Request/Response Examples

#### Upload Release Flow

```typescript
// Step 1: Get signed upload URL
POST /api/v1/apps/:appId/releases/upload-url
{
  "fileName": "MyApp.ipa",
  "fileSize": 47395020,
  "contentType": "application/octet-stream"
}
// Response
{
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/bucket/...",
    "fileKey": "releases/app-1/abc123.ipa",
    "expiresAt": "2024-01-15T11:30:00Z"
  }
}

// Step 2: Upload file directly to storage (client-side PUT request)
PUT {uploadUrl}
Content-Type: application/octet-stream
[binary file data]

// Step 3: Create release record
POST /api/v1/apps/:appId/releases
{
  "fileKey": "releases/app-1/abc123.ipa",
  "releaseNotes": "Bug fixes and improvements",
  "releaseType": "BETA",
  "distributionGroups": [
    { "id": "group-1", "type": "app" },
    { "id": "group-2", "type": "org" }
  ]
}
// Response (server parses binary and extracts metadata)
{
  "data": {
    "id": "release-123",
    "version": "2.1.0",       // Extracted from IPA/APK
    "buildNumber": "42",      // Extracted from IPA/APK
    "bundleId": "com.acme.app",
    "minOSVersion": "iOS 14.0",
    "fileSize": 47395020,
    "releaseType": "BETA",
    "releaseNotes": "Bug fixes and improvements",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Create API Token

```typescript
POST /api/v1/tokens
{
  "name": "CI Pipeline",
  "permissions": ["apps:read", "releases:read", "releases:write"],
  "orgId": "org-123",        // Optional: restrict to org
  "expiresInDays": 90        // Optional: default never
}
// Response (token shown ONCE)
{
  "data": {
    "id": "token-123",
    "name": "CI Pipeline",
    "token": "dm_live_xxxxxxxxxxxxxxxxxxxxxxxx",  // SAVE THIS!
    "permissions": ["apps:read", "releases:read", "releases:write"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 9. UI/UX Specification

### 9.1 Design System (From v0.app Prototype)

| Element | Value |
|---------|-------|
| **Primary Font** | Space Grotesk (400, 500, 600, 700) |
| **Mono Font** | Courier Prime (400, 700) |
| **Primary Color** | #0077b6 |
| **Alpha Badge** | #90e0ef (light blue, dark text) |
| **Beta Badge** | #0077b6 (medium blue, white text) |
| **RC Badge** | #03045e (dark blue, white text) |
| **Border Radius** | 0.5rem |
| **Mobile Breakpoint** | < 768px (md:) |

### 9.2 Page Routes

| Page | Route | Auth | Notes |
|------|-------|:----:|-------|
| Root | `/` | No | Redirects to /login |
| Login | `/login` | No | |
| Setup | `/setup` | No | Only shows when no users exist |
| Register | `/register?token=xxx` | No | Invitation acceptance |
| Dashboard | `/dashboard` | Yes | Main apps view |
| App Details | `/apps/[id]` | Yes | |
| Release Details | `/releases/[id]` | Yes | |
| Org Groups | `/groups?org=[slug]` | Yes | Requires org param |
| Settings | `/settings` | Yes | 4 tabs |

### 9.3 Settings Page Tabs (4 Tabs - NO Billing)

1. **Profile** - First name, Last name, Email (readonly), Change Password button
2. **Notifications** - Email preference toggles with Save button
3. **Organizations** - List of orgs with Leave/Manage buttons, Create Org button (Super Admin only)
4. **API Tokens** - Generate new tokens, list existing, revoke

**IMPORTANT:** There is NO Billing tab. This is open-source with no monetization.

### 9.4 Mobile-Specific Requirements

- NO horizontal scrolling anywhere
- Compact stats layout (list with dividers, not cards)
- Hide "Upload New Release" button on mobile
- Hide 3-dot menu on mobile (app details)
- Hide Distribution Groups tab on mobile (app details)
- Stack buttons vertically
- Minimum touch target: 44px
- Native app feel with smooth transitions

---

## 10. Accessibility Requirements

### 10.1 WCAG 2.1 AA Checklist

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | 4.5:1 minimum for text |
| Keyboard navigation | All interactive elements focusable |
| Focus indicators | Visible focus ring (#0077b6) |
| Screen reader | ARIA labels on all interactive elements |
| Form labels | All inputs have visible labels |
| Error messages | Linked with aria-describedby |
| Skip links | "Skip to main content" link |
| Headings | Proper hierarchy (h1 → h2 → h3) |
| Loading states | aria-busy, aria-live regions |

### 10.2 Required ARIA Patterns

```tsx
// Navigation
<nav role="navigation" aria-label="Main navigation">

// Main content
<main id="main-content" role="main">

// Expandable
<button aria-expanded={isOpen} aria-controls="section-id">
<div id="section-id">

// Current page
<a aria-current="page">

// Loading
<div aria-busy={isLoading} aria-live="polite">

// Form errors
<input aria-invalid={hasError} aria-describedby="error-id" />
<span id="error-id" role="alert">{error}</span>

// Icon-only buttons
<button aria-label="Open menu">
  <MenuIcon aria-hidden="true" />
</button>
```

---

## 11. Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Initialize Next.js 14 project with TypeScript strict mode
- [ ] Setup Tailwind CSS with design tokens from v0
- [ ] Install and configure shadcn/ui components
- [ ] Setup Prisma with PostgreSQL
- [ ] Create complete database schema
- [ ] Setup NextAuth with credentials provider
- [ ] Create login page
- [ ] Create first-user setup page (/setup)
- [ ] Create invitation acceptance page (/register)
- [ ] Setup Docker Compose for development

### Phase 2: Core Features (Week 3-4)
- [ ] Dashboard layout (sidebar + header)
- [ ] Apps list with grid/list toggle
- [ ] App details page with tabs
- [ ] Release list
- [ ] Local storage adapter
- [ ] File upload API with signed URLs
- [ ] Binary parser (IPA metadata extraction)
- [ ] Binary parser (APK metadata extraction)
- [ ] Release creation flow (multi-step)
- [ ] Download with signed URLs

### Phase 3: Distribution (Week 5-6)
- [ ] App-level distribution groups
- [ ] Org-level distribution groups
- [ ] Invitation system with email
- [ ] Permission checking middleware
- [ ] Release → Group linking
- [ ] Settings page (all 4 tabs)

### Phase 4: API & Storage (Week 7-8)
- [ ] API token generation/revocation
- [ ] All REST API endpoints
- [ ] AWS S3 storage adapter
- [ ] GCP Cloud Storage adapter
- [ ] Azure Blob storage adapter
- [ ] Salesforce Files adapter
- [ ] API documentation

### Phase 5: Polish & Deploy (Week 9-10)
- [ ] Mobile responsive polish
- [ ] Accessibility audit and fixes
- [ ] Docker production build
- [ ] docker-compose.yml for self-hosting
- [ ] GitHub Actions CI/CD
- [ ] Documentation site (Docusaurus)
- [ ] Landing page
- [ ] README, CONTRIBUTING, CHANGELOG

---

## 12. Deployment & Self-Hosting

### 12.1 Environment Variables Template

```bash
# .env.example

# ============================================================
# APPLICATION
# ============================================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# ============================================================
# DATABASE
# ============================================================
DATABASE_URL=postgresql://user:password@localhost:5432/deploymate

# ============================================================
# AUTHENTICATION
# ============================================================
# Generate: openssl rand -base64 32
NEXTAUTH_SECRET=your-32-character-secret
NEXTAUTH_URL=https://your-domain.com

# ============================================================
# REDIS (Background Jobs)
# ============================================================
REDIS_URL=redis://localhost:6379

# ============================================================
# STORAGE (See Section 5 for all options)
# ============================================================
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./data/uploads
LOCAL_STORAGE_BASE_URL=https://your-domain.com/api/files
LOCAL_STORAGE_SIGNING_SECRET=your-32-character-secret
```

### 12.2 Docker Compose (Production)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://deploymate:deploymate@db:5432/deploymate
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - STORAGE_PROVIDER=${STORAGE_PROVIDER:-local}
      - LOCAL_STORAGE_PATH=/data/uploads
      - LOCAL_STORAGE_BASE_URL=${NEXTAUTH_URL}/api/files
      - LOCAL_STORAGE_SIGNING_SECRET=${LOCAL_STORAGE_SIGNING_SECRET}
    volumes:
      - uploads:/data/uploads
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=deploymate
      - POSTGRES_PASSWORD=deploymate
      - POSTGRES_DB=deploymate
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U deploymate"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  uploads:
```

### 12.3 Quick Start for Self-Hosting

```bash
# 1. Clone repository
git clone https://github.com/yourusername/deploymate.git
cd deploymate

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with your values
#    - Generate secrets: openssl rand -base64 32
#    - Set NEXTAUTH_URL to your domain

# 4. Start with Docker Compose
docker-compose up -d

# 5. Run database migrations
docker-compose exec app npx prisma migrate deploy

# 6. Access at http://localhost:3000
#    First user to register becomes Super Admin
```

---

## 13. Website & Documentation

### 13.1 Landing Page (Minimal)

**Location:** `/website` or GitHub Pages

**Content:**
- Hero: "Self-hosted beta app distribution"
- 4-5 feature bullets
- Screenshot of dashboard
- "Get Started" → GitHub releases
- "Documentation" → Docs site
- Footer: Apache 2.0 license, GitHub link

### 13.2 Documentation Site Structure

```
docs/
├── getting-started/
│   ├── introduction.md
│   ├── quick-start.md
│   └── first-user-setup.md
├── configuration/
│   ├── environment-variables.md
│   └── storage-providers/
│       ├── aws-s3.md
│       ├── google-cloud-storage.md
│       ├── azure-blob.md
│       ├── salesforce.md
│       └── local-storage.md
├── usage/
│   ├── managing-organizations.md
│   ├── uploading-releases.md
│   ├── distribution-groups.md
│   └── api-tokens.md
├── api-reference/
│   ├── authentication.md
│   ├── organizations.md
│   ├── apps.md
│   ├── releases.md
│   ├── groups.md
│   └── users.md
└── deployment/
    ├── docker.md
    ├── kubernetes.md
    └── reverse-proxy.md
```

---

## 14. AI Development Guidelines

### 14.1 Rules for AI Coding Tools

```
┌─────────────────────────────────────────────────────────────────┐
│              MANDATORY RULES FOR AI ASSISTANTS                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. NEVER assume anything. If unclear, ASK before coding.       │
│                                                                 │
│  2. ALWAYS check this document before implementing features.    │
│                                                                 │
│  3. Follow the EXACT file structure in Section 4.               │
│                                                                 │
│  4. Use TypeScript strict mode. NO 'any' types allowed.         │
│                                                                 │
│  5. Every component MUST be accessible (Section 10).            │
│                                                                 │
│  6. Mobile-first CSS: default = mobile, md: = tablet+.          │
│                                                                 │
│  7. Use EXACT colors from Section 9.1.                          │
│                                                                 │
│  8. All API responses follow format in Section 8.1.             │
│                                                                 │
│  9. DO NOT add features not in this document.                   │
│                                                                 │
│  10. DO NOT modify existing code unless explicitly asked.       │
│                                                                 │
│  11. ALWAYS include error handling and loading states.          │
│                                                                 │
│  12. Reference v0.app spec for visual/UI details.               │
│                                                                 │
│  13. NO Billing features - this is open source only.            │
│                                                                 │
│  14. Settings has 4 tabs ONLY (no billing tab).                 │
│                                                                 │
│  15. Organizations are invite-only. No public registration.     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 14.2 When AI Must Ask for Clarification

The AI MUST stop and ask when:

1. **Requirement is ambiguous** - "How should X behave when Y happens?"
2. **Multiple approaches exist** - "Should I use server or client component?"
3. **Security-sensitive** - "What permissions should this require?"
4. **Conflicts with spec** - "The spec says X but this would cause Y"
5. **Data modeling questions** - "Should this be a separate table?"
6. **Not covered in this document** - "I don't see guidance for this feature"

### 14.3 Prompt Templates

**Creating a new page:**
```
Create the [page name] page at [route].

Requirements from Section [X]:
- [paste requirements]

UI reference: v0.app spec section [X]

Follow accessibility requirements from Section 10.
Ask if anything is unclear.
```

**Creating an API endpoint:**
```
Create: [METHOD] [route]

From Section 8.2:
- Request: [paste]
- Response: [paste]
- Required permission: [role]

Use withAuth wrapper.
Follow response format from Section 8.1.
```

---

## Quick Reference

### Key Files
| Purpose | Path |
|---------|------|
| Database schema | `packages/database/prisma/schema.prisma` |
| Storage adapters | `packages/storage-adapters/src/` |
| Auth config | `apps/web/src/lib/auth.ts` |
| Permissions | `apps/web/src/lib/permissions.ts` |
| API utilities | `apps/web/src/lib/api-utils.ts` |

### Commands
```bash
pnpm dev           # Start development
pnpm build         # Production build
pnpm db:push       # Push schema to database
pnpm db:studio     # Open Prisma Studio
```

### Important URLs
| URL | Purpose |
|-----|---------|
| `/login` | Login |
| `/setup` | First user setup |
| `/register?token=xxx` | Accept invitation |
| `/dashboard` | Main view |
| `/settings` | User settings (4 tabs) |

---

*Document Version 2.0.0 - Ready for Development*
