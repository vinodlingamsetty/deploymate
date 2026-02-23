---
sidebar_position: 1
title: GitHub Actions Upload (IPA/APK)
---

# GitHub Actions Upload (IPA/APK)

This guide shows how to upload builds to DeployMate from GitHub Actions using API tokens.

## What you need

1. A DeployMate API token with `READ` + `WRITE`
2. The DeployMate app ID (`appId`) you want to upload to
3. A built artifact (`.ipa` for iOS or `.apk` for Android)

## API flow

1. `POST /api/v1/apps/:appId/releases/upload-url`
2. Upload file bytes to the returned signed URL
3. `POST /api/v1/apps/:appId/releases`

## Example GitHub Actions job

```yaml
name: Upload build to DeployMate

on:
  workflow_dispatch:

jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Ensure jq exists
        run: sudo apt-get update && sudo apt-get install -y jq

      - name: Upload IPA to DeployMate
        env:
          DEPLOYMATE_BASE_URL: ${{ secrets.DEPLOYMATE_BASE_URL }}
          DEPLOYMATE_API_TOKEN: ${{ secrets.DEPLOYMATE_API_TOKEN }}
          DEPLOYMATE_APP_ID: ${{ secrets.DEPLOYMATE_APP_ID }}
          BUILD_FILE_PATH: build/MyApp.ipa
          RELEASE_TYPE: BETA
        run: |
          set -euo pipefail

          FILE_NAME="$(basename \"$BUILD_FILE_PATH\")"
          FILE_SIZE="$(wc -c < \"$BUILD_FILE_PATH\" | tr -d ' ')"

          UPLOAD_JSON="$(curl -sS -X POST \
            -H \"Authorization: Bearer $DEPLOYMATE_API_TOKEN\" \
            -H \"Content-Type: application/json\" \
            \"$DEPLOYMATE_BASE_URL/api/v1/apps/$DEPLOYMATE_APP_ID/releases/upload-url\" \
            -d \"{\n              \\\"fileName\\\": \\\"$FILE_NAME\\\",\n              \\\"fileSize\\\": $FILE_SIZE,\n              \\\"contentType\\\": \\\"application/octet-stream\\\"\n            }\")"

          UPLOAD_URL="$(echo \"$UPLOAD_JSON\" | jq -r '.data.uploadUrl')"
          FILE_KEY="$(echo \"$UPLOAD_JSON\" | jq -r '.data.fileKey')"

          curl -sS -X PUT \
            -H \"Content-Type: application/octet-stream\" \
            --upload-file \"$BUILD_FILE_PATH\" \
            \"$UPLOAD_URL\"

          curl -sS -X POST \
            -H \"Authorization: Bearer $DEPLOYMATE_API_TOKEN\" \
            -H \"Content-Type: application/json\" \
            \"$DEPLOYMATE_BASE_URL/api/v1/apps/$DEPLOYMATE_APP_ID/releases\" \
            -d \"{\n              \\\"fileKey\\\": \\\"$FILE_KEY\\\",\n              \\\"releaseType\\\": \\\"$RELEASE_TYPE\\\",\n              \\\"releaseNotes\\\": \\\"Automated CI upload from GitHub Actions\\\"\n            }\"
```

## Optional distribution groups

To distribute immediately to groups, add `distributionGroups` in step 3:

```json
{
  "fileKey": "releases/app-id/uuid.ipa",
  "releaseType": "BETA",
  "distributionGroups": [
    { "id": "group-id-1", "type": "app" },
    { "id": "group-id-2", "type": "org" }
  ]
}
```

## GCP-hosted DeployMate notes

If DeployMate runs on GCP:

1. Set `STORAGE_PROVIDER=gcp-enterprise` for dual-bucket enterprise mode.
2. Configure `GCS_APP_BUCKET`, `GCS_DISTRIBUTION_BUCKET`, and `GCS_PROJECT_ID`.
3. Use a public HTTPS domain for iOS OTA install links.

References:

- Cloud Run: https://cloud.google.com/run/docs
- Cloud Storage: https://cloud.google.com/storage/docs
- Workload Identity Federation (GitHub Actions): https://cloud.google.com/iam/docs/workload-identity-federation
