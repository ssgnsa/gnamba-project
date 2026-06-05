#!/bin/bash
# ============================================
# Sync Cloud → Local via API REST (Option B)
# Alternative quand pg_dump est inaccessible (IPv6/ports bloqués)
# Synchronise les tables essentielles via Supabase REST API
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Sync via API REST: Cloud → Local${NC}"
echo "============================================"

# Variables
CLOUD_URL="https://thykrnoqgylrbfupophs.supabase.co"
LOCAL_URL="http://localhost:54321"
ANON_KEY="sb_publishable_K2AvUraEL_URgy91DbLcyQ_wDPtmWuu"
LOCAL_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Tables à synchroniser (ordre important pour FK)
TABLES=(
    "user_profiles"
    "app_settings"
    "media_files"
    "foncier_villages"
    "foncier_lots"
    "foncier_attestations"
    "foncier_attestation_temoins"
    "site_content"
    "page_layouts"
)

# Démarrer Supabase local si pas déjà running
echo -e "${YELLOW}🚀 Démarrage Supabase Local...${NC}"
if ! supabase status &>/dev/null; then
    supabase start
    sleep 5
fi

echo -e "${GREEN}✅ Supabase Local prêt${NC}"
echo ""

# Fonction pour copier une table
copy_table() {
    local table=$1
    echo -e "${YELLOW}📥 Sync table: $table${NC}"
    
    # 1. Récupérer depuis Cloud
    local cloud_data
    cloud_data=$(curl -s -X GET \
        "${CLOUD_URL}/rest/v1/${table}?select=*" \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" \
        -H "Accept: application/json" 2>/dev/null || echo "[]")
    
    # Vérifier si c'est un array JSON
    if ! echo "$cloud_data" | jq -e 'type == "array"' >/dev/null 2>&1; then
        echo -e "   ${RED}❌ Erreur récupération $table${NC}"
        return 1
    fi
    
    local count=$(echo "$cloud_data" | jq 'length')
    echo "   Records cloud: $count"
    
    if [ "$count" -eq 0 ]; then
        echo -e "   ${YELLOW}⚠️  Table vide, skip${NC}"
        return 0
    fi
    
    # 2. Truncate local
    docker exec supabase_db_gnamba-project psql -U postgres -d postgres -c "TRUNCATE TABLE public.${table} CASCADE;" 2>/dev/null || true
    
    # 3. Insérer en local par batch
    echo "$cloud_data" | jq -c '.[]' | while read -r row; do
        curl -s -X POST \
            "${LOCAL_URL}/rest/v1/${table}" \
            -H "apikey: ${LOCAL_KEY}" \
            -H "Authorization: Bearer ${LOCAL_KEY}" \
            -H "Content-Type: application/json" \
            -H "Prefer: return=minimal" \
            -d "$row" 2>/dev/null || true
    done
    
    echo -e "   ${GREEN}✅ $table synchronisée${NC}"
}

# Vérifier jq
echo -e "${YELLOW}🔧 Vérification outils...${NC}"
if ! command -v jq &>/dev/null; then
    echo -e "${YELLOW}📦 Installation de jq...${NC}"
    sudo apt-get update && sudo apt-get install -y jq
fi
echo -e "${GREEN}✅ jq installé${NC}"
echo ""

# Test connexion Cloud
echo -e "${YELLOW}🌐 Test connexion Cloud...${NC}"
if curl -s "${CLOUD_URL}/rest/v1/user_profiles?select=count" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" 2>/dev/null | grep -q "count"; then
    echo -e "${GREEN}✅ Cloud accessible${NC}"
else
    echo -e "${RED}❌ Cloud inaccessible. Vérifiez la clé ANON.${NC}"
    exit 1
fi
echo ""

# Sync tables
echo -e "${BLUE}📊 Synchronisation des tables...${NC}"
echo "============================================"

SUCCESS=0
FAILED=0

for table in "${TABLES[@]}"; do
    if copy_table "$table"; then
        ((SUCCESS++))
    else
        ((FAILED++))
    fi
    echo ""
done

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✅ Sync terminé!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "📊 Statistiques:"
echo "   Tables OK: $SUCCESS"
echo "   Tables KO: $FAILED"
echo ""
echo "📝 Note: Les blobs Storage ne sont pas synchronisés."
echo "   Pour les logos, re-uploadez-les manuellement ou"
echo "   utilisez 'supabase storage cp' si la CLI est configurée."
echo ""

# Résumé final
echo "Tables synchronisées:"
for table in "${TABLES[@]}"; do
    local_count=$(docker exec supabase_db_gnamba-project psql -U postgres -d postgres -t -c "SELECT count(*) FROM public.${table};" 2>/dev/null | xargs || echo "?")
    echo "   - $table: $local_count records"
done
