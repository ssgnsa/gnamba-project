#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="${EGS_DEPLOY_DIR:-/var/www/egs/current}"
APP_NAME="EGS ERP"

log() {
  printf '[deploy-production] %s\n' "$*" >&2
}

fail() {
  log "ERROR: $*"
  exit 1
}

ensure_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Commande requise absente: $1"
}

write_version_file() {
  local build_date git_commit branch_name build_hash version_file root_version_file
  build_date="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  git_commit="$(git -C "$ROOT_DIR" rev-parse --verify HEAD)"
  branch_name="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD)"
  build_hash="$(sha256sum "$ROOT_DIR/dist/index.html" 2>/dev/null | awk '{print $1}' || true)"
  version_file="$ROOT_DIR/dist/VERSION.json"
  root_version_file="$ROOT_DIR/VERSION.json"

  cat > "$version_file" <<EOF
{
  "application": "$APP_NAME",
  "git_commit": "$git_commit",
  "branch": "$branch_name",
  "build_date": "$build_date",
  "build_hash": "${build_hash:-unknown}",
  "environment": "production"
}
EOF

  cp "$version_file" "$root_version_file"

  printf '%s\n' "$version_file"
}

reload_nginx() {
  if [[ "${EGS_SKIP_NGINX_RELOAD:-false}" == "true" ]]; then
    log "Reload Nginx ignoré via EGS_SKIP_NGINX_RELOAD=true."
    return 0
  fi

  if command -v systemctl >/dev/null 2>&1; then
    if systemctl list-unit-files nginx.service >/dev/null 2>&1; then
      systemctl reload nginx 2>/dev/null || systemctl restart nginx
      log "Nginx rechargé via systemctl."
      return 0
    fi
  fi

  if command -v nginx >/dev/null 2>&1; then
    nginx -s reload >/dev/null 2>&1 && {
      log "Nginx rechargé via nginx -s reload."
      return 0
    }
  fi

  log "Aucun rechargement Nginx automatique n'a pu être effectué."
}

main() {
  ensure_command npm
  ensure_command git

  cd "$ROOT_DIR"

  log "Commit validé: $(git rev-parse --short HEAD)"
  log "Installation des dépendances propres avec npm ci"
  npm ci

  log "Nettoyage des artefacts historiques"
  rm -rf dist dist-local

  log "Build officiel: npm run build"
  npm run build

  log "Génération de VERSION.json"
  write_version_file

  log "Vérification de release"
  npm run release:check

  log "Publication vers $DEPLOY_DIR"
  mkdir -p "$DEPLOY_DIR"

  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$ROOT_DIR/dist"/ "$DEPLOY_DIR"/
  else
    find "$DEPLOY_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    cp -a "$ROOT_DIR/dist/." "$DEPLOY_DIR/"
  fi

  log "Vérification du manifeste de version"
  test -f "$DEPLOY_DIR/VERSION.json" || fail "VERSION.json manquant dans $DEPLOY_DIR"
  cat "$DEPLOY_DIR/VERSION.json"

  reload_nginx

  log "Déploiement terminé"
  log "Artefact: $ROOT_DIR/dist"
  log "Publication: $DEPLOY_DIR"
}

main "$@"
