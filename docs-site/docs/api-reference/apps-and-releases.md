---
sidebar_position: 2
title: Apps & Releases
---

# Apps & Releases API

Manage applications and their releases programmatically.

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
  "platform": "ios",
  "organizationId": "org-id",
  "releaseType": "beta"
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
GET /api/v1/apps/:appId/releases?page=1&limit=20
```

### Create Release

Creating a release is a two-step process:

1. **Get upload URL:**
   ```
   POST /api/v1/apps/:appId/releases/upload-url
   Content-Type: application/json

   { "fileName": "app.ipa", "contentType": "application/octet-stream" }
   ```

2. **Upload the file** to the returned signed URL, then **create the release:**
   ```
   POST /api/v1/apps/:appId/releases
   Content-Type: application/json

   {
     "version": "1.2.0",
     "releaseNotes": "Bug fixes and improvements",
     "fileKey": "returned-file-key",
     "fileName": "app.ipa",
     "fileSize": 52428800,
     "groupIds": ["group-id-1"]
   }
   ```

### Get Latest Release

```
GET /api/v1/apps/:appId/releases/latest
```

### Download Release

```
GET /api/v1/releases/:id/download
```

Returns a signed download URL for the build artifact.
