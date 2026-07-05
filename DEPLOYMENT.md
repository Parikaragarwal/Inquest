# Inquest VPS Deployment Guide

This guide describes how to deploy **Inquest** to your VPS under the standard 3-layer architecture (`control/`, `infra/`, `projects/`).

---

## 🏗 Directory Architecture

Inquest lives inside its isolated directory on the VPS:

```
/
├── control/
├── infra/
└── projects/
    └── inquest/             <-- Repository cloned here
        ├── apps/
        │   ├── api/
        │   │   └── Dockerfile
        │   └── web/
        │       └── Dockerfile
        ├── docker-compose.yml
        ├── .env
        └── ...
```

---

## 🔌 Networking & Dependencies

Inquest connects to shared infrastructure over the external `infra-network` bridge network:
- **PostgreSQL**: `postgres:5432`
- **Redis**: `redis:6379`

Neither PostgreSQL nor Redis containers are created by Inquest; it connects directly to the shared `infra-network` containers.

---

## 🚀 Step-by-Step Deployment

### Step 1: Clone Repository into `projects/`
```bash
cd ~/projects
git clone <your-repo-url> inquest
cd inquest
```

### Step 2: Configure Environment Variables
Copy `.env.production.example` to `.env` and fill in your secrets and database credentials:
```bash
cp .env.production.example .env
nano .env
```

Ensure the following variables match your setup:
- `DATABASE_URL`: `postgres://<user>:<password>@postgres:5432/<db_name>`
- `REDIS_URL`: `redis://redis:6379`
- `CLIENT_URL`: `https://inquest.parikar.in`
- `BASE_URL`: `https://api.inquest.parikar.in`
- `NEXT_PUBLIC_API_URL`: `https://api.inquest.parikar.in`

### Step 3: Build & Start Containers
```bash
docker compose build
docker compose up -d
```

Check running containers:
```bash
docker compose ps
```
You should see:
- `inquest_web` running on port `127.0.0.1:3002 -> 3000`
- `inquest_api` running on port `127.0.0.1:8000 -> 8000`

### Step 4: Run Database Migrations
Execute Drizzle migrations inside the running API container against the shared PostgreSQL database:
```bash
docker compose exec inquest_api pnpm db:migrate
```

### Step 5: Configure Host Nginx & SSL
Copy the Nginx configuration snippet from `nginx.conf.example` to your host Nginx configuration:
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/inquest
sudo ln -s /etc/nginx/sites-available/inquest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Issue SSL certificates with Certbot:
```bash
sudo certbot --nginx -d inquest.parikar.in -d api.inquest.parikar.in
```

---

---

## ⚡ Automated CI/CD Pipeline (GitHub Actions)

Deployments are automated on every `git push origin main` via **.github/workflows/deploy.yml**.

### 1. GitHub Repository Secrets Required
Add these secrets under **GitHub Repository Settings -> Secrets and variables -> Actions**:

| Secret Name | Value | Example |
| :--- | :--- | :--- |
| `VPS_HOST` | Server IP or Domain | `46.225.87.125` |
| `VPS_USERNAME` | SSH User | `deployer` |
| `VPS_SSH_KEY` | Private SSH Key content | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_PORT` | *(Optional)* SSH Port | `22` (Default) |

### 2. Manual / One-Command VPS Deployment
You can also trigger a manual deployment anytime directly on the VPS by running:

```bash
cd /home/deployer/projects/Inquest
./scripts/deploy.sh
```

### 3. Production-Grade Pipeline Features (v2)
The deployment script (`scripts/deploy.sh`) implements the following production features:
- **Concurrency Protection (`flock`)**: Uses a non-blocking process lock (`/tmp/inquest-deploy.lock`) to prevent simultaneous or overlapping deployments.
- **Strict Error Handling (`set -Eeuo pipefail`)**: Catches unbound variables, pipeline failures, and ERR signals across function scopes.
- **Recursion-Safe ERR Trap**: Disables the error trap inside failure handlers to avoid recursive loops if error handling steps fail.
- **Full SHA Tracking**: Uses 40-character Git commit SHAs (`PREVIOUS_COMMIT` & `CURRENT_COMMIT`) to avoid short SHA collisions.
- **Pre-flight Daemon & Network Checks**: Verifies Docker daemon status (`docker info`) and `infra-network` before executing any builds.
- **Log Rotation**: Automatically rotates `deploy.log` to `deploy.log.old` when log size exceeds 5MB.
- **Container Readiness & Migration**: Waits for container readiness (`docker compose exec -T inquest_api true`), then applies database migrations (`pnpm db:migrate`).
- **Dedicated Health Checks**: Verifies `/health` on Express API and `/api/health` on Next.js Web with a 50-second timeout window before declaring success.
- **Execution Timer**: Tracks exact deployment duration in seconds.

```bash
# View deployment logs on the VPS
tail -f /home/deployer/projects/Inquest/logs/deploy.log
```

---

## 🛠 Useful Aliases & Management

- **View Live Container Logs**:
  ```bash
  docker compose logs -f
  ```
- **Restart Services**:
  ```bash
  docker compose restart
  ```
- **Stop Containers**:
  ```bash
  docker compose down
  ```
