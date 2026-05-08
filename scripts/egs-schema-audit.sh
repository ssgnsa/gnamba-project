#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/src"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"
CLOUD_MANIFEST="$ROOT_DIR/supabase/generated/egs-cloud-schema.json"

if [ ! -d "$SRC_DIR" ] || [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Expected directories not found." >&2
  exit 1
fi

mapfile -t app_tables < <(
  perl -ne 'while (/\.from\((["\x27])([a-zA-Z0-9_]+)\1\)/g) { print "$2\n" }' $(find "$SRC_DIR" -type f \( -name '*.ts' -o -name '*.tsx' \) | sort) \
    | sort -u
)

mapfile -t migration_tables < <(
  perl -ne '
    while (/create\s+(?:or\s+replace\s+)?(?:table|view)\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/ig) { print lc($1), "\n" }
    while (/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/ig) { print lc($1), "\n" }
  ' $(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' | sort) \
    | sort -u
)

cloud_objects=()
if [ -f "$CLOUD_MANIFEST" ]; then
  mapfile -t cloud_objects < <(
    python3 - <<'PY' "$CLOUD_MANIFEST"
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    data = json.load(handle)

objects = set()
objects.update(data.get("tables", {}).keys())
objects.update(data.get("views", {}).keys())

for name in sorted(objects):
    print(name.lower())
PY
  )
fi

contains_item() {
  local needle="$1"
  shift
  printf '%s\n' "$@" | grep -Fxq "$needle"
}

echo "EGS schema audit"
echo "code_tables=${#app_tables[@]}"
echo "migration_tables=${#migration_tables[@]}"
if [ "${#cloud_objects[@]}" -gt 0 ]; then
  echo "cloud_objects=${#cloud_objects[@]}"
else
  echo "cloud_objects=unknown"
fi

missing=0
for table in "${app_tables[@]}"; do
  if ! contains_item "$table" "${migration_tables[@]}"; then
    echo "missing_in_migrations: $table"
    missing=1
  fi
done

cloud_missing=0
if [ "${#cloud_objects[@]}" -gt 0 ]; then
  for table in "${app_tables[@]}"; do
    if ! contains_item "$table" "${cloud_objects[@]}"; then
      echo "missing_in_cloud_snapshot: $table"
      cloud_missing=1
    fi
  done

  for object in "${cloud_objects[@]}"; do
    if ! contains_item "$object" "${migration_tables[@]}"; then
      echo "cloud_only_missing_in_migrations: $object"
    fi
  done
fi

if [ "$missing" -eq 0 ] && [ "$cloud_missing" -eq 0 ]; then
  echo "status=ok"
else
  echo "status=drift"
fi
