#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

TARGETS=(
  "_archive"
  "dist"
  "dist-local"
  "dist_old"
  "src/App.tsx.bak2"
)

echo "[INFO] Cleaning obsolete archives and build artifacts"
for target in "${TARGETS[@]}"; do
  shopt -s nullglob
  files=( $target )
  shopt -u nullglob

  if [ "${#files[@]}" -eq 0 ]; then
    echo "ℹ️  Rien à supprimer pour: ${target}"
    continue
  fi

  for file in "${files[@]}"; do
    rm -rf "${file}"
    echo "✅ Supprimé: ${file}"
  done
done

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add -A
  if git diff --cached --quiet; then
    echo "ℹ️  Aucun changement git à committer"
  else
    git commit -m "chore: cleanup obsolete archives and build artifacts"
    echo "✅ Commit created for cleanup"
  fi
else
  echo "⚠️  Pas dans un dépôt git, pas de commit effectué"
fi
