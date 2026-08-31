#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.server"

if [ ! -f "${ENV_FILE}" ]; then
  echo "[ERROR] .env.server not found in ${ROOT_DIR}" >&2
  exit 1
fi

get_value() {
  local key="$1"
  grep -E "^${key}=" "${ENV_FILE}" | tail -n1 | cut -d'=' -f2- | sed 's/^ *//;s/ *$//'
}

DB_PASSWORD="$(get_value 'DB_PASSWORD')"
VITE_SUPABASE_URL="$(get_value 'VITE_SUPABASE_URL')"

if [ -z "${DB_PASSWORD:-}" ]; then
  echo "[ERROR] DB_PASSWORD is not defined in ${ENV_FILE}" >&2
  exit 1
fi

if [ -z "${VITE_SUPABASE_URL:-}" ]; then
  echo "[ERROR] VITE_SUPABASE_URL is not defined in ${ENV_FILE}" >&2
  exit 1
fi

HOST="$(echo "${VITE_SUPABASE_URL}" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|db.\1.supabase.co|p')"
if [ -z "${HOST}" ]; then
  echo "[ERROR] Could not parse Supabase DB host from VITE_SUPABASE_URL" >&2
  exit 1
fi

export PGPASSWORD="${DB_PASSWORD}"

if ! command -v psql >/dev/null 2>&1; then
  echo "[ERROR] psql is not installed. Install postgresql-client or libpq-dev." >&2
  exit 1
fi

psql -h "${HOST}" -U postgres -d postgres -c "SELECT 1" >/dev/null 2>&1 && {
  echo "✅ OK - Database connection successful"
  exit 0
} || {
  echo "❌ FAILED - Database connection failed"
  exit 1
}
