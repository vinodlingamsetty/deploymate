---
sidebar_position: 2
title: Quick Start
---

# Quick Start

Get DeployMate running in under 5 minutes with Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Git

## Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/deploymate/deploymate.git
   cd deploymate
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Start the services:
   ```bash
   docker compose up -d
   ```

4. Open your browser and navigate to `http://localhost:3000`.

5. Create your first admin account on the setup page.

## Development Setup

For local development without Docker:

```bash
pnpm install
cp .env.example .env   # Set DATABASE_URL to your PostgreSQL instance
npx prisma migrate dev
pnpm dev
```

The development server starts at `http://localhost:3000`.
