# VM Docker Instructions (GCP Spot VM + Cloudflare Domain)

This guide is for first-time deployment of DeployMate on a personal GCP project using a Spot VM and Docker Compose.

Target result:
- `https://betavault.app` opens DeployMate
- You can login as admin, create an app, upload builds
- iPhone Safari can install iOS releases (properly signed `.ipa`)

## 1. Prerequisites

- GCP billing enabled
- Cloudflare account with `betavault.app`
- SSH access to VM
- Basic terminal access on your laptop

## 2. Create GCP resources

1. Enable `Compute Engine API` in your GCP project.
2. Reserve a static external IPv4:
   - GCP Console -> VPC network -> External IP addresses -> Reserve.
3. Create VM:
   - Provisioning model: `Spot`
   - Machine: `e2-standard-2` (recommended for builds)
   - Disk: Ubuntu LTS, 50 GB
   - Firewall: allow HTTP (80), HTTPS (443), SSH (22)
   - Attach the static IP from step 2.

## 3. Configure Cloudflare DNS (DNS only)

In Cloudflare DNS:
- Add `A` record:
  - Name: `@`
  - Value: your GCP static IP
  - Proxy status: `DNS only` (gray cloud)

Optional:
- Add `CNAME`:
  - Name: `www`
  - Target: `betavault.app`
  - Proxy status: `DNS only`

Verify from your laptop:

```bash
dig +short betavault.app
```

Expected: the VM static IP.

## 4. SSH into VM and install Docker

Run on VM:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## 5. Clone DeployMate

```bash
git clone https://github.com/deploymate/deploymate.git
cd deploymate
```

## 6. Create `.env` on VM

Generate secrets first:

```bash
openssl rand -base64 32
openssl rand -base64 32
```

Create `.env`:

```bash
cat > .env <<'EOF'
AUTH_SECRET=REPLACE_WITH_RANDOM_SECRET_1
NEXTAUTH_SECRET=REPLACE_WITH_RANDOM_SECRET_2
NEXTAUTH_URL=https://betavault.app
APP_URL=https://betavault.app
NEXT_PUBLIC_APP_URL=https://betavault.app

SITE_ADDRESS=betavault.app
APP_PORT=3000

POSTGRES_USER=deploymate
POSTGRES_PASSWORD=REPLACE_WITH_STRONG_URL_SAFE_PASSWORD
POSTGRES_DB=deploymate
DATABASE_URL=postgresql://deploymate:REPLACE_WITH_STRONG_URL_SAFE_PASSWORD@db:5432/deploymate?schema=public

STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=/app/data/uploads

REDIS_URL=redis://redis:6379
LOG_LEVEL=info
EOF
```

Important:
- Use real values, not placeholders like `<strong-password>`.
- `APP_URL` and `NEXT_PUBLIC_APP_URL` should match your live HTTPS domain exactly.
- Keep `AUTH_SECRET` and `NEXTAUTH_SECRET` set for runtime. DeployMate does not require Docker build args for these after the auth refactor.
- Use a URL-safe DB password in `DATABASE_URL` (letters/numbers only). If you use special characters, URL-encode the password first.

## 7. Start DeployMate

```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

In another terminal, check Caddy/TLS:

```bash
docker compose logs -f caddy
```

## 8. Validate end-to-end

1. Open `https://betavault.app` on laptop.
2. Register/login as admin.
3. Create app and upload `.ipa`.
4. Open same URL on iPhone Safari.
5. Install from release details page.

## 9. Update deployment after code changes

```bash
cd ~/deploymate
git pull
docker compose up -d --build
docker compose ps
```

## 10. Troubleshooting

### A) `unexpected type map[string]interface {}`
Cause: compose env interpolation/parser issue.

Fix:
- Ensure `docker-compose.yml` uses:
  - `"AUTH_SECRET=${AUTH_SECRET}"`
- Re-run:

```bash
docker compose config
```

### B) Build error: `AUTH_SECRET or NEXTAUTH_SECRET is not set`
Cause: this should no longer happen during `next build` after the auth refactor. If it appears, your VM is likely using an older image or code revision.

Fix:
- Ensure the latest code is pulled:

```bash
git pull
```

- Ensure `.env` has runtime secrets:
  - `AUTH_SECRET=...`
  - `NEXTAUTH_SECRET=...`

- Rebuild and restart:

```bash
docker compose build --no-cache app
docker compose up -d
```

Runtime note:
- Build should succeed without passing auth secrets as Docker build args.
- Container startup still requires runtime secrets and will fail fast if missing.

### C) Runtime migration error: `Can't write to .../@prisma/engines`
Cause: image permissions/layout issue around Prisma engines.

Fix:
- Rebuild image after Dockerfile correction.
- Then:

```bash
docker compose down
docker compose build --no-cache app
docker compose up -d
docker compose logs -f app
```

### D) SSH disconnect during long build
Common on Spot/small VMs due to preemption or resource pressure.

Mitigations:

```bash
sudo apt install -y tmux
tmux new -s deploy
docker compose build --progress=plain app
```

- Prefer `e2-standard-2` or higher.
- Spot VMs can still preempt at any time.

## 11. Basic backup guidance

At minimum:
- Snapshot VM disk regularly from GCP console.
- Backup DB before major updates:

```bash
docker compose exec db pg_dump -U deploymate deploymate > backup.sql
```
