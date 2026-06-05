#!/usr/bin/env bash
BACKUP_DIR="/home/soma/gnamba-project/backups/supabase/latest"
SCHEMA_FILE="${BACKUP_DIR}/schema_full.sql"
BACKUP_FILE="${BACKUP_DIR}/full_backup.json"

echo "[INFO] Checking backup files in ${BACKUP_DIR}"

if [ -f "${SCHEMA_FILE}" ]; then
  if [ -s "${SCHEMA_FILE}" ]; then
    echo "✅ OK - Schema file exists and is non-empty"
    if grep -q "CREATE TABLE" "${SCHEMA_FILE}"; then
      echo "✅ OK - Schema contains CREATE TABLE statements"
    else
      echo "⚠️ WARNING - Schema does not contain CREATE TABLE statements"
    fi
  else
    echo "❌ FAILED - Schema file is empty"
  fi
else
  echo "❌ FAILED - Schema file not found: ${SCHEMA_FILE}"
fi

if [ -f "${BACKUP_FILE}" ]; then
  if [ -s "${BACKUP_FILE}" ]; then
    echo "✅ OK - Backup file exists and is non-empty"
  else
    echo "❌ FAILED - Backup file is empty"
  fi
else
  echo "❌ FAILED - Backup file not found: ${BACKUP_FILE}"
fi

echo "[INFO] Backup verification completed"