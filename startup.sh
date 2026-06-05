#!/bin/bash
# ============================================
# Script de Démarrage Propre - EGS + Filebrowser
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Charger les variables d'environnement
if [ -f "/home/soma/gnamba-project/.env" ]; then
    export $(grep -v '^#' /home/soma/gnamba-project/.env | xargs)
fi

# Valeurs par défaut
VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-https://thykrnoqgylrbfupophs.supabase.co}"
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-sb_publishable_K2AvUraEL_URgy91DbLcyQ_wDPtmWuu}"
VITE_SUPABASE_MODE="${VITE_SUPABASE_MODE:-cloud}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🚀 DÉMARRAGE EGS + FILEBROWSER + SERVICES          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Date: $(date)"
echo ""

# ============================================
# 1. Vérifier Docker
# ============================================
echo -e "${BLUE}[1/7] Vérification Docker...${NC}"
if ! docker info &>/dev/null; then
    echo -e "${RED}❌ Docker non disponible${NC}"
    exit 1
fi
if ! docker-compose version &>/dev/null; then
    echo -e "${YELLOW}⚠️  docker-compose non trouvé${NC}"
fi
echo -e "${GREEN}✅ Docker OK${NC}"
echo ""

# ============================================
# 2. Créer le réseau
# ============================================
echo -e "${BLUE}[2/7] Configuration réseau...${NC}"
if ! docker network ls | grep -q "gnamba-network"; then
    docker network create gnamba-network
    echo -e "${GREEN}✅ Réseau gnamba-network créé${NC}"
else
    echo -e "${GREEN}✅ Réseau gnamba-network existe${NC}"
fi
echo ""

# ============================================
# 3. Démarrer Filebrowser (indépendant)
# ============================================
echo -e "${BLUE}[3/7] Démarrage Filebrowser...${NC}"
if docker ps | grep -q "filebrowser"; then
    echo -e "${GREEN}✅ Filebrowser déjà démarré${NC}"
else
    # Créer la DB si elle n'existe pas
    if [ ! -f "/home/soma/filebrowser.db" ]; then
        touch /home/soma/filebrowser.db
    fi
    # Créer le dossier partage si besoin
    if [ ! -d "/home/soma/partage" ]; then
        mkdir -p /home/soma/partage
    fi
    
    docker run -d \
        --name filebrowser \
        --network gnamba-network \
        --restart unless-stopped \
        -p 8081:80 \
        -v /home/soma/partage:/srv \
        -v /home/soma/filebrowser.db:/database.db \
        -e FB_DATABASE=/database.db \
        -e FB_ROOT=/srv \
        filebrowser/filebrowser:latest
    
    echo -e "${GREEN}✅ Filebrowser démarré sur http://localhost:8081${NC}"
fi
echo ""

# ============================================
# 4. Vérifier/Build l'image EGS
# ============================================
echo -e "${BLUE}[4/7] Vérification image EGS...${NC}"
if ! docker images | grep -q "egs-web.*runtime"; then
    echo "   Construction de l'image..."
    cd /home/soma/gnamba-project
    docker build -t egs-web:runtime -f Dockerfile.runtime .
    echo -e "${GREEN}✅ Image EGS:runtime construite${NC}"
else
    echo -e "${GREEN}✅ Image EGS:runtime disponible${NC}"
fi
echo ""

# ============================================
# 5. Démarrer EGS (avec variables runtime)
# ============================================
echo -e "${BLUE}[5/7] Démarrage EGS...${NC}"
if docker ps | grep -q "egs-web"; then
    echo -e "${YELLOW}⚠️  EGS déjà démarré, redémarrage...${NC}"
    docker stop egs-web && docker rm egs-web
fi

docker run -d \
    --name egs-web \
    --network gnamba-network \
    --restart unless-stopped \
    -p 8080:80 \
    -e VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
    -e VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
    -e VITE_SUPABASE_MODE="$VITE_SUPABASE_MODE" \
    egs-web:runtime

echo -e "${GREEN}✅ EGS démarré sur http://localhost:8080${NC}"
echo ""

# ============================================
# 6. Attendre et vérifier
# ============================================
echo -e "${BLUE}[6/7] Vérification des services...${NC}"
echo "   Attente 5 secondes..."
sleep 5

# Test EGS
echo -n "   EGS: "
for i in 1 2 3; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:8080/ 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}OK (HTTP 200)${NC}"
        break
    fi
    sleep 2
done
if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}ERREUR (HTTP $HTTP_CODE)${NC}"
fi

# Test Filebrowser
echo -n "   Filebrowser: "
FB_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:8081/ 2>/dev/null || echo "000")
if [ "$FB_CODE" = "200" ] || [ "$FB_CODE" = "401" ]; then
    echo -e "${GREEN}OK (HTTP $FB_CODE)${NC}"
else
    echo -e "${YELLOW}ATTENTION (HTTP $FB_CODE)${NC}"
fi
echo ""

# ============================================
# 7. Résumé
# ============================================
echo -e "${BLUE}[7/7] RÉSUMÉ${NC}"
echo ""
echo -e "${GREEN}🎉 SERVICES DÉMARRÉS${NC}"
echo ""
echo -e "${CYAN}URLs d'accès:${NC}"
echo "   🌐 EGS:         http://localhost:8080"
echo "   📁 Filebrowser: http://localhost:8081"
echo ""
echo -e "${CYAN}Identifiants:${NC}"
echo "   EGS:         admin / GnambaAdmin2024!"
echo "   Filebrowser: admin / admin"
echo ""
echo -e "${CYAN}Commandes utiles:${NC}"
echo "   Logs EGS:         docker logs -f egs-web"
echo "   Logs Filebrowser: docker logs -f filebrowser"
echo "   Redémarrer:       docker restart egs-web filebrowser"
echo "   Arrêter:          docker stop egs-web filebrowser"
echo "   Statut:           docker ps"
echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo "Terminé: $(date)"
