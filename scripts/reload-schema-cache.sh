#!/usr/bin/env bash
# ============================================================================
# reload-schema-cache.sh — Force le rechargement du schema cache PostgREST
# Usage: bash scripts/reload-schema-cache.sh [--local|--cloud]
#
# Conformément à la doc PostgREST :
# https://postgrest.org/en/stable/references/schema_cache.html
# ============================================================================
set -euo pipefail

MODE="${1:---local}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "============================================"
echo "  🔄 Reload Schema Cache PostgREST"
echo "============================================"

if [ "$MODE" = "--local" ]; then
  DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
  echo "📡 Connexion à Supabase local..."
elif [ "$MODE" = "--cloud" ]; then
  echo ""
  echo "⚠️  Pour Supabase Cloud, deux options :"
  echo ""
  echo "  Option 1 : Via Supabase Dashboard"
  echo "    1. Allez sur https://supabase.com/dashboard"
  echo "    2. Sélectionnez votre projet"
  echo "    3. SQL Editor → exécutez : NOTIFY pgrst, 'reload schema';"
  echo ""
  echo "  Option 2 : Avec le mot de passe PostgreSQL"
  echo "    Renseignez POSTGRES_PASSWORD dans .env.server"
  echo "    puis relancez : $0 --cloud"
  echo ""
  echo "  Option 3 : Via Supabase CLI (si lié)"
  echo "    supabase db execute --db-url <url> -c \"NOTIFY pgrst, 'reload schema';\""
  exit 0
fi

# Execute NOTIFY pgrst, 'reload schema'
echo ""
echo "🔨 Envoi de la notification de reload..."

psql "$DB_URL" -c "NOTIFY pgrst, 'reload schema';" 2>/dev/null && {
  echo ""
  echo -e "${GREEN}✅ Notification envoyée avec succès${NC}"
  echo ""
  echo "ℹ️  Le cache devrait se recharger automatiquement."
  echo "   Si le problème persiste, redémarrez le service API :"
  echo ""
  if [ "$MODE" = "--local" ]; then
    echo "   supabase stop && supabase start"
  else
    echo "   Via le dashboard Supabase : Settings → API → Restart"
  fi
} || {
  echo -e "${RED}❌ Échec de la notification${NC}"
  echo "   Vérifiez la connexion à la base de données."
  exit 1
}

echo ""
echo "============================================"
echo "  ✅ Terminé"
echo "============================================"
