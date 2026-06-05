#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_FILE="${ROOT_DIR}/sql/audit-rls.sql"
ENV_FILE="${ROOT_DIR}/.env"

if [ ! -f "${SQL_FILE}" ]; then
  echo "[ERROR] SQL audit file not found: ${SQL_FILE}" >&2
  exit 1
fi

read_env() {
  local key="$1"
  grep -E "^${key}=" "${ENV_FILE}" | tail -n1 | cut -d'=' -f2- | sed 's/^ *//;s/ *$//' || true
}

if grep -q '^VITE_SUPABASE_MODE=cloud' "${ENV_FILE}" 2>/dev/null; then
  ENV_FILE="${ROOT_DIR}/.env.server"
fi

if [ ! -f "${ENV_FILE}" ]; then
  echo "[ERROR] Environment file not found: ${ENV_FILE}" >&2
  exit 1
fi

HOST="$(read_env 'SUPABASE_DB_HOST')"
PORT="$(read_env 'SUPABASE_DB_PORT')"
DB_NAME="$(read_env 'SUPABASE_DB_NAME')"
DB_USER="$(read_env 'SUPABASE_DB_USER')"
DB_PASSWORD="$(read_env 'SUPABASE_DB_PASSWORD')"
VITE_SUPABASE_URL="$(read_env 'VITE_SUPABASE_URL')"

if [ -z "${HOST}" ] && [ -n "${VITE_SUPABASE_URL}" ]; then
  HOST="$(echo "${VITE_SUPABASE_URL}" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|db.\1.supabase.co|p')"
  PORT="5432"
  DB_NAME="postgres"
  DB_USER="postgres"
fi

if [ -z "${HOST}" ] || [ -z "${DB_PASSWORD}" ]; then
  echo "[ERROR] SUPABASE_DB_HOST and SUPABASE_DB_PASSWORD are required in ${ENV_FILE}" >&2
  exit 1
fi

if [ -z "${PORT}" ]; then
  PORT="5432"
fi
if [ -z "${DB_NAME}" ]; then
  DB_NAME="postgres"
fi
if [ -z "${DB_USER}" ]; then
  DB_USER="postgres"
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "[ERROR] psql is required to run this audit" >&2
  exit 1
fi

export PGPASSWORD="${DB_PASSWORD}"

echo "[INFO] Running RLS audit against ${HOST}:${PORT}/${DB_NAME}"
psql -h "${HOST}" -p "${PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${SQL_FILE}"

echo "[INFO] RLS audit completed"
