#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/supabase-migrations/egs"
TARGET_DIR="$ROOT_DIR/supabase/migrations"

mkdir -p "$TARGET_DIR"

find "$TARGET_DIR" -maxdepth 1 -type f -name '*.sql' -delete

copy_migration() {
  local source_name="$1"
  local target_name="$2"

  if [[ ! -f "$SOURCE_DIR/$source_name" ]]; then
    echo "Missing source migration: $source_name" >&2
    exit 1
  fi

  cp "$SOURCE_DIR/$source_name" "$TARGET_DIR/$target_name"
}

copy_migration "01_create_foncier_attestations_tables.sql" "20260326000000_create_foncier_attestations_tables.sql"
copy_migration "02_fix_unique_constraint.sql" "20260330000000_fix_unique_constraint.sql"
copy_migration "20260401_fix_foncier_attestations.sql" "20260401080000_fix_foncier_attestations.sql"
copy_migration "20260401_foncier_attestation_reference_archive.sql" "20260401090000_foncier_attestation_reference_archive.sql"
copy_migration "20260402_create_immobilier_tables.sql" "20260402080000_create_immobilier_tables.sql"
copy_migration "20260402_fix_tenants_schema.sql" "20260402090000_fix_tenants_schema.sql"
copy_migration "03_fix_rls_policies_foncier_attestations.sql" "20260404080000_fix_rls_policies_foncier_attestations.sql"
copy_migration "20260404_align_immobilier_schema.sql" "20260404110000_align_immobilier_schema.sql"

echo "Synced migrations into $TARGET_DIR"
