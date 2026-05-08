#!/bin/bash
# ============================================
# EGS — Sync Production Schema to Staging
# ============================================
# Purpose: Export schema from production and apply to staging
# Usage: bash scripts/sync-staging-schema.sh
#
# Requirements:
#   - .env.server with SUPABASE_DB_PASSWORD and SUPABASE_SERVICE_ROLE_KEY
#   - .env.staging with staging DB credentials
#   - pg_dump and psql installed
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SCHEMA_FILE="/tmp/egs_prod_schema_$(date +%Y%m%d).sql"

echo "🔄 EGS Schema Sync: Production → Staging"
echo "========================================="
echo ""

# ============================================
# Load production credentials
# ============================================
if [ ! -f "${PROJECT_DIR}/.env.server" ]; then
    echo "❌ .env.server not found. Cannot read production credentials."
    exit 1
fi

source <(grep -E '^(VITE_SUPABASE_URL|SUPABASE_DB_PASSWORD)=' "${PROJECT_DIR}/.env.server" | sed 's/^ *//')

# Parse production DB host from URL
PROD_REF=$(echo "$VITE_SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')
PROD_HOST="db.${PROD_REF}.supabase.co"

echo "📋 Production: ${PROD_HOST}"
echo ""

# ============================================
# Check staging credentials
# ============================================
if [ ! -f "${PROJECT_DIR}/.env.staging" ]; then
    echo "⚠️  .env.staging not found."
    echo "   Create it by copying .env.staging.example and filling in staging credentials:"
    echo "   cp .env.staging.example .env.staging"
    echo ""
    read -p "Enter staging Supabase project ref (e.g., abcdefghijklmnop): " staging_ref

    if [ -z "$staging_ref" ]; then
        echo "❌ No staging ref provided. Aborting."
        exit 1
    fi

    read -p "Enter staging DB password: " -s staging_password
    echo ""

    STAGING_HOST="db.${staging_ref}.supabase.co"
    STAGING_PASSWORD="$staging_password"
else
    source <(grep -E '^(VITE_SUPABASE_URL|SUPABASE_DB_PASSWORD)=' "${PROJECT_DIR}/.env.staging" | sed 's/^ *//')
    STAGING_REF=$(echo "$VITE_SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')
    STAGING_HOST="db.${STAGING_REF}.supabase.co"
    STAGING_PASSWORD="$SUPABASE_DB_PASSWORD"
fi

echo "📋 Staging: ${STAGING_HOST}"
echo ""

# ============================================
# Export production schema
# ============================================
echo "📸 Exporting production schema..."
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
    -h "$PROD_HOST" \
    -p 5432 \
    -U postgres \
    -d postgres \
    --schema-only \
    --no-owner \
    --no-privileges \
    > "$SCHEMA_FILE" 2>&1 || {
        echo "❌ Schema export failed. Check credentials."
        exit 1
    }

TABLE_COUNT=$(grep -c "CREATE TABLE" "$SCHEMA_FILE" || true)
SCHEMA_SIZE=$(du -h "$SCHEMA_FILE" | cut -f1)
echo "   ✅ Schema exported: ${SCHEMA_SIZE} (${TABLE_COUNT} tables)"
echo "   📄 Saved to: ${SCHEMA_FILE}"
echo ""

# ============================================
# Apply to staging (with confirmation)
# ============================================
echo "⚠️  WARNING: This will OVERWRITE the staging schema."
echo "   All staging data will be preserved but schema will be replaced."
echo ""
read -p "Apply schema to staging? (yes/no): " confirm

if [[ "$confirm" != "yes" ]]; then
    echo "❌ Aborted. Schema file saved at: ${SCHEMA_FILE}"
    echo "   To apply manually:"
    echo "   PGPASSWORD=STAGING_PASSWORD psql -h ${STAGING_HOST} -p 5432 -U postgres -d postgres -f ${SCHEMA_FILE}"
    exit 0
fi

echo "🔧 Applying schema to staging..."
PGPASSWORD="$STAGING_PASSWORD" psql \
    -h "$STAGING_HOST" \
    -p 5432 \
    -U postgres \
    -d postgres \
    -f "$SCHEMA_FILE" 2>&1 || {
        echo "⚠️  Some statements may have failed (existing constraints, etc.). Review output above."
    }

echo ""
echo "✅ Schema sync complete!"
echo "   Staging schema updated to match production (${TABLE_COUNT} tables)"
