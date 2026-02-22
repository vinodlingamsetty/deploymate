---
sidebar_position: 1
title: Authentication
---

# API Authentication

All API endpoints require authentication via Bearer token. Generate API tokens from the Settings page in the DeployMate dashboard.

## Token Format

API tokens use the prefix `dm_` followed by a random string:

```
dm_a1b2c3d4e5f6g7h8i9j0
```

## Usage

Include the token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer dm_your-token-here" \
  https://deploymate.example.com/api/v1/apps
```

## Token Permissions

Tokens support scoped permissions:

- `READ`
- `WRITE`
- `DELETE`
- `ADMIN`

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
