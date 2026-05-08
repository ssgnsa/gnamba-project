#!/usr/bin/env bash
set -euo pipefail

# Déploiement minimal pour le template d'attestation
# - reconstruit `dist/`
# - copie les fichiers dans le container `egs-web` (si présent)
# - recharge nginx dans le container

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "Deploy attestation: building frontend and copying dist to egs-web container"

# Refuser de déployer si l'arbre git n'est pas propre (prévention)
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository — continuing without git checks."
else
  if ! git diff --quiet || ! git diff --staged --quiet; then
    echo "Repository has uncommitted changes. Commit or stash before deploying."
    git status --short templates/attestation_ministere.html || true
    exit 1
  fi
fi

echo "Building Vite (rm -rf dist/ && npm run build)"
rm -rf dist/
npm run build

echo "Copying dist to running container 'egs-web' if present"
if docker ps --format '{{.Names}}' | grep -q '^egs-web$'; then
  docker cp dist/. egs-web:/usr/share/nginx/html
  # try reloading nginx, fall back to restarting the container
  docker exec egs-web nginx -s reload || docker restart egs-web || true
  echo "Copied dist to egs-web and reloaded container."
else
  echo "No running container named 'egs-web'. Build is ready in ./dist/."
fi

echo "Done. To validate: open https://your-site/foncier and check DevTools Network for new fingerprints."

exit 0
