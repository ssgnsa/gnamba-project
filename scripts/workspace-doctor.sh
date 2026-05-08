#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=/home/soma/gnamba-project/scripts/workspace-lib.sh
source "$ROOT_DIR/scripts/workspace-lib.sh"

STRICT=0

usage() {
  cat <<'EOF'
Doctor du workspace EGS + SomAgro

Usage:
  scripts/workspace-doctor.sh
  scripts/workspace-doctor.sh --strict
  scripts/workspace-doctor.sh egs
  scripts/workspace-doctor.sh somagro

Checks:
  - mode env present
  - local stack running or stopped
  - expected migrations vs applied migrations
  - contamination croisee des dossiers de migrations
EOF
}

DRIFT_FOUND=0

note_drift() {
  DRIFT_FOUND=1
}

print_list() {
  local label="$1"
  shift
  local items=("$@")
  if [ "${#items[@]}" -eq 0 ]; then
    echo "  $label: none"
  else
    echo "  $label: ${items[*]}"
  fi
}

compare_migrations() {
  local app="$1"
  local expected applied
  local -a expected_arr=()
  local -a applied_arr=()
  local -a missing_arr=()
  local -a extra_arr=()
  local value

  mapfile -t expected_arr < <(list_expected_migration_versions "$app")
  if supabase_is_running "$app"; then
    mapfile -t applied_arr < <(list_applied_migration_versions "$app")
  fi

  echo "  migrations_expected: ${#expected_arr[@]}"
  if [ "${#applied_arr[@]}" -gt 0 ]; then
    echo "  migrations_applied: ${#applied_arr[@]}"
  else
    echo "  migrations_applied: unknown"
  fi

  if [ "${#applied_arr[@]}" -gt 0 ]; then
    for value in "${expected_arr[@]}"; do
      if ! printf '%s\n' "${applied_arr[@]}" | grep -Fxq "$value"; then
        missing_arr+=("$value")
      fi
    done

    for value in "${applied_arr[@]}"; do
      if ! printf '%s\n' "${expected_arr[@]}" | grep -Fxq "$value"; then
        extra_arr+=("$value")
      fi
    done

    print_list "migrations_pending" "${missing_arr[@]}"
    print_list "migrations_untracked_in_repo" "${extra_arr[@]}"

    if [ "${#missing_arr[@]}" -gt 0 ] || [ "${#extra_arr[@]}" -gt 0 ]; then
      note_drift
    fi
  fi
}

check_cross_contamination() {
  local app="$1"
  local dir
  local pattern

  dir="$(app_migrations_dir "$app")"
  case "$app" in
    egs)
      pattern='somagro|animals|crop_|livestock|inventory_|construction_projects|site_settings|site_blog'
      ;;
    somagro)
      pattern='foncier|attestation|immobilier|lease_contracts|rent_payments|properties'
      ;;
  esac

  if rg -n "$pattern" "$dir" >/dev/null 2>&1; then
    log_warn "$(app_label "$app"): contamination potentielle detectee dans $dir"
    note_drift
  else
    log_info "$(app_label "$app"): aucun melange evident dans $dir"
  fi
}

check_egs_schema_drift() {
  local output
  output="$(bash "$ROOT_DIR/scripts/egs-schema-audit.sh")"
  printf '%s\n' "$output" | sed 's/^/  /'
  if printf '%s\n' "$output" | grep -q '^status=drift$'; then
    note_drift
  fi
}

check_egs_cloud_snapshot() {
  local manifest="$ROOT_DIR/supabase/generated/egs-cloud-schema.json"
  if [ ! -f "$manifest" ]; then
    echo "  cloud_snapshot: missing"
    return
  fi

  python3 - <<'PY' "$manifest" | sed 's/^/  /'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    data = json.load(handle)

generated_at = data.get("generated_at_utc", "unknown")
project_ref = data.get("project_ref", "unknown")
table_count = data.get("table_count", 0)
view_count = data.get("view_count", 0)

print("cloud_snapshot: present")
print(f"cloud_snapshot_generated_at: {generated_at}")
print(f"cloud_snapshot_project_ref: {project_ref}")
print(f"cloud_snapshot_tables: {table_count}")
print(f"cloud_snapshot_views: {view_count}")
PY
}

doctor_app() {
  local app="$1"
  local mode

  ensure_app "$app"
  mode="$(get_app_mode "$app")"

  echo "$(app_label "$app")"
  echo "  repo: $(app_dir "$app")"
  echo "  env: $(app_env_file "$app")"
  echo "  mode: $mode"
  echo "  supabase_local: $(supabase_is_running "$app" && echo running || echo stopped)"
  compare_migrations "$app"
  check_cross_contamination "$app"
  if [ "$app" = "egs" ]; then
    check_egs_cloud_snapshot
    check_egs_schema_drift
  fi
}

main() {
  local target="all"

  while [ $# -gt 0 ]; do
    case "$1" in
      --strict)
        STRICT=1
        ;;
      egs|somagro)
        target="$1"
        ;;
      help|--help|-h)
        usage
        exit 0
        ;;
      *)
        die "Argument invalide: $1"
        ;;
    esac
    shift
  done

  if [ "$target" = "all" ]; then
    doctor_app egs
    echo
    doctor_app somagro
  else
    doctor_app "$target"
  fi

  if [ "$STRICT" -eq 1 ] && [ "$DRIFT_FOUND" -ne 0 ]; then
    exit 1
  fi
}

main "$@"
