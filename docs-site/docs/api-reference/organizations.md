---
sidebar_position: 3
title: Organizations
---

# Organizations API

Manage organizations, members, and invitations.

## Organizations

### List Organizations

```
GET /api/v1/organizations
```

Returns organizations the authenticated user is a member of.

### Create Organization

```
POST /api/v1/organizations
Content-Type: application/json

{ "name": "My Team" }
```

Requires Super Admin role.

### Get Organization

```
GET /api/v1/organizations/:slug
```

### Update Organization

```
PATCH /api/v1/organizations/:slug
Content-Type: application/json

{ "name": "New Name" }
```

Requires Admin role in the organization.

## Members

### List Members

```
GET /api/v1/organizations/:slug/members
```

### Update Member Role

```
PATCH /api/v1/organizations/:slug/members/:id
Content-Type: application/json

{ "role": "manager" }
```

Available roles: `admin`, `manager`, `member`, `viewer`.

### Remove Member

```
DELETE /api/v1/organizations/:slug/members/:id
```

## Invitations

### Send Invitation

```
POST /api/v1/organizations/:slug/invitations
Content-Type: application/json

{ "email": "tester@example.com", "role": "member" }
```

### List Pending Invitations

```
GET /api/v1/organizations/:slug/invitations
```

### Cancel Invitation

```
DELETE /api/v1/invitations/:id
```
