#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPABASE_DIR="$ROOT_DIR/supabase"
GENERATED_DIR="$SUPABASE_DIR/generated"
PROJECT_REF_FILE="$SUPABASE_DIR/.temp/project-ref"
PROJECT_REF="${EGS_PROJECT_REF:-}"
SOURCE_FILE=""
QUERY_TIMEOUT="${EGS_SCHEMA_QUERY_TIMEOUT:-60s}"

usage() {
  cat <<'EOF'
Refresh EGS cloud schema snapshot

Usage:
  scripts/refresh-egs-cloud-schema.sh
  scripts/refresh-egs-cloud-schema.sh --from-file /tmp/egs-cloud-types.ts
  scripts/refresh-egs-cloud-schema.sh --project-ref thykrnoqgylrbfupophs

Options:
  --from-file FILE    Use an existing generated TypeScript snapshot instead of fetching it.
  --project-ref REF   Override the linked Supabase project ref.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --from-file)
      [ $# -ge 2 ] || {
        echo "--from-file requires a path argument." >&2
        exit 1
      }
      SOURCE_FILE="$2"
      shift 2
      ;;
    --project-ref)
      [ $# -ge 2 ] || {
        echo "--project-ref requires a value." >&2
        exit 1
      }
      PROJECT_REF="$2"
      shift 2
      ;;
    -h|--help|help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ -z "$PROJECT_REF" ] && [ -f "$PROJECT_REF_FILE" ]; then
  PROJECT_REF="$(tr -d '[:space:]' < "$PROJECT_REF_FILE")"
fi

if [ -z "$PROJECT_REF" ] && [ -z "$SOURCE_FILE" ]; then
  echo "Unable to determine EGS project ref. Set EGS_PROJECT_REF or link the Supabase project first." >&2
  exit 1
fi

mkdir -p "$GENERATED_DIR"

tmp_types="$(mktemp)"
tmp_manifest="$(mktemp)"
tmp_objects="$(mktemp)"
last_error=""

cleanup() {
  rm -f "$tmp_types" "$tmp_manifest" "$tmp_objects"
}
trap cleanup EXIT

if [ -n "$SOURCE_FILE" ]; then
  if [ ! -s "$SOURCE_FILE" ]; then
    echo "Snapshot source file not found or empty: $SOURCE_FILE" >&2
    exit 1
  fi
  cp "$SOURCE_FILE" "$tmp_types"
else
  for attempt in 1 2 3; do
    if supabase gen types --project-id "$PROJECT_REF" --lang typescript --schema public --query-timeout "$QUERY_TIMEOUT" > "$tmp_types"; then
      break
    fi
    last_error="supabase gen types failed on attempt $attempt"
    sleep "$attempt"
  done
fi

if [ ! -s "$tmp_types" ]; then
  if [ -s /tmp/egs-cloud-types.ts ]; then
    cp /tmp/egs-cloud-types.ts "$tmp_types"
    echo "warning: using fallback snapshot from /tmp/egs-cloud-types.ts" >&2
  elif [ -s "$GENERATED_DIR/egs-cloud.types.ts" ]; then
    cp "$GENERATED_DIR/egs-cloud.types.ts" "$tmp_types"
    echo "warning: using existing generated snapshot from $GENERATED_DIR/egs-cloud.types.ts" >&2
  else
    echo "${last_error:-supabase gen types failed and no fallback snapshot is available}" >&2
    exit 1
  fi
fi

python3 - <<'PY' "$tmp_types" "$tmp_manifest" "$tmp_objects" "$PROJECT_REF"
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

types_path = Path(sys.argv[1])
manifest_path = Path(sys.argv[2])
objects_path = Path(sys.argv[3])
project_ref = sys.argv[4]
text = types_path.read_text(encoding="utf-8")
lines = text.splitlines()


def section_lines(name: str) -> list[str]:
    target = f"{name}: {{"
    start = None
    for index, line in enumerate(lines):
        if line.strip() == target:
            start = index + 1
            break
    if start is None:
        return []

    depth = 1
    collected: list[str] = []
    for line in lines[start:]:
        depth += line.count("{") - line.count("}")
        if depth == 0:
            break
        collected.append(line)
    return collected


def extract_blocks(section: list[str]) -> dict[str, list[str]]:
    blocks: dict[str, list[str]] = {}
    index = 0
    while index < len(section):
      line = section[index]
      match = re.match(r"^\s{6}([a-zA-Z0-9_]+): \{$", line)
      if not match:
          index += 1
          continue

      name = match.group(1)
      depth = line.count("{") - line.count("}")
      block = [line]
      index += 1

      while index < len(section):
          current = section[index]
          block.append(current)
          depth += current.count("{") - current.count("}")
          index += 1
          if depth == 0:
              break

      blocks[name] = block
    return blocks


