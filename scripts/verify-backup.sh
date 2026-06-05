#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_BASE="${ROOT_DIR}/backups/supabase"
LATEST_DIR="${BACKUP_BASE}/latest"

if [ -d "${LATEST_DIR}" ]; then
  BACKUP_DIR="${LATEST_DIR}"
elif [ -d "${BACKUP_BASE}" ]; then
  BACKUP_DIR="$(find "${BACKUP_BASE}" -maxdepth 1 -type d | sort | tail -n1)"
else
  echo "[ERROR] Backup directory not found: ${BACKUP_BASE}" >&2
  exit 1
fi

if [ -z "${BACKUP_DIR}" ] || [ "${BACKUP_DIR}" = "${LATEST_DIR}" ] && [ ! -d "${LATEST_DIR}" ]; then
  echo "[ERROR] No valid backup directory found" >&2
  exit 1
fi

SCHEMA_FILE="${BACKUP_DIR}/schema.sql"
FULL_DUMP="${BACKUP_DIR}/full_backup.dump"
FULL_SQL="${BACKUP_DIR}/full_backup.sql"

if [ -f "${FULL_DUMP}" ]; then
  echo "[INFO] Verifying custom format backup: ${FULL_DUMP}"
  if ! command -v pg_restore >/dev/null 2>&1; then
    echo "[ERROR] pg_restore is required to verify dump integrity" >&2
    exit 1
  fi
  pg_restore -l "${FULL_DUMP}" >/dev/null 2>&1
  echo "✅ OK - pg_restore can read ${FULL_DUMP}"
elif [ -f "${FULL_SQL}" ]; then
  echo "[INFO] Verifying SQL backup file: ${FULL_SQL}"
  if [ ! -s "${FULL_SQL}" ]; then
    echo "❌ FAILED - ${FULL_SQL} is empty" >&2
    exit 1
  fi
  echo "✅ OK - SQL backup file exists and is non-empty"
else
  echo "[ERROR] No backup file found in ${BACKUP_DIR}" >&2
  exit 1
fi

if [ -f "${SCHEMA_FILE}" ]; then
  if grep -q "CREATE TABLE" "${SCHEMA_FILE}"; then
    echo "✅ OK - schema.sql contains CREATE TABLE statements"
  else
    echo "⚠️ WARNING - schema.sql does not contain CREATE TABLE statements"
  fi
fi

echo "[INFO] Backup verification completed for ${BACKUP_DIR}"
