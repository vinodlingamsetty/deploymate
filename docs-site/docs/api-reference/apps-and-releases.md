---
sidebar_position: 2
title: Apps & Releases
---

# Apps & Releases API

Manage applications and their releases programmatically.

Authentication:

- Bearer token (`Authorization: Bearer dm_...`) for CI/CD and automation
- Session cookie for dashboard users

Permission model for token-authenticated requests:

- `READ` for `GET`/`HEAD`
- `WRITE` for `POST`/`PATCH`/`DELETE`

## Apps

### List Apps

```
GET /api/v1/apps?page=1&limit=20&platform=ios&search=MyApp
```

Returns a paginated list of apps accessible to the authenticated user.

### Create App

```
POST /api/v1/apps
Content-Type: application/json

{
  "name": "My App",
  "platform": "IOS",
  "orgId": "org-id",
  "bundleId": "com.example.myapp",
  "description": "Optional app description"
}
```

### Get App Details

```
GET /api/v1/apps/:id
```

### Delete App

```
DELETE /api/v1/apps/:id?confirm=MyApp
```

Requires the app name as a confirmation parameter.

## Releases

### List Releases

```
GET /api/v1/apps/:appId/releases
```

### Create Release

Creating a release is a two-step process:

1. **Get upload URL:**
   ```
   POST /api/v1/apps/:appId/releases/upload-url
   Content-Type: application/json

   {
     "fileName": "app.ipa",
     "fileSize": 52428800,
     "contentType": "application/octet-stream"
   }
   ```

2. **Upload the file** to the returned signed URL.

3. **Create release record** after upload:
   ```
   POST /api/v1/apps/:appId/releases
   Content-Type: application/json

   {
     "fileKey": "returned-file-key",
     "releaseType": "BETA",
     "releaseNotes": "Bug fixes and improvements",
     "distributionGroups": [
       { "id": "group-id-1", "type": "app" },
       { "id": "group-id-2", "type": "org" }
     ]
   }
   ```

`releaseType` values:

- `ALPHA`
- `BETA`
- `RELEASE_CANDIDATE`

### Get Latest Release

```
GET /api/v1/apps/:appId/releases/latest
```

### Download Release

```
GET /api/v1/releases/:id/download
```

Returns the build artifact stream. For OTA/public install flows, use the tokenized form:

```
GET /api/v1/releases/:id/download?token=<ota-token>
```

### Generate Install Link

```
POST /api/v1/releases/:id/install-link
```

Requires authentication and release access.

- `IOS`: returns an `itms-services://` URL (backed by tokenized manifest/download endpoints)
- `ANDROID`: returns a tokenized download URL