field_pattern = re.compile(r"^([a-zA-Z0-9_]+)(\?)?: (.+)$")


def normalize_type(raw_type: str) -> dict[str, object]:
    type_expr = raw_type.rstrip(",")
    return {
        "type": type_expr,
        "nullable": " | null" in type_expr or type_expr.endswith("null"),
        "array": "[]" in type_expr,
    }


def parse_shape(block: list[str], shape_name: str) -> dict[str, dict[str, object]]:
    target = f"{shape_name}: {{"
    start = None
    for index, line in enumerate(block):
        if line.strip() == target:
            start = index + 1
            break
    if start is None:
        return {}

    depth = 1
    fields: dict[str, dict[str, object]] = {}
    for line in block[start:]:
        depth += line.count("{") - line.count("}")
        if depth == 0:
            break
        match = field_pattern.match(line.strip())
        if not match:
            continue
        name, optional, raw_type = match.groups()
        details = normalize_type(raw_type)
        details["optional"] = bool(optional)
        fields[name] = details
    return fields


def parse_relationships(block: list[str]) -> list[dict[str, object]]:
    relationships: list[dict[str, object]] = []
    start = None
    for index, line in enumerate(block):
        stripped = line.strip()
        if stripped == "Relationships: []":
            return relationships
        if stripped == "Relationships: [":
            start = index + 1
            break
    if start is None:
        return relationships

    current: dict[str, object] | None = None
    for line in block[start:]:
        stripped = line.strip().rstrip(",")
        if stripped == "]":
            break
        if stripped == "{":
            current = {}
            continue
        if stripped == "}":
            if current is not None:
                relationships.append(current)
            current = None
            continue
        if current is None:
            continue

        if stripped.startswith("foreignKeyName: "):
            current["foreign_key_name"] = stripped.split(": ", 1)[1].strip('"')
        elif stripped.startswith("columns: "):
            current["columns"] = json.loads(stripped.split(": ", 1)[1])
        elif stripped.startswith("isOneToOne: "):
            current["is_one_to_one"] = stripped.split(": ", 1)[1].lower() == "true"
        elif stripped.startswith("referencedRelation: "):
            current["referenced_relation"] = stripped.split(": ", 1)[1].strip('"')
        elif stripped.startswith("referencedColumns: "):
            current["referenced_columns"] = json.loads(stripped.split(": ", 1)[1])
    return relationships


def parse_objects(section_name: str) -> dict[str, dict[str, object]]:
    parsed: dict[str, dict[str, object]] = {}
    for name, block in extract_blocks(section_lines(section_name)).items():
        parsed[name] = {
            "row_columns": parse_shape(block, "Row"),
            "insert_columns": parse_shape(block, "Insert"),
            "update_columns": parse_shape(block, "Update"),
            "relationships": parse_relationships(block),
        }
    return parsed


def parse_names(section_name: str) -> list[str]:
    return sorted(extract_blocks(section_lines(section_name)).keys())


tables = parse_objects("Tables")
views = parse_objects("Views")
functions = parse_names("Functions")
enums = [name for name in parse_names("Enums") if name != "[_ in never]"]
composite_types = [name for name in parse_names("CompositeTypes") if name != "[_ in never]"]
manifest = {
    "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "project_ref": project_ref,
    "schema": "public",
    "source_types_file": str(types_path),
    "table_count": len(tables),
    "view_count": len(views),
    "function_count": len(functions),
    "enum_count": len(enums),
    "composite_type_count": len(composite_types),
    "tables": tables,
    "views": views,
    "functions": functions,
    "enums": enums,
    "composite_types": composite_types,
}

manifest_path.write_text(json.dumps(manifest, ensure_ascii=True, indent=2, sort_keys=True) + "\n", encoding="utf-8")

lines = []
for name in sorted(tables):
    lines.append(f"table:{name}")
for name in sorted(views):
    lines.append(f"view:{name}")
for name in sorted(functions):
    lines.append(f"function:{name}")
objects_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

print(f"project_ref={project_ref}")
print(f"table_count={len(tables)}")
print(f"view_count={len(views)}")
print(f"function_count={len(functions)}")
print(f"object_count={len(lines)}")
PY

mv "$tmp_types" "$GENERATED_DIR/egs-cloud.types.ts"
mv "$tmp_manifest" "$GENERATED_DIR/egs-cloud-schema.json"
mv "$tmp_objects" "$GENERATED_DIR/egs-cloud-objects.txt"

echo "types_file=$GENERATED_DIR/egs-cloud.types.ts"
echo "manifest_file=$GENERATED_DIR/egs-cloud-schema.json"
echo "objects_file=$GENERATED_DIR/egs-cloud-objects.txt"
