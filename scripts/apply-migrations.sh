#!/bin/bash
# apply-migrations.sh — Applique les migrations Alembic

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"

echo "=== Application des migrations Alembic ==="

cd "${BACKEND_DIR}"

if ! command -v alembic >/dev/null 2>&1; then
  echo "[ERROR] Alembic n'est pas installé" >&2
  echo "Installe-le avec: cd backend && pip install alembic" >&2
  exit 1
fi

echo "[INFO] Application de toutes les migrations..."
alembic upgrade head

echo "✅ Migrations appliquées avec succès"
