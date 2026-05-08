#!/usr/bin/env bash
# ============================================================================
# generate-types.sh — Génère les types TypeScript depuis la DB Supabase
# Usage: bash scripts/generate-types.sh [--local|--cloud]
# ============================================================================
set -euo pipefail

MODE="${1:---local}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

OUTPUT_FILE="src/types/database.ts"

echo "============================================"
echo "  🏗️  Génération des types TypeScript"
echo "============================================"

if ! command -v supabase &> /dev/null; then
  echo -e "${RED}❌ Supabase CLI non installé${NC}"
  echo "   Installation : brew install supabase/tap/supabase"
  echo "   ou : npm install -g supabase"
  exit 1
fi

if [ "$MODE" = "--local" ]; then
  echo ""
  echo "📡 Connexion à Supabase local..."

  # Check if Supabase is running
  if ! pg_isready -h localhost -p 54322 &>/dev/null; then
    echo -e "${YELLOW}⚠️  Supabase local ne semble pas démarré${NC}"
    echo "   Exécutez : supabase start"
    exit 1
  fi

  echo "🔨 Génération des types..."
  supabase gen types typescript --local --schema public > "$OUTPUT_FILE" 2>/dev/null || {
    echo -e "${RED}❌ Échec de la génération${NC}"
    echo "   Vérifiez que les migrations sont appliquées : supabase db push"
    exit 1
  }

elif [ "$MODE" = "--cloud" ]; then
  echo ""
  echo "☁️  Connexion à Supabase Cloud..."

  # Try to get DB password from environment or prompt
  source .env.server 2>/dev/null || true

  if [ -z "${POSTGRES_PASSWORD:-}" ]; then
    echo -e "${YELLOW}⚠️  POSTGRES_PASSWORD non défini dans .env.server${NC}"
    echo ""
    echo "Options :"
    echo "  1. Ajouter POSTGRES_PASSWORD=xxx dans .env.server"
    echo "  2. Entrer le mot de passe manuellement (il ne s'affichera pas) :"
    read -s -p "   > " POSTGRES_PASSWORD
    echo ""
  fi

  # Extract Supabase ref from URL
  source .env 2>/dev/null || true
  SUPABASE_REF="${VITE_SUPABASE_URL#https://}"
  SUPABASE_REF="${SUPABASE_REF%%.*}"

  DB_URL="postgresql://postgres.${POSTGRES_PASSWORD}@db.${SUPABASE_REF}.supabase.co:5432/postgres"

  echo "🔨 Génération des types depuis $SUPABASE_REF..."
  supabase gen types typescript \
    --db-url "$DB_URL" \
    --schema public \
    > "$OUTPUT_FILE" 2>/dev/null || {
    echo -e "${RED}❌ Échec de la génération${NC}"
    echo ""
    echo "Causes possibles :"
    echo "  - Mot de passe incorrect"
    echo "  - Firewall bloquant le port 5432"
    echo "  - Problème de connexion réseau"
    echo ""
    echo "Alternative : via Supabase Dashboard → Settings → API → Database URL"
    echo "Puis utilisez : supabase gen types typescript --db-url <url> --schema public"
    exit 1
  }
fi

echo ""
echo -e "${GREEN}✅ Types générés dans $OUTPUT_FILE${NC}"
echo ""
echo "📊 Statistiques :"
echo "  Interfaces: $(grep -c '^export interface' "$OUTPUT_FILE")"
echo "  Types: $(grep -c '^export type' "$OUTPUT_FILE")"
echo "  Lignes: $(wc -l < "$OUTPUT_FILE")"
echo ""
echo "⚠️  Prochaines étapes :"
echo "  1. Comparez avec src/types/index.ts pour identifier les divergences"
echo "  2. Remplacez progressivement les interfaces manuelles"
echo "  3. Lancez : npm run typecheck pour vérifier"
