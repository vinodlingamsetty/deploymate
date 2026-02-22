---
sidebar_position: 3
title: GCP Enterprise
---

# GCP Enterprise Deployment

This page documents a GCP-first enterprise architecture for DeployMate based on:

- Cloud Run for application runtime
- External HTTPS Load Balancer for ingress
- Cloud SQL (PostgreSQL) for database
- Cloud Storage for artifacts
- Optional Memorystore (Redis) for BullMQ queues

Detailed architecture reference in the main repository: `docs/enterprise-gcp-deployment-guide.md`

## Reference Architecture

1. Deploy Next.js app container to Cloud Run.
2. Put Cloud Run behind an External HTTPS Load Balancer.
3. Connect to Cloud SQL PostgreSQL via private networking/connector.
4. Use `STORAGE_PROVIDER=gcp-enterprise` with:
   - `GCS_APP_BUCKET` for internal assets
   - `GCS_DISTRIBUTION_BUCKET` for distribution artifacts
5. Use Secret Manager for runtime secrets.

## Why Dual Buckets?

Enterprise environments often need stricter control over internal assets than user-facing distribution binaries.

- Internal app data stays in app bucket.
- OTA/download artifacts are served from distribution bucket.
- DeployMate still uses tokenized OTA URLs for iOS manifest/download endpoints to satisfy Apple OTA install behavior.

## Required Environment Variables (GCP enterprise mode)

```env
NEXTAUTH_URL=https://deploymate.example.com
AUTH_SECRET=...
DATABASE_URL=postgresql://...

STORAGE_PROVIDER=gcp-enterprise
GCS_PROJECT_ID=my-project
GCS_APP_BUCKET=deploymate-app-prod
GCS_DISTRIBUTION_BUCKET=deploymate-dist-prod
DISTRIBUTION_BASE_URL=https://deploymate.example.com

# Optional
REDIS_URL=redis://...
GCS_KEY_FILE=/secrets/gcp-sa.json
# or GCS_CREDENTIALS={...}
```

## iOS OTA Flow on GCP

1. User requests install link.
2. DeployMate creates short-lived tokenized OTA URLs.
3. iOS installer fetches:
   - `/api/v1/releases/:id/manifest?token=...`
   - `/api/v1/releases/:id/download?token=...`
4. Install succeeds if domain is valid HTTPS and the IPA signing profile is OTA-compatible.

## Official Google Cloud Documentation

- [Cloud Run](https://cloud.google.com/run/docs)
- [External HTTPS Load Balancer](https://cloud.google.com/load-balancing/docs/https)
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Cloud Storage](https://cloud.google.com/storage/docs)
- [Cloud Armor](https://cloud.google.com/armor/docs)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Memorystore for Redis](https://cloud.google.com/memorystore/docs/redis)
- [VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs)
- [Workload Identity Federation (GitHub Actions)](https://cloud.google.com/iam/docs/workload-identity-federation)

## Rollout Checklist

1. Domain and TLS are configured on HTTPS Load Balancer.
2. `NEXTAUTH_URL` points to the public HTTPS domain.
3. Cloud Run service account has least-privilege access to Cloud SQL/GCS/Secret Manager.
4. `STORAGE_PROVIDER=gcp-enterprise` and both bucket env vars are set.
5. Test iOS OTA from a real iPhone Safari session.
