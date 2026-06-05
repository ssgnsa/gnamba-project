#!/bin/bash
# ============================================
# Mode Offline Optimisé pour zones à faible connectivité
# Synchronisation différée Cloud → Local quand connexion disponible
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Mode Offline Optimisé${NC}"
echo "============================================"

# Vérifier si Supabase local est démarré
if ! supabase status &>/dev/null || ! docker ps | grep -q supabase_db; then
    echo -e "${YELLOW}⚠️  Supabase Local non démarré${NC}"
    echo "   Démarrage..."
    supabase start 2>&1 | tail -10
    sleep 10
fi

# Vérifier la connexion Cloud
echo -e "${YELLOW}🌐 Vérification connexion Cloud...${NC}"
CLOUD_URL="https://thykrnoqgylrbfupophs.supabase.co"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SERVICE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY non définie${NC}"
    exit 1
fi

# Test connexion
if curl -s "${CLOUD_URL}/rest/v1/user_profiles?select=count" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" 2>/dev/null | grep -q "count\|[0-9]"; then
    echo -e "${GREEN}✅ Cloud accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Cloud inaccessible - Mode offline pur activé${NC}"
    echo "   Les données seront synchronisées quand la connexion sera rétablie."
fi

echo ""
echo -e "${BLUE}📊 Configuration sync:${NC}"
echo "   - Tables essentielles: user_profiles, app_settings, foncier_*"
echo "   - Retry: 5 tentatives avec backoff exponentiel"
echo "   - Timeout: 30s par requête"
echo ""

# Script de sync robuste
cat << 'EOF'
📝 Utilisation:

# Quand la connexion est bonne (ex: bureau avec WiFi):
export SUPABASE_SERVICE_ROLE_KEY="votre_clé"
./scripts/sync-schema-and-data.sh

# Quand la connexion est faible (ex: sur le terrain):
# L'app utilise IndexedDB automatiquement
# Les données sont stockées localement
# Sync différé quand connexion rétablie

# Mode manuel pour forcer le sync:
supabase start  # Démarre local
./scripts/sync-via-api.sh  # Sync cloud → local
EOF
