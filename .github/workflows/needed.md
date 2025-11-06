# CivicBetter – Setup Checklist (Env + CI/CD)

## 1) App environment variables (admin service)
Create `admin/.env` (or VM file at `/etc/civicbetter/admin.env`).

```
# Server
PORT=3000
JWT_SECRET=replace-with-strong-secret

# Database (Postgres / Neon)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-or-service-key
SUPABASE_STORAGE_BUCKET=images
```

Notes:
- Create Supabase Storage bucket named `images` (or change `SUPABASE_STORAGE_BUCKET`).
- If bucket is private, configure policies; current code expects public URLs.

## 2) Drizzle (local dev)
```
cd admin
bun run db:generate   # generate migrations from schema
bun run db:migrate    # apply migrations to DATABASE_URL
bun run db:studio     # optional: browse schema/data
```

## 3) Docker (local)
```
cd admin
docker build -t civicbetter-admin:local .
docker run -p 3000:3000 --env-file ./.env civicbetter-admin:local
```

## 4) GitHub Actions – Build/Deploy
Workflows are in `.github/workflows/`:
- `deploy.yaml`: clones on VM and builds from `admin/Dockerfile`. Uses VM SSH only.
- `delivery.yaml`: redeploys existing image from GHCR (no build), triggered manually.

### Required GitHub Secrets
Set these in Repo → Settings → Secrets and variables → Actions → New repository secret:
- `VM_HOST`: your VM IP / hostname
- `VM_USER`: SSH username
- `VM_SSH_KEY`: private key contents for SSH (PEM)

Optional (only needed if using GHCR pulls on VM):
- `GHCR_TOKEN`: token with `read:packages` (falls back to `GITHUB_TOKEN`)
- `GHCR_USER`: username for GHCR login (falls back to `${{ github.actor }}`)

## 5) VM prerequisites
- Install Docker and Git
- Place env file at `/etc/civicbetter/admin.env` (path referenced in workflows)
- Open firewall port 80 (or change mapping in workflows)

Example `/etc/civicbetter/admin.env`:
```
PORT=3000
JWT_SECRET=replace-with-strong-secret
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-or-service-key
SUPABASE_STORAGE_BUCKET=images
```

## 6) Triggers
- Deploy on push to `main` via `deploy.yaml`.
- Manual redeploy without code changes via Actions → `Delivery (Redeploy Only)` → Run workflow.

## 7) Common commands
```
# Redeploy (delivery) – pick tag (default: latest)
# Actions → Delivery (Redeploy Only) → image_tag: latest

# Rebuild image locally
docker build -f admin/Dockerfile -t civicbetter-admin:latest ./admin
```

That’s it. Configure envs, secrets, and run the workflows.
