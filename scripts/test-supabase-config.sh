#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=/home/soma/gnamba-project/scripts/workspace-lib.sh
source "$ROOT_DIR/scripts/workspace-lib.sh"

usage() {
  cat <<'EOF'
Verification de configuration Supabase

Usage:
  scripts/test-supabase-config.sh [egs|somagro]

Par defaut, le script controle EGS.
EOF
}

check_var() {
  local file="$1"
  local key="$2"
  local required="$3"
  local value

  value="$(read_env_value "$file" "$key" || true)"
  if [ -z "$value" ]; then
    if [ "$required" = "required" ]; then
      log_error "$key non defini"
      return 1
    fi
    log_warn "$key non defini"
    return 0
  fi

  log_info "$key=$(mask_value "$value")"
}

check_url() {
  local label="$1"
  local url="$2"
  if [ -z "$url" ]; then
    log_warn "$label sans URL"
    return 0
  fi

  if curl -sS --max-time 5 "$url" >/dev/null 2>&1; then
    log_info "$label accessible: $url"
  else
    log_warn "$label inaccessible: $url"
  fi
}

run_checks() {
  local app="$1"
  local file
  local mode
  local egs_mode_key

  ensure_app "$app"
  assert_env_file_exists "$app"
  file="$(app_env_file "$app")"
  mode="$(get_app_mode "$app")"
  egs_mode_key="VITE_SUPABASE_MODE"
  if [ -z "$(read_env_value "$file" "VITE_SUPABASE_MODE" || true)" ] && [ -n "$(read_env_value "$file" "SUPABASE_MODE" || true)" ]; then
    egs_mode_key="SUPABASE_MODE"
  fi

  echo "============================================"
  echo "Verification Supabase - $(app_label "$app")"
  echo "============================================"
  echo "Env file: $file"
  echo "Mode: $mode"
  echo

  case "$app:$mode" in
    egs:local)
      check_var "$file" "$egs_mode_key" required
      check_var "$file" "VITE_SUPABASE_LOCAL_URL" required
      check_var "$file" "VITE_SUPABASE_LOCAL_ANON_KEY" required
      check_var "$file" "POSTGRES_PASSWORD" required
      check_var "$file" "JWT_SECRET" required
      check_url "EGS API locale" "$(read_env_value "$file" "VITE_SUPABASE_LOCAL_URL" || true)"
      ;;
    egs:cloud|egs:auto)
      check_var "$file" "$egs_mode_key" required
      check_var "$file" "VITE_SUPABASE_URL" required
      check_var "$file" "VITE_SUPABASE_ANON_KEY" required
      check_url "EGS API cloud" "$(read_env_value "$file" "VITE_SUPABASE_URL" || true)"
      ;;
    somagro:local)
      check_var "$file" "SOMAGRO_SUPABASE_MODE" required
      check_var "$file" "NEXT_PUBLIC_SUPABASE_LOCAL_URL" required
      check_var "$file" "NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY" required
      check_url "SomAgro API locale" "$(read_env_value "$file" "NEXT_PUBLIC_SUPABASE_LOCAL_URL" || true)"
      ;;
    somagro:cloud|somagro:hybrid)
      check_var "$file" "SOMAGRO_SUPABASE_MODE" required
      check_var "$file" "NEXT_PUBLIC_SUPABASE_URL" required
      check_var "$file" "NEXT_PUBLIC_SUPABASE_ANON_KEY" required
      check_url "SomAgro API cloud" "$(read_env_value "$file" "NEXT_PUBLIC_SUPABASE_URL" || true)"
      ;;
    *)
      die "Mode non supporte pour $(app_label "$app"): $mode"
      ;;
  esac

  echo
  if supabase_is_running "$app"; then
    log_info "$(app_label "$app"): Supabase local actif"
    printf '%s\n' "$(supabase_status_env "$app")" | sed -n '1,6p'
  else
    log_warn "$(app_label "$app"): Supabase local inactif"
  fi
}

main() {
  case "${1:-egs}" in
    help|--help|-h)
      usage
      ;;
    egs|somagro)
      run_checks "${1:-egs}"
      ;;
    *)
      die "Application invalide: ${1:-<vide>}"
      ;;
  esac
}

main "$@"
