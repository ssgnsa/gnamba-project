#!/bin/bash
# ============================================
# Diagnostic Supabase Storage - Logos & Buckets
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Diagnostic Supabase Storage${NC}"
echo "============================================"

# Vérifier les variables d'environnement
echo -e "${YELLOW}📋 Variables d'environnement:${NC}"
echo "   SUPABASE_URL: ${VITE_SUPABASE_URL:-${SUPABASE_URL:-"Non défini"}}"
echo "   Mode: ${VITE_SUPABASE_MODE:-${SUPABASE_MODE:-"Non défini"}}"
echo ""

# Test connexion Supabase
echo -e "${YELLOW}🌐 Test connexion API Supabase...${NC}"
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        "${VITE_SUPABASE_URL:-${SUPABASE_URL}}/rest/v1/" 2>/dev/null || echo "000")
    echo "   Status HTTP: $HTTP_CODE"
    if [ "$HTTP_CODE" = "401" ]; then
        echo -e "   ${GREEN}✅ API accessible (401 = normal sans clé)${NC}"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "   ${RED}❌ API inaccessible${NC}"
    fi
fi
echo ""

# Vérifier les buckets via SQL (si Supabase local)
if command -v supabase &> /dev/null && supabase status &>/dev/null; then
    echo -e "${YELLOW}🗂️  Buckets Supabase (local):${NC}"
    docker exec supabase_db_gnamba-project psql -U postgres -d postgres -t -c "
        SELECT name, public FROM storage.buckets ORDER BY name;
    " 2>/dev/null || echo "   Impossible de lister les buckets"
    echo ""
    
    echo -e "${YELLOW}📁 Objets dans les buckets:${NC}"
    docker exec supabase_db_gnamba-project psql -U postgres -d postgres -t -c "
        SELECT b.name, COUNT(o.id) as objects
        FROM storage.buckets b
        LEFT JOIN storage.objects o ON b.id = o.bucket_id
        GROUP BY b.name;
    " 2>/dev/null || echo "   Impossible de lister les objets"
    echo ""
fi

# Vérifier les URLs des logos dans app_settings
echo -e "${YELLOW}🏷️  URLs de logo dans app_settings:${NC}"
if command -v supabase &> /dev/null && supabase status &>/dev/null; then
    docker exec supabase_db_gnamba-project psql -U postgres -d postgres -t -c "
        SELECT key, value 
        FROM public.app_settings 
        WHERE key LIKE '%logo%' OR key LIKE '%Logo%'
        ORDER BY key;
    " 2>/dev/null || echo "   Impossible de lire app_settings"
else
    echo "   Supabase local non démarré - utiliser l'API REST"
fi
echo ""

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🔧 Commandes de correction suggérées:${NC}"
echo ""
echo "1. Créer bucket manquant:"
echo "   supabase storage create bucket village-logos --public"
echo ""
echo "2. Upload logo test:"
echo "   supabase storage cp ./test-logo.png village-logos/"
echo ""
echo "3. Vérifier RLS policies:"
echo "   Dashboard Supabase → Storage → Policies"
echo ""
