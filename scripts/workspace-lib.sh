#!/usr/bin/env bash

set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}[OK]${NC} $*"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $*" >&2
}

die() {
  log_error "$*"
  exit 1
}

ensure_command() {
  command -v "$1" >/dev/null 2>&1 || die "Commande requise introuvable: $1"
}

ensure_app() {
  case "${1:-}" in
    egs|somagro) ;;
    *) die "Application invalide: ${1:-<vide>} (attendu: egs | somagro)" ;;
  esac
}

app_label() {
  case "$1" in
    egs) echo "EGS" ;;
    somagro) echo "SomAgro" ;;
  esac
}

app_dir() {
  case "$1" in
    egs) echo "$WORKSPACE_ROOT" ;;
    somagro) echo "$WORKSPACE_ROOT/somagro-erp" ;;
  esac
}

app_project_id() {
  case "$1" in
    egs) echo "gnamba-project" ;;
    somagro) echo "somagro-erp" ;;
  esac
}

app_mode_key() {
  case "$1" in
    egs) echo "VITE_SUPABASE_MODE" ;;
    somagro) echo "SOMAGRO_SUPABASE_MODE" ;;
  esac
}

app_mode_legacy_key() {
  case "$1" in
    egs) echo "SUPABASE_MODE" ;;
    somagro) echo "" ;;
  esac
}

app_env_file() {
  case "$1" in
    egs) echo "$WORKSPACE_ROOT/.env" ;;
    somagro) echo "$WORKSPACE_ROOT/somagro-erp/.env.server" ;;
  esac
}

app_env_example() {
  case "$1" in
    egs) echo "$WORKSPACE_ROOT/.env.local.example ou $WORKSPACE_ROOT/.env.example" ;;
    somagro) echo "$WORKSPACE_ROOT/somagro-erp/.env.server.example" ;;
  esac
}

app_api_port() {
  case "$1" in
    egs) echo "54321" ;;
    somagro) echo "55321" ;;
  esac
}

app_db_port() {
  case "$1" in
    egs) echo "54322" ;;
    somagro) echo "55322" ;;
  esac
}

app_studio_port() {
  case "$1" in
    egs) echo "54323" ;;
    somagro) echo "55323" ;;
  esac
}

app_inbucket_port() {
  case "$1" in
    egs) echo "54324" ;;
    somagro) echo "55324" ;;
  esac
}

app_frontend_port() {
  case "$1" in
    egs) echo "8080" ;;
    somagro) echo "8082" ;;
  esac
}

app_frontend_compose() {
  case "$1" in
    egs) echo "$WORKSPACE_ROOT/docker-compose.server.yml" ;;
    somagro) echo "$WORKSPACE_ROOT/docker-compose.somagro.server.yml" ;;
  esac
}

app_migrations_dir() {
  case "$1" in
    egs) echo "$WORKSPACE_ROOT/supabase/migrations" ;;
    somagro) echo "$WORKSPACE_ROOT/somagro-erp/supabase/migrations" ;;
  esac
}

app_db_container() {
  case "$1" in
    egs) echo "supabase_db_gnamba-project" ;;
    somagro) echo "supabase_db_somagro-erp" ;;
  esac
}

app_ports() {
  local app="$1"
  printf '%s %s %s %s\n' \
    "$(app_api_port "$app")" \
    "$(app_db_port "$app")" \
    "$(app_studio_port "$app")" \
    "$(app_inbucket_port "$app")"
}

port_listening() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "( sport = :$port )" 2>/dev/null | awk 'NR > 1 { found = 1 } END { exit found ? 0 : 1 }'
  elif command -v lsof >/dev/null 2>&1; then
    lsof -Pi ":$port" -sTCP:LISTEN -t >/dev/null 2>&1
  elif command -v netstat >/dev/null 2>&1; then
    netstat -tln 2>/dev/null | grep -q ":$port "
  else
    return 1
  fi
}

