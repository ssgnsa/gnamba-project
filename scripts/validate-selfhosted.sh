#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Validation self-hosted =="

echo "- Check frontend build"
npm run build >/tmp/egs-selfhosted-build.log 2>&1

echo "- Check typecheck"
npm run typecheck >/tmp/egs-selfhosted-typecheck.log 2>&1

echo "- Check compose file"
docker compose -f docker-compose.selfhosted.yml config >/tmp/egs-selfhosted-compose.log 2>&1

echo "[ok] self-hosted validation completed"
