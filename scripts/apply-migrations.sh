#!/bin/bash
# apply-migrations.sh — Applique les migrations Alembic

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"

echo "=== Application des migrations Alembic ==="

cd "${BACKEND_DIR}"

if [[ -x "${BACKEND_DIR}/.venv/bin/python" ]]; then
  MIGRATION_PYTHON="${BACKEND_DIR}/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  MIGRATION_PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  MIGRATION_PYTHON=python
else
  MIGRATION_PYTHON=
fi

if [[ -z "${MIGRATION_PYTHON}" ]] || ! "${MIGRATION_PYTHON}" -m alembic --version >/dev/null 2>&1; then
  echo "[ERROR] Python ou Alembic n'est pas installé dans l'environnement actif" >&2
  echo "Installe-le avec: cd backend && pip install -r requirements.txt" >&2
  exit 1
fi

echo "[INFO] Vérification des gardes et application des migrations..."
"${MIGRATION_PYTHON}" -m app.core.migration_runner
