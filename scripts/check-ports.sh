#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=/home/soma/gnamba-project/scripts/workspace-lib.sh
source "$ROOT_DIR/scripts/workspace-lib.sh"

usage() {
  cat <<'EOF'
Verification des ports EGS + SomAgro

Usage:
  scripts/check-ports.sh
  scripts/check-ports.sh all
  scripts/check-ports.sh egs
  scripts/check-ports.sh somagro
  scripts/check-ports.sh 54321

Par defaut, le script controle les deux piles Supabase locales.
EOF
}

describe_port() {
  case "$1" in
    54321) echo "EGS API" ;;
    54322) echo "EGS DB" ;;
    54323) echo "EGS Studio" ;;
    54324) echo "EGS Inbucket" ;;
    55321) echo "SomAgro API" ;;
    55322) echo "SomAgro DB" ;;
    55323) echo "SomAgro Studio" ;;
    55324) echo "SomAgro Inbucket" ;;
    8080) echo "EGS Frontend" ;;
    8082) echo "SomAgro Frontend" ;;
    *) echo "Port inconnu" ;;
  esac
}

check_one() {
  local port="$1"
  local label
  label="$(describe_port "$port")"
  if port_listening "$port"; then
    log_warn "Port $port ($label) est occupe"
  else
    log_info "Port $port ($label) est libre"
  fi
}

check_group() {
  local target="$1"
  local port

  case "$target" in
    egs)
      for port in $(app_ports egs) "$(app_frontend_port egs)"; do
        check_one "$port"
      done
      ;;
    somagro)
      for port in $(app_ports somagro) "$(app_frontend_port somagro)"; do
        check_one "$port"
      done
      ;;
    all)
      check_group egs
      check_group somagro
      ;;
    *)
      die "Cible invalide: $target"
      ;;
  esac
}

main() {
  case "${1:-all}" in
    help|--help|-h)
      usage
      ;;
    all|egs|somagro)
      check_group "${1:-all}"
      ;;
    *)
      if [[ "${1:-}" =~ ^[0-9]+$ ]]; then
        check_one "$1"
      else
        die "Argument invalide: ${1:-<vide>}"
      fi
      ;;
  esac
}

main "$@"
