#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="/home/soma/logs/somagro-health.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

mkdir -p /home/soma/logs

log() {
  echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
}

# Docker health status
HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' somagro-web 2>/dev/null || echo "not_found")
log "docker_health=$HEALTH_STATUS"

# Local health endpoint
LOCAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/api/health 2>/dev/null || echo "000")
log "local_health_http=$LOCAL_CODE"

# Public health check (dashboard)
PUBLIC_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://somagro.gnambaservices.ci/dashboard 2>/dev/null || echo "000")
log "public_dashboard_http=$PUBLIC_CODE"

# Auto-restart if unhealthy
if [ "$HEALTH_STATUS" != "healthy" ] || [ "$LOCAL_CODE" != "200" ]; then
  log "action=restart container=somagro-web"
  docker restart somagro-web >/dev/null 2>&1 || true
fi
