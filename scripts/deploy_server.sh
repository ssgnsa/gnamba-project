#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.server"
COMPOSE_FILE="docker-compose.server.yml"
FORCE_REBUILD=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --no-cache|--force-rebuild)
      FORCE_REBUILD=1
      ;;
    *)
      ENV_FILE="$1"
      ;;
  esac
  shift
done

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but not installed."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create it from .env.server.example and fill Supabase values."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [ -z "${VITE_SUPABASE_URL:-}" ] || [ -z "${VITE_SUPABASE_ANON_KEY:-}" ]; then
  echo "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in $ENV_FILE"
  exit 1
fi

if [ -z "${WEB_PORT:-}" ] && [ -n "${WEB_TUNNEL_PORT:-}" ]; then
  WEB_PORT="$WEB_TUNNEL_PORT"
  export WEB_PORT
fi

BUILD_CMD=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --pull)
UP_CMD=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans)

if [ "$FORCE_REBUILD" -eq 1 ]; then
  BUILD_CMD+=(--no-cache)
  UP_CMD+=(--force-recreate)
fi

echo "[1/3] Building image..."
build_ok=0
for attempt in 1 2 3; do
  echo "Build attempt $attempt/3"
  if "${BUILD_CMD[@]}"; then
    build_ok=1
    break
  fi
  if [ "$attempt" -lt 3 ]; then
    echo "Build failed, retrying in 15s..."
    sleep 15
  fi
done

if [ "$build_ok" -ne 1 ]; then
  echo "Build failed after 3 attempts."
  exit 1
fi

echo "[2/3] Starting/updating container..."
"${UP_CMD[@]}"

echo "[3/3] Service status:"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo
echo "Deployment complete."
echo "App URL: http://$(hostname -I | awk '{print $1}'):${WEB_PORT:-80}"
