#!/bin/bash
# ============================================
# Sync Cloud → Local via API (Service Role)
# Nécessite SUPABASE_SERVICE_ROLE_KEY
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Sync Service Role: Cloud → Local${NC}"
echo "============================================"

# Vérifier service role key
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Variable SUPABASE_SERVICE_ROLE_KEY non définie${NC}"
    echo ""
    echo "Récupérez-la sur: https://supabase.com/dashboard/project/thykrnoqgylrbfupophs/settings/api"
    echo "→ Section: Project API keys → service_role (secret)"
    echo ""
    echo "Puis lancez:"
    echo "  export SUPABASE_SERVICE_ROLE_KEY='votre_clé_service_role'"
    echo "  ./scripts/sync-with-service-role.sh"
    exit 1
fi

CLOUD_URL="https://thykrnoqgylrbfupophs.supabase.co"
LOCAL_URL="http://localhost:54321"
SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
LOCAL_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Démarrer Supabase local
echo -e "${YELLOW}🚀 Démarrage Supabase Local...${NC}"
if ! supabase status &>/dev/null; then
    supabase start
    sleep 5
fi
echo -e "${GREEN}✅ Supabase Local prêt${NC}"
echo ""

# Tables essentielles (ordre FK)
TABLES=(
    "user_profiles"
    "app_settings"
    "media_files"
    "foncier_villages"
    "foncier_lots"
    "foncier_attestations"
    "site_content"
    "page_layouts"
)

# Fonction de sync
copy_table() {
    local table=$1
    echo -e "${YELLOW}📥 Sync: $table${NC}"
    
    # Récupérer avec service_role (contourne RLS)
    local data
    data=$(curl -s -X GET \
        "${CLOUD_URL}/rest/v1/${table}?select=*" \
        -H "apikey: ${SERVICE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_KEY}" \
        -H "Accept: application/json")
    
    local count=$(echo "$data" | jq 'length')
    echo "   Records: $count"
    
    if [ "$count" -eq 0 ]; then
        return 0
    fi
    
    # Truncate local
    docker exec supabase_db_gnamba-project psql -U postgres -d postgres -c "TRUNCATE TABLE public.${table} CASCADE;" 2>/dev/null || true
    
    # Insérer en local
    echo "$data" | jq -c '.[]' | while read -r row; do
        curl -s -X POST "${LOCAL_URL}/rest/v1/${table}" \
            -H "apikey: ${LOCAL_KEY}" \
            -H "Authorization: Bearer ${LOCAL_KEY}" \
            -H "Content-Type: application/json" \
            -H "Prefer: return=minimal,resolution=ignore-duplicates" \
            -d "$row" 2>/dev/null || true
    done
    
    echo -e "   ${GREEN}✅ OK${NC}"
}

echo -e "${YELLOW}🔧 Test connexion Cloud (service role)...${NC}"
if curl -s "${CLOUD_URL}/rest/v1/user_profiles?select=count" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" 2>/dev/null | grep -q "count\|[0-9]"; then
    echo -e "${GREEN}✅ Cloud accessible avec service_role${NC}"
else
    echo -e "${RED}❌ Clé service_role invalide${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}📊 Synchronisation...${NC}"
echo "============================================"

for table in "${TABLES[@]}"; do
    copy_table "$table"
    echo ""
done

echo -e "${GREEN}✅ Sync terminé!${NC}"
echo ""
echo "📊 Résumé tables locales:"
for table in "${TABLES[@]}"; do
    count=$(docker exec supabase_db_gnamba-project psql -U postgres -d postgres -t -c "SELECT count(*) FROM public.${table};" 2>/dev/null | xargs || echo "?")
    echo "   $table: $count"
done
