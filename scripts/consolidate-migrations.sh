#!/bin/bash
# ============================================
# EGS — Consolidate Duplicate Migrations
# ============================================
# Purpose: Create a schema snapshot and archive old duplicate migrations
# WARNING: This script should ONLY be run on a TEST/STAGING environment first
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="${PROJECT_DIR}/supabase/migrations"
TODAY=$(date +%Y%m%d)

echo "⚠️  ATTENTION: Migration consolidation"
echo "   This script archives old migrations and creates a schema snapshot."
echo "   It should ONLY be run after verifying the live schema is correct."
echo ""
read -p "Continue? (yes/no): " confirm

if [[ "$confirm" != "yes" ]]; then
    echo "❌ Aborted."
    exit 1
fi

# ============================================
# 1. Archive old migrations (202603* and 2026040*)
# ============================================
ARCHIVE_DIR="${MIGRATIONS_DIR}/archived_${TODAY}"
mkdir -p "$ARCHIVE_DIR"

echo "📦 Archiving old migrations to: ${ARCHIVE_DIR}"

# Move old migrations (everything before the new 20260409* series)
count=0
for f in "${MIGRATIONS_DIR}"/202603*.sql "${MIGRATIONS_DIR}"/2026040[0-8]*.sql; do
    if [ -f "$f" ]; then
        mv "$f" "$ARCHIVE_DIR/"
        count=$((count + 1))
    fi
done

echo "   Archived ${count} migration files"

# ============================================
# 2. List remaining (active) migrations
# ============================================
echo ""
echo "📋 Active migrations remaining:"
ls -1 "${MIGRATIONS_DIR}"/*.sql 2>/dev/null | while read -r f; do
    echo "   $(basename "$f")"
done

echo ""
echo "✅ Consolidation complete."
echo "   Archived migrations: ${ARCHIVE_DIR}"
echo ""
echo "⚠️  NEXT STEPS:"
echo "   1. Verify the live schema is correct (supabase db remote commit)"
echo "   2. If needed, create a baseline migration from the current schema:"
echo "      pg_dump -h db.thykrnoqgylrbfupophs.supabase.co -U postgres -d postgres --schema-only --no-owner > supabase/migrations/20260409000000_baseline.sql"
echo "   3. Update MIGRATIONS.md to reflect the new structure"
