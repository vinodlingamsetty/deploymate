---
sidebar_position: 1
title: Environment Variables
---

# Environment Variables

DeployMate is configured through environment variables. Copy `.env.example` to `.env` and adjust values for your deployment.

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/deploymate` |
| `AUTH_SECRET` | Secret for signing session/JWT data | `openssl rand -base64 32` output |
| `NEXTAUTH_URL` | Public base URL of the app | `https://deploymate.example.com` |

## iOS OTA Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Client-side override for iOS OTA base URL (mainly local tunnel/dev use). |
| `APP_URL` | Server-side override for OTA manifest/download origin (should match `NEXT_PUBLIC_APP_URL` when set). |

## Storage Provider Selector

| Variable | Description | Default |
|----------|-------------|---------|
| `STORAGE_PROVIDER` | `local`, `aws-s3`, `gcp-storage`, `gcp-enterprise`, or `azure-blob` | `local` |

## Local Storage

| Variable | Description | Default |
|----------|-------------|---------|
| `LOCAL_STORAGE_PATH` | Filesystem path for uploads | `./data/uploads` |

## AWS S3 Variables (`STORAGE_PROVIDER=aws-s3`)

| Variable | Description |
|----------|-------------|
| `S3_BUCKET` | Bucket name |
| `S3_REGION` | AWS region (default `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | Access key |
| `AWS_SECRET_ACCESS_KEY` | Secret key |
| `S3_ENDPOINT` | Optional endpoint for S3-compatible providers |
| `S3_FORCE_PATH_STYLE` | Optional `true` for MinIO/path-style endpoints |

## Google Cloud Storage (`STORAGE_PROVIDER=gcp-storage`)

| Variable | Description |
|----------|-------------|
| `GCS_BUCKET` | Single GCS bucket for all artifacts |
| `GCS_PROJECT_ID` | GCP project ID |
| `GCS_KEY_FILE` | Optional service account JSON key file path |
| `GCS_CREDENTIALS` | Optional JSON credentials blob |

## Enterprise GCP Dual-Bucket (`STORAGE_PROVIDER=gcp-enterprise`)

| Variable | Description |
|----------|-------------|
| `GCS_APP_BUCKET` | Internal app bucket (icons/temp/internal assets) |
| `GCS_DISTRIBUTION_BUCKET` | External distribution bucket (release artifacts) |
| `DISTRIBUTION_BASE_URL` | Optional explicit distribution base URL |
| `GCS_PROJECT_ID` | GCP project ID |
| `GCS_KEY_FILE` | Optional service account JSON key file path |
| `GCS_CREDENTIALS` | Optional JSON credentials blob |

## Azure Blob (`STORAGE_PROVIDER=azure-blob`)

| Variable | Description |
|----------|-------------|
| `AZURE_STORAGE_CONTAINER_NAME` | Blob container name |
| `AZURE_STORAGE_CONNECTION_STRING` | Full connection string |
| `AZURE_STORAGE_ACCOUNT_NAME` | Account name (alternative auth path) |
| `AZURE_STORAGE_ACCOUNT_KEY` | Account key (alternative auth path) |

## Email Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | — |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `EMAIL_FROM` | Sender address | `DeployMate <noreply@example.com>` |

## Background Jobs

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis URL for BullMQ | optional |

## Logging

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` | `debug` in dev, `info` in production |
