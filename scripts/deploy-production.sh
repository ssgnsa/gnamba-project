#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="${EGS_DEPLOY_DIR:-/var/www/egs/current}"

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

assert_clean_worktree() {
  if [[ -n "$(git status --porcelain)" ]]; then
    fail "Le worktree doit être propre avant un déploiement de production. Utilisez un commit CI signé."
  fi
}

configure_production_build_env() {
  export VITE_API_URL="${VITE_API_URL:-https://api.gnambaservices.ci/api/v1}"
  export VITE_LOCAL_API_URL="${VITE_LOCAL_API_URL:-$VITE_API_URL}"
  export VITE_SELFHOSTED_MODE="true"

  if [[ "$VITE_API_URL" =~ ^https?://(localhost|127\.0\.0\.1|\[::1\])(:[0-9]+)?(/|$) ]]; then
    fail "VITE_API_URL ne doit pas pointer vers une adresse loopback en production"
  fi
  if [[ "$VITE_LOCAL_API_URL" =~ ^https?://(localhost|127\.0\.0\.1|\[::1\])(:[0-9]+)?(/|$) ]]; then
    fail "VITE_LOCAL_API_URL ne doit pas pointer vers une adresse loopback en production"
  fi

  log "API frontend de production: $VITE_API_URL"
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

  assert_clean_worktree
  configure_production_build_env

  log "Commit validé: $(git rev-parse --short HEAD)"
  log "Installation des dépendances propres avec npm ci"
  npm ci

  log "Nettoyage des artefacts historiques"
  rm -rf dist dist-local

  log "Build officiel: npm run build"
  EGS_WRITE_ROOT_VERSION=false npm run build

  log "VERSION.json généré par le build"

  log "Vérification de release"
  npm run release:check
  npm run validate:frontend -- --strict

  log "Publication vers $DEPLOY_DIR"
  mkdir -p "$DEPLOY_DIR"

  if command -v rsync >/dev/null 2>&1; then
    rsync -a "$ROOT_DIR/dist"/ "$DEPLOY_DIR"/
  else
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
