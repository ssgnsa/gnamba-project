#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION_DIR="${ROOT_DIR}/supabase/migrations"
cd "${MIGRATION_DIR}"

SKIP_FILES=(
  "20260430090000_create_atomic_attestation_generation.sql.skip"
  "20260503084300_add_attestation_pdf_metadata.sql.skip"
  "20260508100000_fix_foncier_standalone.sql.skip"
)

for file in "${SKIP_FILES[@]}"; do
  if [ -f "${file}" ]; then
    mv "${file}" "${file%.skip}"
    echo "✅ Réactivé: ${file} -> ${file%.skip}"
  elif [ -f "${file%.skip}" ]; then
    echo "ℹ️  Déjà activé: ${file%.skip}"
  else
    echo "⚠️  Fichier introuvable: ${file}"
  fi
done

cd "${ROOT_DIR}"

echo "[INFO] Trace des auteurs des fichiers .skip (pour audit)"
for file in "${SKIP_FILES[@]}"; do
  echo "--- ${file} ---"
  git log --oneline --decorate -- "supabase/migrations/${file}" || true
done

echo "[INFO] Finished reactivating migrations. Run scripts/apply-migrations.sh after Supabase local is running."
