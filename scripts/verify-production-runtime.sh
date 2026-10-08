#!/usr/bin/env bash

# Read-only production runtime verifier.
# It never creates, alters, migrates, or restarts anything.

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATABASE_URL_VALUE="${DATABASE_URL:-}"
ERRORS=0
DATABASE_REACHABLE=0

error() {
  printf '[ERROR] %s\n' "$*" >&2
  ERRORS=$((ERRORS + 1))
}

ok() {
  printf '[OK] %s\n' "$*"
}

if [[ -z "${DATABASE_URL_VALUE}" ]]; then
  error "DATABASE_URL doit être fourni explicitement; aucun DSN implicite"
elif ! command -v psql >/dev/null 2>&1; then
  error "psql est requis pour vérifier le rôle PostgreSQL"
else
  role_row="$(PGCONNECT_TIMEOUT=5 psql "${DATABASE_URL_VALUE}" -X -Atqc \
    "SELECT current_database(), current_user, session_user, rolsuper FROM pg_roles WHERE rolname = current_user;" \
    2>/dev/null)"
  if [[ -z "${role_row}" ]]; then
    error "Connexion PostgreSQL impossible ou rôle courant introuvable"
  else
    DATABASE_REACHABLE=1
    IFS='|' read -r database_name current_user session_user is_superuser <<<"${role_row}"
    if [[ "${is_superuser}" == "t" ]]; then
      error "Le rôle PostgreSQL courant est superutilisateur (${current_user}); rôle applicatif requis"
    else
      ok "Rôle PostgreSQL non-superutilisateur: ${current_user}"
    fi
    printf 'Base: %s; session: %s\n' "${database_name}" "${session_user}"
  fi

  if (( DATABASE_REACHABLE == 1 )); then
    version_row="$(PGCONNECT_TIMEOUT=5 psql "${DATABASE_URL_VALUE}" -X -Atqc \
      "SELECT string_agg(version_num, ',' ORDER BY version_num) FROM alembic_version;" \
      2>/dev/null)"
    if [[ -z "${version_row}" ]]; then
      error "Révision Alembic courante introuvable"
    else
      ok "Révision Alembic en base: ${version_row}"
    fi
  fi
fi

if [[ -n "${DATABASE_URL_VALUE}" && ${DATABASE_REACHABLE} -eq 1 ]]; then
  migration_python=""
  if [[ -x "${ROOT_DIR}/backend/.venv/bin/python" ]]; then
    migration_python="${ROOT_DIR}/backend/.venv/bin/python"
  elif command -v python3 >/dev/null 2>&1; then
    migration_python="$(command -v python3)"
  fi

  if [[ -z "${migration_python}" ]]; then
    error "Python/Alembic indisponible pour comparer la révision de l'image"
  elif ! heads_output="$(cd "${ROOT_DIR}/backend" && DATABASE_URL="${DATABASE_URL_VALUE}" "${migration_python}" -m alembic heads 2>&1)"; then
    error "Impossible de lire les heads Alembic du code courant"
  elif ! current_output="$(cd "${ROOT_DIR}/backend" && DATABASE_URL="${DATABASE_URL_VALUE}" "${migration_python}" -m alembic current 2>&1)"; then
    error "La révision en base n'est pas reconnue par le code courant"
    printf '%s\n' "${current_output}" >&2
  else
    printf 'Heads du code courant:\n%s\n' "${heads_output}"
    printf 'Révision courante reconnue:\n%s\n' "${current_output}"
    ok "Le code courant reconnaît la révision Alembic de la base"
  fi
fi

if (( ERRORS > 0 )); then
  printf 'RUNTIME PREFLIGHT ÉCHOUÉ (%d erreur(s))\n' "${ERRORS}" >&2
  exit 1
fi

printf 'RUNTIME PREFLIGHT RÉUSSI\n'
