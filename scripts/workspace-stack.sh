#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=/home/soma/gnamba-project/scripts/workspace-lib.sh
source "$ROOT_DIR/scripts/workspace-lib.sh"

usage() {
  cat <<'EOF'
Workspace control for EGS + SomAgro

Usage:
  scripts/workspace-stack.sh status
  scripts/workspace-stack.sh ports [egs|somagro|all]
  scripts/workspace-stack.sh egs status
  scripts/workspace-stack.sh egs start-local
  scripts/workspace-stack.sh egs stop-local
  scripts/workspace-stack.sh egs set-mode <local|cloud|auto>
  scripts/workspace-stack.sh egs db-push [--dry-run|--apply]
  scripts/workspace-stack.sh somagro status
  scripts/workspace-stack.sh somagro start-local
  scripts/workspace-stack.sh somagro stop-local
  scripts/workspace-stack.sh somagro set-mode <local|cloud|hybrid>
  scripts/workspace-stack.sh somagro db-push [--dry-run|--apply]
  scripts/workspace-stack.sh dual status
  scripts/workspace-stack.sh dual start-local
  scripts/workspace-stack.sh dual stop-local

Rules:
  - EGS local ports: 54321 / 54322 / 54323 / 54324
  - SomAgro local ports: 55321 / 55322 / 55323 / 55324
  - db-push defaults to --dry-run if no flag is provided.
EOF
}

frontend_status() {
  local app="$1"
  local port
  port="$(app_frontend_port "$app")"
  if port_listening "$port"; then
    echo "online"
  else
    echo "offline"
  fi
}

show_ports() {
  local target="${1:-all}"

  case "$target" in
    all)
      printf '%-10s %-12s %-12s %-12s %-12s\n' "App" "API" "DB" "Studio" "Inbucket"
      print_port_table egs
      print_port_table somagro
      ;;
    egs|somagro)
      printf '%-10s %-12s %-12s %-12s %-12s\n' "App" "API" "DB" "Studio" "Inbucket"
      print_port_table "$target"
      ;;
    *)
      die "Cible de ports invalide: $target"
      ;;
  esac
}

print_status_for_app() {
  local app="$1"
  local env_output
  local api_url
  local db_url
  local studio_url
  local mode

  mode="$(get_app_mode "$app")"
  printf '%s\n' "$(app_label "$app")"
  printf '  repo: %s\n' "$(app_dir "$app")"
  printf '  project_id: %s\n' "$(app_project_id "$app")"
  printf '  mode: %s\n' "$mode"
  printf '  frontend: %s (port %s)\n' "$(frontend_status "$app")" "$(app_frontend_port "$app")"

  if env_output="$(supabase_status_env "$app")"; then
    api_url="$(printf '%s\n' "$env_output" | awk -F= '/^API_URL=/{gsub(/"/, "", $2); print $2}')"
    db_url="$(printf '%s\n' "$env_output" | awk -F= '/^DB_URL=/{gsub(/"/, "", $2); print $2}')"
    studio_url="$(printf '%s\n' "$env_output" | awk -F= '/^STUDIO_URL=/{gsub(/"/, "", $2); print $2}')"
    printf '  supabase_local: running\n'
    printf '  api_url: %s\n' "${api_url:-n/a}"
    printf '  db_url: %s\n' "${db_url:-n/a}"
    printf '  studio_url: %s\n' "${studio_url:-n/a}"
  else
    printf '  supabase_local: stopped\n'
  fi
}

set_mode() {
  local app="$1"
  local mode="$2"
  local file
  local mode_key
  local legacy_key
  local backup

  ensure_app "$app"
  assert_mode_allowed "$app" "$mode"
  assert_env_file_exists "$app"

  file="$(app_env_file "$app")"
  mode_key="$(app_mode_key "$app")"
  legacy_key="$(app_mode_legacy_key "$app")"
  backup="$(backup_file "$file")"

  set_env_value "$file" "$mode_key" "$mode"
  if [ -n "$legacy_key" ]; then
    set_env_value "$file" "$legacy_key" "$mode"
  fi

  log_info "$(app_label "$app"): mode defini sur '$mode'"
  log_info "Sauvegarde: $backup"
}

start_local() {
  local app="$1"
  ensure_app "$app"
  ensure_command docker
  ensure_command supabase
  assert_ports_safe_for_start "$app"
  log_info "Demarrage de $(app_label "$app") en local"
  supabase start --workdir "$(app_dir "$app")"
}

stop_local() {
  local app="$1"
  ensure_app "$app"
  ensure_command supabase
  log_info "Arret de $(app_label "$app") en local"
  supabase stop --project-id "$(app_project_id "$app")"
}

db_push() {
  local app="$1"
  local mode="${2:---dry-run}"
  local args=("--local")

  ensure_app "$app"
  ensure_command supabase

  if ! supabase_is_running "$app"; then
    die "$(app_label "$app") n'a pas de stack local actif. Demarrez d'abord 'start-local'."
  fi

  case "$mode" in
    --dry-run)
      args+=("--dry-run")
      log_info "$(app_label "$app"): simulation de db push"
      ;;
    --apply)
      args+=("--yes")
      log_warn "$(app_label "$app"): application reelle des migrations locales"
      ;;
    *)
      die "Option db-push invalide: $mode (attendu: --dry-run | --apply)"
      ;;
  esac

  supabase db push --workdir "$(app_dir "$app")" "${args[@]}"
}

app_dispatch() {
  local app="$1"
  local command="${2:-status}"

  case "$command" in
    status)
      print_status_for_app "$app"
      ;;
    start-local)
      start_local "$app"
      ;;
    stop-local)
      stop_local "$app"
      ;;
    set-mode)
      [ $# -ge 3 ] || die "Mode manquant pour $(app_label "$app")"
      set_mode "$app" "$3"
      ;;
    db-push)
      db_push "$app" "${3:---dry-run}"
      ;;
    ports)
      show_ports "$app"
      ;;
    *)
      die "Commande invalide pour $(app_label "$app"): $command"
      ;;
  esac
}

dual_dispatch() {
  local command="${1:-status}"

  case "$command" in
    status)
      print_status_for_app egs
      echo
      print_status_for_app somagro
      ;;
    start-local)
      start_local egs
      echo
      start_local somagro
      ;;
    stop-local)
      stop_local egs
      echo
      stop_local somagro
      ;;
    *)
      die "Commande invalide pour dual: $command"
      ;;
  esac
}

main() {
  local main_command="${1:-status}"

  case "$main_command" in
    status)
      dual_dispatch status
      ;;
    ports)
      show_ports "${2:-all}"
      ;;
    egs|somagro)
      app_dispatch "$main_command" "${2:-status}" "${@:3}"
      ;;
    dual)
      dual_dispatch "${2:-status}"
      ;;
    help|--help|-h)
      usage
      ;;
    *)
      die "Commande invalide: $main_command"
      ;;
  esac
}

main "$@"