docker_project_running() {
  local project_id="$1"
  docker ps --format '{{.Names}}' 2>/dev/null | grep -Eq "_${project_id}$"
}

supabase_is_running() {
  local app="$1"
  supabase status -o env --workdir "$(app_dir "$app")" >/dev/null 2>&1
}

supabase_status_env() {
  local app="$1"
  supabase status -o env --workdir "$(app_dir "$app")" 2>/dev/null
}

read_env_value() {
  local file="$1"
  local key="$2"

  if [ ! -f "$file" ]; then
    return 1
  fi

  awk -F= -v key="$key" '
    $0 ~ "^[[:space:]]*" key "=" {
      sub(/^[[:space:]]*[^=]+=/, "", $0)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", $0)
      print $0
      exit
    }
  ' "$file"
}

backup_file() {
  local file="$1"
  local stamp
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  cp "$file" "${file}.bak.${stamp}"
  echo "${file}.bak.${stamp}"
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  local tmp
  tmp="$(mktemp)"

  awk -v key="$key" -v value="$value" '
    BEGIN { done = 0 }
    $0 ~ "^[[:space:]]*" key "=" {
      print key "=" value
      done = 1
      next
    }
    { print }
    END {
      if (!done) print key "=" value
    }
  ' "$file" > "$tmp"

  mv "$tmp" "$file"
}

get_app_mode() {
  local app="$1"
  local file
  local mode_key
  local legacy_key
  local mode

  file="$(app_env_file "$app")"
  mode_key="$(app_mode_key "$app")"
  legacy_key="$(app_mode_legacy_key "$app")"

  mode="$(read_env_value "$file" "$mode_key" || true)"
  if [ -z "$mode" ] && [ -n "$legacy_key" ]; then
    mode="$(read_env_value "$file" "$legacy_key" || true)"
  fi
  echo "${mode:-non-defini}"
}

assert_env_file_exists() {
  local app="$1"
  local file
  file="$(app_env_file "$app")"
  [ -f "$file" ] || die "Fichier d'environnement introuvable: $file. Copiez ${app_env_example "$app"}."
}

assert_mode_allowed() {
  local app="$1"
  local mode="$2"

  case "$app:$mode" in
    egs:local|egs:cloud|egs:auto) ;;
    somagro:local|somagro:cloud|somagro:hybrid) ;;
    *) die "Mode invalide pour $(app_label "$app"): $mode" ;;
  esac
}

assert_ports_safe_for_start() {
  local app="$1"
  local project_id
  local running
  local port

  project_id="$(app_project_id "$app")"
  running=0
  if docker_project_running "$project_id"; then
    running=1
  fi

  for port in $(app_ports "$app"); do
    if port_listening "$port" && [ "$running" -eq 0 ]; then
      die "Le port $port est deja occupe. Refus de demarrer $(app_label "$app") pour eviter une collision."
    fi
  done
}

mask_value() {
  local value="$1"
  if [ -z "$value" ]; then
    echo "<vide>"
  elif [ "${#value}" -le 12 ]; then
    echo "$value"
  else
    echo "${value:0:8}..."
  fi
}

print_port_table() {
  local app="$1"
  printf '%-10s %-12s %-12s %-12s %-12s\n' "$(app_label "$app")" "$(app_api_port "$app")" "$(app_db_port "$app")" "$(app_studio_port "$app")" "$(app_inbucket_port "$app")"
}

list_expected_migration_versions() {
  local app="$1"
  local dir
  dir="$(app_migrations_dir "$app")"
  find "$dir" -maxdepth 1 -type f -name '*.sql' -printf '%f\n' | sort | sed -E 's/^([0-9]+).*/\1/'
}

list_applied_migration_versions() {
  local app="$1"
  local container
  container="$(app_db_container "$app")"
  docker exec "$container" psql -U postgres -d postgres -At -c "select version from supabase_migrations.schema_migrations order by version;" 2>/dev/null || true
}
