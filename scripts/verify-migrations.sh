#!/usr/bin/env bash
# ============================================================================
# verify-migrations.sh — Vérifie l'état des migrations Supabase
# Usage: bash scripts/verify-migrations.sh [--local|--linked]
# ============================================================================
set -euo pipefail

MODE="${1:---local}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "============================================"
echo "  📦 EGS Migration Verification"
echo "============================================"

# ------------------------------------------------------------------
# 1. List local migration files
# ------------------------------------------------------------------
echo ""
echo "📁 Fichiers de migration locaux :"
echo ""

MIGRATION_DIR="supabase/migrations"
if [ ! -d "$MIGRATION_DIR" ]; then
  echo -e "${RED}❌ Dossier $MIGRATION_DIR introuvable${NC}"
  exit 1
fi

COUNT=0
PREV_TS=0
HAS_DUPLICATES=0

for f in $(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort); do
  COUNT=$((COUNT + 1))
  BASENAME=$(basename "$f")
  TS=$(echo "$BASENAME" | grep -oP '^\d+' || echo "0")

  # Check for duplicate timestamps
  if [ "$TS" = "$PREV_TS" ]; then
    echo -e "  ${RED}❌ DUPLICATE TIMESTAMP${NC} ($TS): $BASENAME"
    HAS_DUPLICATES=1
  elif [ "$TS" -lt "$PREV_TS" ] 2>/dev/null; then
    echo -e "  ${YELLOW}⚠️  ORDRE CHRONOLOGIQUE${NC}: $BASENAME (ts=$TS < prev=$PREV_TS)"
  else
    echo -e "  ${GREEN}✅${NC} $BASENAME"
  fi
  PREV_TS=$TS
done

echo ""
echo "Total: $COUNT migrations"

if [ "$HAS_DUPLICATES" -eq 1 ]; then
  echo -e "${RED}❌ Des timestamps dupliqués ont été détectés !${NC}"
  echo "   → Renommez les fichiers pour garantir l'unicité des timestamps."
else
  echo -e "${GREEN}✅ Aucun timestamp dupliqué${NC}"
fi

# ------------------------------------------------------------------
# 2. Check migration status via Supabase CLI
# ------------------------------------------------------------------
echo ""
echo "📊 État des migrations via Supabase CLI..."

if command -v supabase &> /dev/null; then
  if [ "$MODE" = "--local" ]; then
    echo ""
    echo "Migrations locales :"
    supabase migration list --local 2>/dev/null || echo -e "${YELLOW}⚠️  Supabase local non démarré${NC}"
  elif [ "$MODE" = "--linked" ]; then
    echo ""
    echo "Migrations liées (base distante) :"
    supabase migration list --linked 2>/dev/null || echo -e "${YELLOW}⚠️  Base non liée ou inaccessible${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Supabase CLI non installé${NC}"
fi

# ------------------------------------------------------------------
# 3. Verify RLS policies exist for key tables
# ------------------------------------------------------------------
echo ""
echo "🔐 Vérification des politiques RLS (si DB accessible)..."

DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
if psql "$DB_URL" -c "SELECT 1" &>/dev/null 2>&1; then
  KEY_TABLES=("properties" "locataires" "lease_contracts" "rent_payments" "finances")
  for tbl in "${KEY_TABLES[@]}"; do
    POLICY_COUNT=$(psql "$DB_URL" -t -A -c "
      SELECT count(*) FROM pg_policies
      WHERE schemaname = 'public' AND tablename = '$tbl';
    " 2>/dev/null || echo "0")

    RLS_ENABLED=$(psql "$DB_URL" -t -A -c "
      SELECT relrowsecurity FROM pg_class WHERE relname = '$tbl';
    " 2>/dev/null || echo "false")

    if [ "$RLS_ENABLED" = "t" ]; then
      if [ "$POLICY_COUNT" -gt 0 ]; then
        echo -e "  ${GREEN}✅${NC} $tbl — RLS activé ($POLICY_COUNT policies)"
      else
        echo -e "  ${YELLOW}⚠️${NC} $tbl — RLS activé mais **aucune policy** !"
      fi
    else
      echo -e "  ${RED}❌${NC} $tbl — RLS **non activé** !"
    fi
  done
else
  echo -e "${YELLOW}⚠️  Base locale inaccessible — démarrez Supabase local avec 'supabase start'${NC}"
fi

echo ""
echo "============================================"
echo "  ✅ Vérification terminée"
echo "============================================"
