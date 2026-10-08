#!/usr/bin/env bash

# Canonical EGS deployment preflight.
#
# This command is deliberately read-only. It validates the repository release
# contract and the local Compose configuration; it does not pull images,
# change permissions, start containers, or apply migrations.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

ERRORS=0
WARNINGS=0
PASSES=0

pass() {
  printf '[OK] %s\n' "$*"
  PASSES=$((PASSES + 1))
}

warn() {
  printf '[WARN] %s\n' "$*" >&2
  WARNINGS=$((WARNINGS + 1))
}

fail() {
  printf '[ERROR] %s\n' "$*" >&2
  ERRORS=$((ERRORS + 1))
}

has_command() {
  command -v "$1" >/dev/null 2>&1
}

required_file() {
  local relative_path="$1"
  if [[ -f "${PROJECT_ROOT}/${relative_path}" ]]; then
    pass "Fichier présent: ${relative_path}"
  else
    fail "Fichier manquant: ${relative_path}"
  fi
}

check_required_env_names() {
  local env_file="${PROJECT_ROOT}/.env.server"
  local required_names=(
    POSTGRES_PASSWORD
    DATABASE_URL
    LOCAL_AUTH_SECRET
    FB_ADMIN_PASSWORD
  )

  if [[ ! -f "${env_file}" ]]; then
    fail ".env.server absent; aucun secret ne doit être inventé par ce script"
    return
  fi

  pass ".env.server présent"
  local name
  local value
  for name in "${required_names[@]}"; do
    if ! grep -Eq "^${name}=" "${env_file}"; then
      fail "Variable absente de .env.server: ${name}"
      continue
    fi
    value="$(sed -n "s/^${name}=//p" "${env_file}" | head -n 1)"
    if [[ -z "${value}" ]]; then
      fail "Variable vide dans .env.server: ${name}"
    else
      pass "Variable définie: ${name}"
    fi
  done
}

check_compose() {
  if ! has_command docker; then
    fail "Docker est requis pour valider docker-compose.yml"
    return
  fi
  if ! docker compose version >/dev/null 2>&1; then
    fail "Docker Compose v2 est requis"
    return
  fi
  pass "Docker Compose disponible"

  if docker compose --project-directory "${PROJECT_ROOT}" \
      --env-file "${PROJECT_ROOT}/.env.server" \
      -f "${PROJECT_ROOT}/docker-compose.yml" config --quiet >/dev/null 2>&1; then
    pass "docker-compose.yml est syntaxiquement valide avec l'environnement local"
  else
    fail "docker-compose.yml ne peut pas être résolu; vérifier les variables secrètes"
  fi
}

check_migrations() {
  local migration_python=""
  if [[ -x "${PROJECT_ROOT}/backend/.venv/bin/python" ]]; then
    migration_python="${PROJECT_ROOT}/backend/.venv/bin/python"
  elif has_command python3; then
    migration_python="$(command -v python3)"
  elif has_command python; then
    migration_python="$(command -v python)"
  fi

  if [[ -z "${migration_python}" ]]; then
    fail "Python absent: impossible de vérifier la chaîne Alembic"
    return
  fi

  if ! (cd "${PROJECT_ROOT}/backend" && "${migration_python}" -m alembic heads >/dev/null 2>&1); then
    fail "La chaîne Alembic locale est invalide ou Alembic est indisponible"
    return
  fi
  pass "Chaîne Alembic locale vérifiable"
}

check_release_contract() {
  if ! has_command git; then
    fail "Git est requis pour vérifier le worktree"
  elif [[ -n "$(git -C "${PROJECT_ROOT}" status --porcelain)" ]]; then
    fail "Worktree non propre: un déploiement signé doit partir d'un commit CI propre"
  else
    pass "Worktree propre"
  fi

  if has_command git && git -C "${PROJECT_ROOT}" diff --check >/dev/null 2>&1; then
    pass "git diff --check"
  else
    fail "git diff --check échoue"
  fi

  if has_command npm && [[ -d "${PROJECT_ROOT}/dist" ]]; then
    if (cd "${PROJECT_ROOT}" && npm run release:check >/dev/null 2>&1); then
      pass "release:check"
    else
      fail "release:check échoue"
    fi
  else
    warn "npm ou dist absent: release:check non exécuté"
  fi
}

main() {
  printf 'EGS deployment preflight (lecture seule)\n'
  printf 'Projet: %s\n' "${PROJECT_ROOT}"

  required_file docker-compose.yml
  required_file Dockerfile
  required_file backend/Dockerfile
  required_file backend/alembic.ini
  required_file scripts/apply-migrations.sh
  required_file scripts/verify-production-runtime.sh
  required_file scripts/deploy-production.sh
  required_file nginx/nginx-release.conf

  check_required_env_names
  check_compose
  check_migrations
  check_release_contract

  printf '\nRésultat: %d OK, %d avertissement(s), %d erreur(s)\n' \
    "${PASSES}" "${WARNINGS}" "${ERRORS}"
  if (( ERRORS > 0 )); then
    printf 'PRÉFLIGHT ÉCHOUÉ\n' >&2
    return 1
  fi
  printf 'PRÉFLIGHT RÉUSSI\n'
}

main "$@"
