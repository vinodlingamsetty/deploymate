---
sidebar_position: 1
title: Authentication
---

# API Authentication

DeployMate supports two authentication modes:

1. Browser session cookie (dashboard users)
2. Bearer API token (CI/CD and automation)

Use API tokens for non-interactive workflows.

## Token Format

API tokens use the prefix `dm_` followed by a random string:

```
dm_a1b2c3d4e5f6g7h8i9j0
```

Generate tokens from **Settings → API Tokens** in DeployMate.

## Usage

Include the token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer dm_your-token-here" \
  https://deploymate.example.com/api/v1/apps
```

## Token Permissions

DeployMate enforces endpoint-level permissions for token-authenticated requests:

- `READ`
- `WRITE`

Rules:

- `GET` / `HEAD` routes require `READ` (or `WRITE`)
- `POST` / `PUT` / `PATCH` / `DELETE` routes require `WRITE`

## Endpoint Support Matrix

Token authentication is enabled on automation-focused app/release endpoints in this docs set:

- `GET /api/v1/apps`
- `POST /api/v1/apps`
- `GET /api/v1/apps/:id`
- `PATCH /api/v1/apps/:id`
- `DELETE /api/v1/apps/:id`
- `GET /api/v1/apps/:appId/releases`
- `POST /api/v1/apps/:appId/releases/upload-url`
- `POST /api/v1/apps/:appId/releases`
- `GET /api/v1/apps/:appId/releases/latest`
- `GET /api/v1/releases/:id`
- `DELETE /api/v1/releases/:id`

Some account-management and organization-management routes remain dashboard session-first.

## Response Format

All API responses follow a consistent format:

**Success:**
```json
{
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 42 }
}
```

**Error:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "App not found"
  }
}
```
