#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION_DIR="${ROOT_DIR}/supabase"

if ! command -v supabase >/dev/null 2>&1; then
  echo "[ERROR] supabase CLI is not installed or not in PATH" >&2
  exit 1
fi

cd "${MIGRATION_DIR}"

echo "[INFO] Applying Supabase migrations from ${MIGRATION_DIR}"

if ! supabase status >/dev/null 2>&1; then
  echo "[ERROR] Supabase local is not running. Start it with scripts/start-supabase-local.sh" >&2
  exit 1
fi

supabase db push

echo "[INFO] Migration apply completed"
