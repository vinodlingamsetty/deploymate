---
sidebar_position: 1
title: Docker
---

# Docker Deployment

DeployMate ships with Docker and Docker Compose configurations for production deployment.

## Production Deployment

The included `docker-compose.yml` starts all required services:

- **app** — Next.js application (port 3000)
- **postgres** — PostgreSQL database
- **redis** — Redis for background job processing
- **caddy** — Reverse proxy with automatic HTTPS

```bash
git clone https://github.com/deploymate/deploymate.git
cd deploymate
cp .env.example .env
# Edit .env with your production values
docker compose up -d
```

## Building the Image

The multi-stage `Dockerfile` creates an optimized production image:

```bash
docker build -t deploymate:latest .
```

## Development with Docker

Use the development Compose file for local development with hot reloading:

```bash
docker compose -f docker-compose.dev.yml up
```

This mounts the source code as a volume and enables Next.js fast refresh.

## Database Migrations

Run Prisma migrations inside the container:

```bash
docker compose exec app npx prisma migrate deploy
```
