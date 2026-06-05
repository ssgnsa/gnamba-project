#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_FILE="${ROOT_DIR}/.env.template"
TARGET_FILE="${1:-${ROOT_DIR}/.env}"

if [ ! -f "${TEMPLATE_FILE}" ]; then
  echo "[ERROR] .env.template not found in ${ROOT_DIR}" >&2
  exit 1
fi

if [ ! -f "${TARGET_FILE}" ]; then
  echo "[ERROR] Target env file not found: ${TARGET_FILE}" >&2
  exit 1
fi

parse_keys() {
  grep -E '^[A-Z0-9_]+=.*' "$1" | sed 's/=.*//' | sort -u
}

get_value() {
  local file="$1"
  local key="$2"
  grep -E "^${key}=" "$file" | tail -n1 | cut -d'=' -f2- | sed 's/^ *//;s/ *$//'
}

read_mode() {
  grep -E '^VITE_SUPABASE_MODE=' "$TARGET_FILE" | tail -n1 | cut -d'=' -f2- | tr -d '\r' | tr '[:upper:]' '[:lower:]'
}

mode="$(read_mode)"
if [ -z "${mode}" ]; then
  echo "[ERROR] VITE_SUPABASE_MODE is not defined in ${TARGET_FILE}" >&2
  exit 1
fi

case "${mode}" in
  local)
    required_keys=(VITE_SUPABASE_LOCAL_URL VITE_SUPABASE_LOCAL_ANON_KEY POSTGRES_PASSWORD JWT_SECRET)
    ;;
  cloud)
    required_keys=(VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY SUPABASE_DB_PASSWORD)
    ;;
  *)
    echo "[ERROR] Unknown VITE_SUPABASE_MODE: ${mode}. Use 'local' or 'cloud'." >&2
    exit 1
    ;;
 esac

missing=0
warning=0

for key in "${required_keys[@]}"; do
  value="$(get_value "${TARGET_FILE}" "$key" || true)"
  if [ -z "${value}" ]; then
    echo "[ERROR] Missing variable: ${key}" >&2
    missing=1
    continue
  fi

  if [[ "$value" =~ ^(votre_|your_|super-secret|change-me|replace-me) ]]; then
    echo "[WARN] Placeholder value detected for ${key}: ${value}"
    warning=1
  fi
 done

if [ "$missing" -eq 0 ]; then
  echo "✅ OK - No missing variables in ${TARGET_FILE}"
fi

if [ "$missing" -eq 1 ]; then
  exit 1
elif [ "$warning" -eq 1 ]; then
  exit 2
fi
