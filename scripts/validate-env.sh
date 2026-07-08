#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_FILE="${1:-${ROOT_DIR}/.env}"

if [ ! -f "${TARGET_FILE}" ]; then
  echo "[ERROR] Target env file not found: ${TARGET_FILE}" >&2
  exit 1
fi

get_value() {
  local file="$1"
  local key="$2"
  awk -F= -v key="$key" '
    $0 ~ "^[[:space:]]*" key "=" {
      sub(/^[[:space:]]*[^=]+=/, "", $0)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", $0)
      gsub(/^"|"$/, "", $0)
      gsub(/^'\''|'\''$/, "", $0)
      print $0
      exit
    }
  ' "$file"
}

mode="$(get_value "${TARGET_FILE}" "VITE_SUPABASE_MODE" | tr '[:upper:]' '[:lower:]')"
if [ -z "${mode}" ]; then
  mode="$(get_value "${TARGET_FILE}" "SUPABASE_MODE" | tr '[:upper:]' '[:lower:]')"
fi

if [ -z "${mode}" ]; then
  echo "[ERROR] VITE_SUPABASE_MODE / SUPABASE_MODE is not defined in ${TARGET_FILE}" >&2
  exit 1
fi

if [ "${mode}" != "local" ]; then
  echo "[ERROR] This workspace now runs in local mode only. Use VITE_SUPABASE_MODE=local." >&2
  exit 1
fi

required_keys=(
  VITE_SUPABASE_LOCAL_URL
  VITE_SUPABASE_LOCAL_ANON_KEY
  POSTGRES_PASSWORD
  JWT_SECRET
)

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
  echo "✅ OK - Local Supabase env looks complete in ${TARGET_FILE}"
fi

if [ "$missing" -eq 1 ]; then
  exit 1
elif [ "$warning" -eq 1 ]; then
  exit 2
fi
