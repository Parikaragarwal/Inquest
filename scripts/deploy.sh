#!/usr/bin/env bash

# =============================================================================
# Inquest Production VPS Deployment Script (Production Grade v2)
# Location: /home/deployer/projects/Inquest/scripts/deploy.sh
# =============================================================================

set -Eeuo pipefail
SECONDS=0

# 1. Concurrency Protection (File Lock)
exec 9>/tmp/inquest-deploy.lock
if ! flock -n 9; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ⚠️ Deployment already in progress. Exiting."
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/deploy.log"
mkdir -p "$LOG_DIR"

# Rotate log file if > 5MB
if [ -f "$LOG_FILE" ] && [ "$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)" -gt 5000000 ]; then
  mv "$LOG_FILE" "$LOG_FILE.old"
fi

log() {
  local timestamp
  timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

PREVIOUS_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo "NONE")"

failure_handler() {
  local line_no=$1
  trap - ERR # Disable trap to prevent infinite recursion
  log "❌ Deployment failed at line $line_no after ${SECONDS}s."
  log "⚠️ Manual intervention required. Inspect logs above and verify container/database state."
  exit 1
}

trap 'failure_handler $LINENO' ERR

log "======================================================================="
log "🚀 Starting Inquest Production Deployment..."
log "Directory: $PROJECT_DIR"
log "Previous Commit SHA: $PREVIOUS_COMMIT"

# 2. Pre-flight Checks
log "🔍 Pre-flight check: Verifying Docker daemon..."
if ! docker info >/dev/null 2>&1; then
  log "❌ ERROR: Docker daemon is not running!"
  exit 1
fi

log "🔍 Pre-flight check: Verifying Docker network 'infra-network'..."
if ! docker network inspect infra-network >/dev/null 2>&1; then
  log "❌ ERROR: Required Docker network 'infra-network' does not exist!"
  log "Please ensure shared infrastructure (infra/) is running."
  exit 1
fi
log "✅ Docker daemon and network 'infra-network' verified."

# 3. Git Synchronization
log "📥 Pruning & fetching latest code from origin..."
git fetch --prune origin 2>&1 | tee -a "$LOG_FILE"
git reset --hard origin/main 2>&1 | tee -a "$LOG_FILE"
CURRENT_COMMIT="$(git rev-parse HEAD)"
log "📌 Target Commit SHA: $CURRENT_COMMIT"

# 4. Docker Compose Build
log "🏗 Building Docker images (inquest_api & inquest_web)..."
docker compose build 2>&1 | tee -a "$LOG_FILE"

# 5. Bring Up Containers
log "🔄 Launching updated application containers..."
docker compose up -d --remove-orphans 2>&1 | tee -a "$LOG_FILE"

# 6. Container Readiness & Database Migrations
log "⏳ Waiting for inquest_api container to be ready..."
for i in {1..15}; do
  if docker compose exec -T inquest_api true >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

log "🗄 Running database migrations..."
docker compose exec -T inquest_api pnpm db:migrate 2>&1 | tee -a "$LOG_FILE"
log "✅ Database migrations applied successfully."

# 7. Health Check Verification
log "🩺 Performing health check verification..."

log "Checking Express API (http://localhost:8000/health)..."
for i in {1..25}; do
  if curl -fsS http://localhost:8000/health >/dev/null 2>&1; then
    log "✅ Express API is healthy!"
    break
  fi
  if [ "$i" -eq 25 ]; then
    log "❌ Express API health check timed out on http://localhost:8000/health"
    exit 1
  fi
  sleep 2
done

log "Checking Next.js Web (http://localhost:3002/api/health)..."
for i in {1..25}; do
  if curl -fsS http://localhost:3002/api/health >/dev/null 2>&1; then
    log "✅ Next.js Web is healthy!"
    break
  fi
  if [ "$i" -eq 25 ]; then
    log "❌ Next.js Web health check timed out on http://localhost:3002/api/health"
    exit 1
  fi
  sleep 2
done

# 8. Status & Completion Summary
log "📊 Running Container Status:"
docker compose ps | tee -a "$LOG_FILE"

log "🎉 Deployment finished successfully for commit $CURRENT_COMMIT in ${SECONDS}s!"
log "======================================================================="
