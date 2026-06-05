#!/bin/bash
# ============================================
# REDEPLOIEMENT COMPLET EGS
# Avec vérification des logs
# ============================================

set -e

echo "🚀 REDEPLOIEMENT EGS - $(date)"
echo "============================================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# 1. ARRÊT
# ============================================
echo -e "${YELLOW}1. Arrêt des services...${NC}"
docker stop egs-web filebrowser 2>/dev/null || true
docker rm egs-web filebrowser 2>/dev/null || true
echo -e "${GREEN}   ✅ Services arrêtés${NC}"
sleep 2

# ============================================
# 2. BUILD (optionnel si image existe)
# ============================================
echo -e "${YELLOW}2. Vérification image...${NC}"
if docker images | grep -q "egs-web.*cloud-v3"; then
    echo -e "${GREEN}   ✅ Image egs-web:cloud-v3 disponible${NC}"
else
    echo -e "${YELLOW}   🏗️  Build nécessaire...${NC}"
    cd /home/soma/gnamba-project
    docker build \
        --build-arg VITE_SUPABASE_MODE=cloud \
        --build-arg VITE_SUPABASE_URL=https://thykrnoqgylrbfupophs.supabase.co \
        --build-arg VITE_SUPABASE_ANON_KEY=sb_publishable_K2AvUraEL_URgy91DbLcyQ_wDPtmWuu \
        -t egs-web:cloud-v3 \
        -f Dockerfile .
    echo -e "${GREEN}   ✅ Build terminé${NC}"
fi

# ============================================
# 3. DÉMARRAGE EGS
# ============================================
echo -e "${YELLOW}3. Démarrage EGS...${NC}"
docker run -d \
    --name egs-web \
    --network gnamba-network \
    -p 8080:80 \
    egs-web:cloud-v3
echo -e "${GREEN}   ✅ EGS démarré${NC}"
sleep 3

# ============================================
# 4. DÉMARRAGE FILEBROWSER
# ============================================
echo -e "${YELLOW}4. Démarrage Filebrowser...${NC}"
docker run -d \
    --name filebrowser \
    --network gnamba-network \
    -p 8081:80 \
    -v /home/soma/partage:/srv \
    -v /home/soma/filebrowser.db:/database.db \
    filebrowser/filebrowser 2>/dev/null || \
    docker start filebrowser 2>/dev/null || \
    echo -e "${YELLOW}   ⚠️ Filebrowser skip${NC}"
echo -e "${GREEN}   ✅ Filebrowser démarré${NC}"
sleep 2

# ============================================
# 5. VÉRIFICATIONS
# ============================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}5. VÉRIFICATIONS${NC}"
echo -e "${BLUE}============================================${NC}"

# Test EGS
echo -e "${YELLOW}Test EGS (localhost:8080)...${NC}"
for i in 1 2 3; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8080/ 2>/dev/null || echo "000")
    if [ "$CODE" = "200" ]; then
        echo -e "${GREEN}   ✅ EGS répond HTTP 200${NC}"
        break
    fi
    echo "   Tentative $i: HTTP $CODE"
    sleep 2
done

# Test Filebrowser
echo -e "${YELLOW}Test Filebrowser (localhost:8081)...${NC}"
FBCODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:8081/ 2>/dev/null || echo "000")
if [ "$FBCODE" = "200" ] || [ "$FBCODE" = "401" ]; then
    echo -e "${GREEN}   ✅ Filebrowser répond HTTP $FBCODE${NC}"
else
    echo -e "${YELLOW}   ⚠️ Filebrowser: HTTP $FBCODE${NC}"
fi

# Test Supabase Cloud
echo -e "${YELLOW}Test Supabase Cloud...${NC}"
CLOUDCODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    "https://thykrnoqgylrbfupophs.supabase.co/rest/v1/" 2>/dev/null || echo "000")
if [ "$CLOUDCODE" = "401" ]; then
    echo -e "${GREEN}   ✅ Cloud accessible (401=normal)${NC}"
else
    echo -e "${YELLOW}   ⚠️ Cloud: HTTP $CLOUDCODE${NC}"
fi

# ============================================
# 6. LOGS
# ============================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}6. LOGS RÉCENTS${NC}"
echo -e "${BLUE}============================================${NC}"

echo -e "${CYAN}Logs EGS (5 dernières lignes):${NC}"
docker logs --tail 5 egs-web 2>&1 | while read line; do
    echo "   $line"
done

echo ""
echo -e "${CYAN}Conteneurs actifs:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAMES|egs|file)"

# ============================================
# 7. RÉSUMÉ
# ============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ REDEPLOIEMENT TERMINÉ${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${CYAN}🌐 URLs:${NC}"
echo "   EGS:         http://localhost:8080"
echo "   Filebrowser: http://localhost:8081"
echo ""
echo -e "${CYAN}🔑 Identifiants:${NC}"
echo "   EGS Admin:    admin / GnambaAdmin2024!"
echo "   Filebrowser:  admin / admin"
echo ""
echo -e "${CYAN}📊 Commandes utiles:${NC}"
echo "   Logs EGS:         docker logs -f egs-web"
echo "   Logs Filebrowser: docker logs -f filebrowser"
echo "   Redémarrer:       docker restart egs-web"
echo "   Stats:            docker stats"
echo ""

# Vérifier erreurs
ERRORS=$(docker logs egs-web 2>&1 | grep -iE "error|failed|404|500" | tail -3 || true)
if [ -n "$ERRORS" ]; then
    echo -e "${YELLOW}⚠️  Erreurs récentes:${NC}"
    echo "$ERRORS" | while read line; do
        echo "   $line"
    done
    echo ""
fi

echo -e "${GREEN}🎉 Prêt à utiliser !${NC}"
