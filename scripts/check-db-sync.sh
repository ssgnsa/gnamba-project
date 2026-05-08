#!/usr/bin/env bash
# ============================================================================
# check-db-sync.sh — Vérifie la cohérence entre le code React et la base DB
# Usage: bash scripts/check-db-sync.sh [--local|--cloud]
# ============================================================================
set -euo pipefail

MODE="${1:---local}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "============================================"
echo "  🔍 EGS DB Sync Check — Mode: $MODE"
echo "============================================"

# ------------------------------------------------------------------
# 1. Extract all table names referenced in the React code
# ------------------------------------------------------------------
echo ""
echo "📋 Tables référencées dans le code React..."
CODE_TABLES=$(grep -rhoP "\.from\('([a-z_]+)'\)" src/ \
  | sed "s/\.from('//;s/')//" \
  | sort -u)

echo "$CODE_TABLES" | while read -r tbl; do
  echo "  → $tbl"
done

# ------------------------------------------------------------------
# 2. Check against actual database tables
# ------------------------------------------------------------------
echo ""
echo "🗄️  Vérification dans la base de données..."

if [ "$MODE" = "--local" ]; then
  DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
elif [ "$MODE" = "--cloud" ]; then
  # Read from .env
  source .env 2>/dev/null || true
  if [ -n "${SUPABASE_DB_PASSWORD:-}" ]; then
    DB_URL="postgresql://postgres.${SUPABASE_DB_PASSWORD}@db.${VITE_SUPABASE_URL#https://}.supabase.co:5432/postgres"
  else
    echo -e "${YELLOW}⚠️  SUPABASE_DB_PASSWORD non défini dans .env — vérification locale uniquement${NC}"
    DB_URL=""
  fi
fi

if [ -n "$DB_URL" ]; then
  # Get actual tables from DB
  DB_TABLES=$(psql "$DB_URL" -t -A -c "
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  ")

  echo ""
  MISSING=0
  echo "$CODE_TABLES" | while read -r tbl; do
    if echo "$DB_TABLES" | grep -q "^${tbl}$"; then
      echo -e "  ${GREEN}✅${NC} $tbl"
    else
      echo -e "  ${RED}❌${NC} $tbl — **MANQUANTE**"
      MISSING=$((MISSING + 1))
    fi
  done

  # Check for tables in DB but not in code (orphans)
  echo ""
  echo "📦 Tables en DB non référencées dans le code (peut être normal)..."
  echo "$DB_TABLES" | while read -r tbl; do
    if ! echo "$CODE_TABLES" | grep -q "^${tbl}$"; then
      echo -e "  ${YELLOW}⚠️${NC} $tbl (orphan potentiel)"
    fi
  done
else
  echo -e "${YELLOW}⚠️  Impossible de se connecter à la DB. Vérification code uniquement.${NC}"
fi

# ------------------------------------------------------------------
# 3. Check for .tenants references (should all be .locataires)
# ------------------------------------------------------------------
echo ""
echo "🔎 Vérification des références .tenants (devraient être .locataires)..."
TENANT_REFS=$(grep -rn "\.tenants" src/pages/immobilier/ src/lib/immobilier.ts 2>/dev/null || true)
if [ -n "$TENANT_REFS" ]; then
  echo -e "${RED}❌ Références .tenants trouvées:${NC}"
  echo "$TENANT_REFS"
else
  echo -e "${GREEN}✅ Aucune référence .tenants — tout utilise .locataires${NC}"
fi

echo ""
echo "============================================"
echo "  ✅ Vérification terminée"
echo "============================================"
