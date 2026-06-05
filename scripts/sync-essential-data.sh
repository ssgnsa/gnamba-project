#!/bin/bash
# ============================================
# Sync Intelligent: Tables Essentielles Uniquement
# Optimisé pour zones à faible connectivité
# Synchronise: users, config, référentiels terrain
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
CLOUD_URL="https://thykrnoqgylrbfupophs.supabase.co"
LOCAL_URL="http://localhost:54321"
LOCAL_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Tables essentielles (ordre: sans dépendances FK d'abord)
ESSENTIAL_TABLES=(
    "user_profiles:Identifiants de connexion"
    "app_settings:Configuration application"
    "foncier_villages:Référentiel villages"
)

# Retry configuration
MAX_RETRIES=3
RETRY_DELAY=5

show_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     🔄 Sync Intelligent - Tables Essentielles          ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_prerequisites() {
    echo -e "${YELLOW}📋 Vérification des prérequis...${NC}"
    
    # Vérifier service role key
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo -e "${RED}❌ Variable SUPABASE_SERVICE_ROLE_KEY manquante${NC}"
        echo ""
        echo "   Obtenez-la sur:"
        echo "   https://supabase.com/dashboard/project/thykrnoqgylrbfupophs/settings/api"
        echo ""
        echo "   Puis exportez:"
        echo "   export SUPABASE_SERVICE_ROLE_KEY='votre_clé_ici'"
        exit 1
    fi
    
    # Vérifier Supabase local
    if ! supabase status &>/dev/null; then
        echo -e "${YELLOW}⚠️  Supabase Local non démarré${NC}"
        echo "   Démarrage..."
        supabase start 2>&1 | tail -5
        sleep 8
    fi
    
    # Vérifier jq
    if ! command -v jq &>/dev/null; then
        echo -e "${YELLOW}📦 Installation de jq...${NC}"
        sudo apt-get update -qq && sudo apt-get install -y -qq jq
    fi
    
    echo -e "${GREEN}✅ Prérequis OK${NC}"
    echo ""
}

test_cloud_connection() {
    echo -e "${YELLOW}🌐 Test connexion Cloud...${NC}"
    
    local attempt=1
    while [ $attempt -le $MAX_RETRIES ]; do
        if curl -s --max-time 10 "${CLOUD_URL}/rest/v1/user_profiles?select=count" \
            -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" 2>/dev/null | grep -q "count\|[0-9]"; then
            echo -e "${GREEN}✅ Cloud accessible (tentative $attempt)${NC}"
            return 0
        fi
        
        echo -e "   ${YELLOW}Tentative $attempt/$MAX_RETRIES échouée, retry dans ${RETRY_DELAY}s...${NC}"
        sleep $RETRY_DELAY
        ((attempt++))
    done
    
    echo -e "${RED}❌ Cloud inaccessible après $MAX_RETRIES tentatives${NC}"
    echo ""
    echo "   Solutions:"
    echo "   1. Vérifiez votre connexion internet"
    echo "   2. Vérifiez que SUPABASE_SERVICE_ROLE_KEY est valide"
    echo "   3. Réessayez plus tard"
    exit 1
}

# Fonction pour synchroniser une table via SQL direct (évite REST/schema cache)
sync_table_sql() {
    local table=$1
    local description=$2
    
    echo -e "${CYAN}📥 Sync: ${table}${NC}"
    echo "   ${description}"
    
    # 1. Récupérer données Cloud via API
    local cloud_data
    cloud_data=$(curl -s --max-time 30 "${CLOUD_URL}/rest/v1/${table}?select=*" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Accept: application/json" 2>/dev/null)
    
    # Vérifier réponse valide
    if [ -z "$cloud_data" ] || ! echo "$cloud_data" | jq -e 'type == "array"' >/dev/null 2>&1; then
        echo -e "   ${RED}❌ Échec récupération données${NC}"
        return 1
    fi
    
    local cloud_count=$(echo "$cloud_data" | jq 'length')
    echo "   Records Cloud: $cloud_count"
    
    if [ "$cloud_count" -eq 0 ]; then
        echo -e "   ${YELLOW}⏭️  Table vide, skip${NC}"
        return 0
    fi
    
    # 2. Truncate table locale (SQL direct)
    docker exec supabase_db_gnamba-project psql -U postgres -d postgres \
        -c "TRUNCATE TABLE public.${table} CASCADE;" 2>/dev/null || true
    
    # 3. Insérer données (JSON → SQL)
    local inserted=0
    local failed=0
    
    echo "$cloud_data" | jq -c '.[]' | while IFS= read -r row; do
        # Construire INSERT SQL
        local columns=$(echo "$row" | jq -r 'keys | @csv' | tr -d '"')
        local values=$(echo "$row" | jq -r '[.[]] | @csv')
        
        # Exécuter INSERT
        if docker exec supabase_db_gnamba-project psql -U postgres -d postgres \
            -c "INSERT INTO public.${table} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;" 2>/dev/null; then
            ((inserted++))
        else
            ((failed++))
        fi
    done
    
    # 4. Vérifier compte local
    local local_count
    local_count=$(docker exec supabase_db_gnamba-project psql -U postgres -d postgres \
        -t -c "SELECT COUNT(*) FROM public.${table};" 2>/dev/null | xargs || echo "0")
    
    # Vérifier résultat (gérer valeurs vides)
    local_count=${local_count:-0}
    cloud_count=${cloud_count:-0}
    
    if [ "$local_count" -eq "$cloud_count" ] && [ "$local_count" -gt 0 ]; then
        echo -e "   ${GREEN}✅ Sync OK ($local_count/$cloud_count)${NC}"
        return 0
    else
        echo -e "   ${YELLOW}⚠️  Partiel ($local_count/$cloud_count)${NC}"
        return 1
    fi
}

show_summary() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              📊 Résumé Synchronisation                 ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${CYAN}Tables synchronisées:${NC}"
    for item in "${ESSENTIAL_TABLES[@]}"; do
        IFS=':' read -r table desc <<< "$item"
        count=$(docker exec supabase_db_gnamba-project psql -U postgres -d postgres \
            -t -c "SELECT COUNT(*) FROM public.${table};" 2>/dev/null | xargs || echo "?")
        printf "   %-20s : %s records\n" "$table" "$count"
    done
    
    echo ""
    echo -e "${GREEN}✅ Données essentielles disponibles en local${NC}"
    echo ""
    echo -e "${YELLOW}💡 Prochaines étapes:${NC}"
    echo "   1. Redémarrer EGS: docker restart egs-web"
    echo "   2. Tester authentification sur http://localhost:8080"
    echo "   3. Vérifier mode offline dans les zones sans connexion"
    echo ""
    echo -e "${CYAN}📝 Mode d'emploi terrain:${NC}"
    echo "   • Au bureau (WiFi): Lancez ce script pour mettre à jour"
    echo "   • Sur le terrain (2G/3G/Offline): L'app utilise IndexedDB"
    echo "   • Retour bureau: Les données saisies sync automatiquement"
    echo ""
}

# Main
show_header
check_prerequisites
test_cloud_connection

echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Début synchronisation...${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""

SUCCESS=0
FAILED=0

for item in "${ESSENTIAL_TABLES[@]}"; do
    IFS=':' read -r table desc <<< "$item"
    if sync_table_sql "$table" "$desc"; then
        ((SUCCESS++))
    else
        ((FAILED++))
    fi
    echo ""
done

echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}✅ Synchronisation terminée${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $FAILED table(s) partiellement synchronisée(s)${NC}"
    echo "   Les données existantes peuvent être utilisées."
    echo ""
fi

show_summary
