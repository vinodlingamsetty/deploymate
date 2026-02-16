---
sidebar_position: 2
title: Storage Providers
---

# Storage Providers

DeployMate supports multiple storage backends for uploaded build artifacts. Configure the provider using the `STORAGE_PROVIDER` environment variable.

## Local Storage

The default provider stores files on the local filesystem. Suitable for development and small deployments.

```env
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads
```

## AWS S3

Store builds in an Amazon S3 bucket. Requires AWS credentials and a pre-created bucket.

```env
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=my-deploymate-bucket
AWS_REGION=us-east-1
```

## Google Cloud Storage

Store builds in a GCS bucket. Authenticate using a service account key file.

```env
STORAGE_PROVIDER=gcs
GCS_BUCKET=my-deploymate-bucket
GCS_PROJECT_ID=my-project
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Azure Blob Storage

Store builds in Azure Blob Storage. Requires a storage account connection string.

```env
STORAGE_PROVIDER=azure
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER=deploymate-builds
```
