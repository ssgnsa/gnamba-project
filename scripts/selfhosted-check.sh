#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Self-hosted readiness =="
for service in docker docker-compose; do
  if ! command -v "$service" >/dev/null 2>&1; then
    echo "[missing] $service"
  fi
done

if docker info >/dev/null 2>&1; then
  echo "[ok] Docker daemon reachable"
else
  echo "[warn] Docker daemon not reachable"
fi

for path in data/postgres data/minio data/ollama data/n8n data/uptime-kuma; do
  mkdir -p "$path"
  echo "[ok] $path"
done

echo "[done] self-hosted layout ready"
