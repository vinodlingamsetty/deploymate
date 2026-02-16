# DeployMate

Self-hosted beta app distribution platform for iOS and Android

---

## Features

- **OTA Distribution** — Install iOS `.ipa` files directly on device via the `itms-services://` protocol; Android `.apk` files served as direct downloads
- **Distribution Groups** — Scope releases to app-level or org-level tester groups
- **Organization Management** — Invite-only organizations with full member lifecycle management
- **Role-Based Access Control** — Super Admin, Admin, Manager, Member, and Viewer roles
- **API Tokens** — Scoped bearer tokens for CI/CD integration
- **Storage Adapters** — Local filesystem, AWS S3, Google Cloud Storage, and Azure Blob Storage
- **Docker Deployment** — Single `docker compose up` to run the entire stack
- **Background Jobs** — BullMQ/Redis for async processing (notifications, artifact processing)
- **Audit Logging** — Structured audit trail for all sensitive operations via Pino

---

## Quick Start (Docker Compose)

The fastest way to get DeployMate running is with Docker Compose.

**Prerequisites:** Docker and Docker Compose installed.

```bash
git clone https://github.com/deploymate/deploymate.git
cd deploymate
cp .env.example .env
docker compose up -d
```

Then open [http://localhost:3000](http://localhost:3000) and create your first admin account.

---

## Development Setup

**Prerequisites:** Node.js 20+, pnpm, and a running PostgreSQL instance.

```bash
git clone https://github.com/deploymate/deploymate.git
cd deploymate
pnpm install
cp .env.example .env  # Configure DATABASE_URL and other variables
npx prisma migrate dev
pnpm dev
```

The dev server will be available at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `AUTH_SECRET` | Secret used to sign session tokens (minimum 32 chars) | required |
| `NEXTAUTH_URL` | Canonical URL of the deployment (e.g. `http://localhost:3000`) | required |
| `STORAGE_PROVIDER` | Storage backend: `local`, `s3`, `gcs`, or `azure` | `local` |
| `SMTP_HOST` | SMTP server hostname for email notifications | optional |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP authentication username | optional |
| `SMTP_PASS` | SMTP authentication password | optional |
| `REDIS_URL` | Redis connection string for BullMQ job queues | optional |

For S3, GCS, and Azure-specific variables (bucket names, credentials, regions), refer to `.env.example`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3, shadcn/ui |
| Database ORM | Prisma |
| Database | PostgreSQL |
| Authentication | NextAuth.js v5 |
| Job Queue | BullMQ / Redis |
| UI Components | shadcn/ui, Lucide React |

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on setting up a development environment, the pull request process, and code style expectations.

---

## License

DeployMate is released under the [Apache License 2.0](LICENSE).
