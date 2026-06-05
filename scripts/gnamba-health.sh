#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

report_ok() { echo -e "${GREEN}✅${NC} $1"; }
report_warn() { echo -e "${YELLOW}⚠️ ${NC} $1"; }
report_error() { echo -e "${RED}❌${NC} $1"; }

error_count=0

echo "[INFO] Gnamba health check"

check_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    report_error "Commande manquante: $1"
    error_count=$((error_count + 1))
  else
    report_ok "Commande disponible: $1"
  fi
}

check_port() {
  local port="$1"
  if ss -tulpn 2>/dev/null | grep -q ":${port} "; then
    report_ok "Port ${port} à l'écoute"
  else
    report_error "Port ${port} non disponible"
    error_count=$((error_count + 1))
  fi
}

check_docker_container() {
  local name="$1"
  if docker ps --format '{{.Names}}' | grep -qw "$name"; then
    report_ok "Conteneur Docker actif: ${name}"
  else
    report_error "Conteneur Docker absent: ${name}"
    error_count=$((error_count + 1))
  fi
}

check_http() {
  local url="$1"
  if curl -fsS --max-time 5 "$url" >/dev/null 2>&1; then
    report_ok "HTTP OK: ${url}"
  else
    report_error "HTTP failed: ${url}"
    error_count=$((error_count + 1))
  fi
}

check_command docker
check_command supabase
check_command curl
check_command ss

check_docker_container egs-frontend
check_docker_container egs-web
check_docker_container somagro-web
check_docker_container filebrowser

for port in 8080 8081 8082 54321 54322 54323 54324; do
  check_port "$port"
done

if curl -fsS --max-time 5 http://localhost:54321/health >/dev/null 2>&1; then
  report_ok "Supabase local health endpoint OK"
else
  report_warn "Supabase local /health endpoint unreachable"
fi

if [ -d "${ROOT_DIR}/backups/supabase/latest" ]; then
  report_ok "Backup latest directory exists"
else
  report_warn "Backup latest directory missing"
fi

if [ "$error_count" -eq 0 ]; then
  echo "[INFO] Gnamba health check passed"
  exit 0
else
  echo "[ERROR] Gnamba health check failed: ${error_count} issue(s)"
  exit 1
fi
