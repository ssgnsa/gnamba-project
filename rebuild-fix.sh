#!/bin/bash
# ============================================
# Rebuild avec la CLÉ API CORRECTE
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🔧 REBUILD AVEC CLÉ API CORRECTE                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Charger les variables d'environnement
export $(grep -v '^#' /home/soma/gnamba-project/.env | xargs)

echo -e "${YELLOW}Vérification des variables:${NC}"
echo "  VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:50}..."
echo "  VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:20}..."
echo "  VITE_SUPABASE_MODE: $VITE_SUPABASE_MODE"
echo ""

# Vérifier que la clé est au format JWT
if [[ ! "$VITE_SUPABASE_ANON_KEY" =~ ^eyJ ]]; then
    echo -e "${RED}❌ ERREUR: La clé n'est pas au format JWT (doit commencer par 'eyJ')${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Clé API au format JWT valide${NC}"
echo ""

# ============================================
# 1. Arrêter et supprimer l'ancien conteneur
# ============================================
echo -e "${BLUE}[1/4] Arrêt du conteneur existant...${NC}"
docker stop egs-web 2>/dev/null || true
docker rm egs-web 2>/dev/null || true
echo -e "${GREEN}✅ Conteneur arrêté${NC}"
echo ""

# ============================================
# 2. Build avec les bonnes variables
# ============================================
echo -e "${BLUE}[2/4] Build Docker avec les variables correctes...${NC}"
cd /home/soma/gnamba-project

docker build \
  --build-arg VITE_SUPABASE_MODE="$VITE_SUPABASE_MODE" \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  -t egs-web:fixed \
  -f Dockerfile .

echo -e "${GREEN}✅ Build terminé${NC}"
echo ""

# ============================================
# 3. Démarrer le nouveau conteneur
# ============================================
echo -e "${BLUE}[3/4] Démarrage du conteneur...${NC}"
docker run -d \
  --name egs-web \
  --network gnamba-network \
  --restart unless-stopped \
  -p 8080:80 \
  egs-web:fixed

echo -e "${GREEN}✅ Conteneur démarré${NC}"
echo ""

# ============================================
# 4. Vérification
# ============================================
echo -e "${BLUE}[4/4] Vérification...${NC}"
sleep 5

# Test HTTP
echo -n "Test HTTP: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8080/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}OK (HTTP 200)${NC}"
else
    echo -e "${YELLOW}HTTP $HTTP_CODE${NC}"
fi

# Test API Supabase avec la clé
echo -n "Test API Supabase: "
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  --max-time 5 \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  "${VITE_SUPABASE_URL}/rest/v1/user_profiles?select=count" 2>/dev/null || echo "000")

if [ "$API_CODE" = "200" ]; then
    echo -e "${GREEN}OK (HTTP 200) - Clé API fonctionnelle !${NC}"
elif [ "$API_CODE" = "401" ]; then
    echo -e "${RED}ERREUR (HTTP 401) - Clé API invalide${NC}"
else
    echo -e "${YELLOW}HTTP $API_CODE${NC}"
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ REBUILD TERMINÉ${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Accès:${NC}"
echo "  http://localhost:8080"
echo ""
echo -e "${CYAN}Logs:${NC}"
echo "  docker logs -f egs-web"
echo ""
