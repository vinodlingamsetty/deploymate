# DeployMate

Self-hosted beta app distribution platform for iOS and Android

---

## Features

- **OTA Distribution** — Install iOS `.ipa` files directly on device via the `itms-services://` protocol; Android `.apk` files served as direct downloads
- **Distribution Groups** — Scope releases to app-level or org-level tester groups
- **Organization Management** — Invite-only organizations with full member lifecycle management
- **Role-Based Access Control** — Super Admin plus org/app roles: Admin, Manager, and Tester
- **API Tokens** — Scoped bearer tokens for CI/CD integration
- **Storage Adapters** — Local filesystem, AWS S3, Google Cloud Storage, Azure Blob Storage, and enterprise dual-bucket GCP mode
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

## Enterprise GCP Deployment

For enterprise GCP environments (Cloud Run + HTTPS Load Balancer + dual GCS buckets + Cloud SQL), see:

- [Enterprise GCP deployment architecture guide](docs/enterprise-gcp-deployment-guide.md)
- [Docs site: GCP enterprise deployment](docs-site/docs/deployment/gcp-enterprise.md)

---

## Testing iOS OTA Installs on a Real Device

iOS enforces HTTPS with a valid TLS certificate for OTA app installs via the `itms-services://` protocol. A local IP address (e.g. `192.168.0.12`) will never have a valid certificate, so iOS will refuse to install.

**In production** this is handled automatically — Caddy obtains a Let's Encrypt certificate for your domain.

**In local development**, expose port 3000 through a tunnel that provides a trusted HTTPS URL, then point DeployMate at that URL.

### Option A: Cloudflare Tunnel (recommended — free, no account needed)
Install cloudflared and start a quick tunnel:

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared
# or download directly: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

cloudflared tunnel --url http://localhost:3000
```
Cloudflare prints a URL like `https://abc123.trycloudflare.com`. Copy it and continue to the [Set the tunnel URL](#set-the-tunnel-url) step.

[Official docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/)

### Option B: ngrok (free tier — requires a free account)
Sign up at [ngrok.com](https://dashboard.ngrok.com/signup) (no credit card), install, and run:

```bash
brew install ngrok/ngrok/ngrok
ngrok config add-authtoken <your-token> # one-time setup
ngrok http 3000
```
ngrok prints a URL like `https://abc123.ngrok-free.app`. Copy it and continue to the next step.

[Official docs](https://ngrok.com/docs/getting-started/)

### Set the tunnel URL
Add both variables to your `.env` file (they must match):

```bash
NEXT_PUBLIC_APP_URL=https://your-tunnel-url
APP_URL=https://your-tunnel-url
```

Restart the dev server (`pnpm dev`) — `NEXT_PUBLIC_APP_URL` is embedded at build time by Next.js and requires a restart to take effect.

Then open the tunnel URL on your iOS device in Safari. Navigate to a release and tap **Install** — iOS will now accept the certificate and install the app.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `AUTH_SECRET` | Secret used to sign session tokens (minimum 32 chars) | required |
| `NEXTAUTH_URL` | Canonical URL of the deployment (e.g. `http://localhost:3000`) | required |
| `NEXT_PUBLIC_APP_URL` | Public HTTPS base URL for iOS OTA install links (local dev only — use a tunnel URL) | optional |
| `APP_URL` | Server-side override for the same URL used in OTA manifest plist (must match `NEXT_PUBLIC_APP_URL`) | optional |
| `STORAGE_PROVIDER` | Storage backend: `local`, `aws-s3`, `gcp-storage`, `gcp-enterprise`, or `azure-blob` | `local` |
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

## Compliance

- SBOM + license inventory + optional BYO FOSSA policy scan are documented in `docs-site/docs/compliance/fossa-and-sbom.md`.
- Legacy/slop code detection and AI-code quality checks are documented in `docs-site/docs/compliance/code-quality-and-slop-detection.md`.
- Enterprise GCP deployment references are in `docs/enterprise-gcp-deployment-guide.md`.

---

## License

DeployMate is released under the [Apache License 2.0](LICENSE).
