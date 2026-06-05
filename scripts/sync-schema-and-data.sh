#!/bin/bash
# ============================================
# Sync Complet: Schéma (Migrations) + Données
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Sync Complet: Schéma + Données${NC}"
echo "============================================"

# Vérifier service role key
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Variable SUPABASE_SERVICE_ROLE_KEY non définie${NC}"
    echo "Récupérez-la sur: https://supabase.com/dashboard/project/thykrnoqgylrbfupophs/settings/api"
    exit 1
fi

CLOUD_URL="https://thykrnoqgylrbfupophs.supabase.co"
LOCAL_URL="http://localhost:54321"
SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
LOCAL_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo -e "${YELLOW}🗄️ Étape 1/3: Reset Supabase Local avec migrations...${NC}"
supabase stop 2>/dev/null || true
supabase start 2>&1 | tail -5
sleep 5

# Vérifier que les migrations sont appliquées
echo -e "${YELLOW}🔍 Vérification du schéma...${NC}"
TABLES_EXIST=$(docker exec supabase_db_gnamba-project psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='user_profiles';" 2>/dev/null | xargs)

if [ "$TABLES_EXIST" -eq 0 ]; then
    echo -e "${RED}❌ Tables non créées - Problème migrations${NC}"
    echo "Essayez: supabase db reset"
    exit 1
fi
echo -e "${GREEN}✅ Schéma OK${NC}"
echo ""

# Refresh schema cache
echo -e "${YELLOW}🔄 Refresh schema cache...${NC}"
docker restart supabase_rest_gnamba-project 2>/dev/null || true
sleep 3
echo ""

# Tables à synchroniser (ordre FK)
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

echo -e "${BLUE}📊 Étape 2/3: Synchronisation des données...${NC}"
echo "============================================"

# Fonction de sync avec insert direct SQL (évite RLS)
copy_table_sql() {
    local table=$1
    echo -e "${YELLOW}📥 Sync: $table${NC}"
    
    # Récupérer depuis Cloud
    local data
    data=$(curl -s -X GET \
        "${CLOUD_URL}/rest/v1/${table}?select=*" \
        -H "apikey: ${SERVICE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_KEY}" \
        -H "Accept: application/json")
    
    local count=$(echo "$data" | jq 'length')
    echo "   Records cloud: $count"
    
    if [ "$count" -eq 0 ]; then
        echo "   ⏭️ Skip (vide)"
        return 0
    fi
    
    # Truncate local
    docker exec supabase_db_gnamba-project psql -U postgres -d postgres -c "TRUNCATE TABLE public.${table} CASCADE;" 2>/dev/null || true
    
    # Convertir JSON en INSERT SQL
    local columns
    columns=$(echo "$data" | jq -r '.[0] | keys | @csv' | tr -d '"')
    
    echo "$data" | jq -c '.[]' | while read -r row; do
        # Construire VALUES
        local values
        values=$(echo "$row" | jq -r '[.[]] | @csv')
        
        # Insert via SQL direct (contourne RLS et REST)
        docker exec supabase_db_gnamba-project psql -U postgres -d postgres -c "
            INSERT INTO public.${table} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;
        " 2>/dev/null || true
    done
    
    # Vérifier
    local local_count
    local_count=$(docker exec supabase_db_gnamba-project psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM public.${table};" 2>/dev/null | xargs)
    echo -e "   ${GREEN}✅ OK ($local_count records)${NC}"
}

for table in "${TABLES[@]}"; do
    copy_table_sql "$table"
    echo ""
done

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✅ Sync terminé!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "📊 Résumé final:"
for table in "${TABLES[@]}"; do
    count=$(docker exec supabase_db_gnamba-project psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM public.${table};" 2>/dev/null | xargs || echo "?")
    echo "   $table: $count records"
done
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Redémarrer EGS: docker restart egs-web"
echo "   2. Tester l'authentification"
echo "   3. Vérifier les logos dans le Dashboard"
