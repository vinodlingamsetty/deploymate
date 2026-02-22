---
sidebar_position: 2
title: Storage Providers
---

# Storage Providers

DeployMate supports multiple storage backends for uploaded artifacts. Select a provider with `STORAGE_PROVIDER`.

## Local Storage (`local`)

Best for development and small self-hosted environments.

```env
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./data/uploads
```

## AWS S3 (`aws-s3`)

Works with AWS S3 and S3-compatible services (for example MinIO, Cloudflare R2).

```env
STORAGE_PROVIDER=aws-s3
S3_BUCKET=my-deploymate-bucket
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
# Optional
S3_ENDPOINT=https://...
S3_FORCE_PATH_STYLE=false
```

## Google Cloud Storage Single-Bucket (`gcp-storage`)

Simple GCS mode using one bucket for all artifacts.

```env
STORAGE_PROVIDER=gcp-storage
GCS_BUCKET=my-deploymate-bucket
GCS_PROJECT_ID=my-project
# Optional auth options
GCS_KEY_FILE=/path/to/service-account.json
# or
GCS_CREDENTIALS={"type":"service_account",...}
```

## Enterprise GCP Dual-Bucket (`gcp-enterprise`)

Use this in enterprise GCP/VPC-SC-style deployments where internal and distribution data should be separated.

- App bucket: internal assets (`icons/`, temporary/internal keys)
- Distribution bucket: release artifacts (`releases/`, `manifests/`) for OTA/download links

```env
STORAGE_PROVIDER=gcp-enterprise
GCS_PROJECT_ID=my-project
GCS_APP_BUCKET=deploymate-app-prod
GCS_DISTRIBUTION_BUCKET=deploymate-dist-prod
DISTRIBUTION_BASE_URL=https://deploymate.example.com
# Optional auth options
GCS_KEY_FILE=/path/to/service-account.json
# or
GCS_CREDENTIALS={"type":"service_account",...}
```

## Azure Blob Storage (`azure-blob`)

```env
STORAGE_PROVIDER=azure-blob
AZURE_STORAGE_CONTAINER_NAME=deploymate-builds
# Option A
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...
# Option B
AZURE_STORAGE_ACCOUNT_NAME=...
AZURE_STORAGE_ACCOUNT_KEY=...
```

## OTA Note for iOS

iOS OTA install requires the manifest and IPA URLs to be reachable over valid HTTPS from the device. DeployMate uses tokenized OTA URLs for this flow.
