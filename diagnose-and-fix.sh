#!/bin/bash
# ============================================
# DIAGNOSTIC ET CORRECTION AUTOMATIQUE
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔧 DIAGNOSTIC ET CORRECTION EGS"
echo "============================================"
echo "Date: $(date)"
echo ""

# ============================================
# ÉTAPE 1: Vérifier conteneurs
# ============================================
echo -e "${BLUE}[1/6] Vérification conteneurs...${NC}"

if ! docker ps | grep -q "egs-web"; then
    echo -e "${YELLOW}   ⚠️  EGS non démarré${NC}"
    
    # Vérifier si l'image existe
    if docker images | grep -q "egs-web"; then
        echo "   Démarrage EGS..."
        docker run -d --name egs-web -p 8080:80 egs-web:simple 2>/dev/null || \
        docker run -d --name egs-web -p 8080:80 egs-web:cloud-v3 2>/dev/null || \
        echo -e "${RED}   ❌ Impossible de démarrer EGS${NC}"
    else
        echo -e "${RED}   ❌ Image EGS non trouvée${NC}"
        echo "   Vous devez rebuild: docker build -t egs-web:simple -f Dockerfile.simple ."
    fi
else
    echo -e "${GREEN}   ✅ EGS démarré${NC}"
fi

sleep 2

# ============================================
# ÉTAPE 2: Test HTTP
# ============================================
echo -e "${BLUE}[2/6] Test HTTP...${NC}"

RETRIES=0
MAX_RETRIES=5
HTTP_CODE="000"

while [ "$HTTP_CODE" != "200" ] && [ $RETRIES -lt $MAX_RETRIES ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8080/ 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}   ✅ HTTP 200 OK${NC}"
        break
    else
        echo "   Tentative $((RETRIES+1))/$MAX_RETRIES: HTTP $HTTP_CODE"
        ((RETRIES++))
        sleep 3
    fi
done

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}   ❌ EGS ne répond pas après $MAX_RETRIES tentatives${NC}"
    echo ""
    echo "   Logs EGS:"
    docker logs --tail 10 egs-web 2>/dev/null || echo "   Pas de logs disponibles"
fi

# ============================================
# ÉTAPE 3: Vérifier logs erreurs
# ============================================
echo -e "${BLUE}[3/6] Analyse logs...${NC}"

if docker ps | grep -q "egs-web"; then
    LOGS=$(docker logs --tail 30 egs-web 2>&1 || echo "")
    
    # Chercher erreurs critiques
    if echo "$LOGS" | grep -qiE "emerg|fatal|cannot|failed to|error.*start"; then
        echo -e "${RED}   ❌ Erreurs critiques détectées:${NC}"
        echo "$LOGS" | grep -iE "emerg|fatal|cannot|failed to|error.*start" | tail -3 | while read line; do
            echo "      $line"
        done
        
        # Si erreur upstream filebrowser, informer
        if echo "$LOGS" | grep -q "host not found in upstream.*filebrowser"; then
            echo ""
            echo -e "${YELLOW}   💡 Solution: Redémarrer avec la version 'simple'${NC}"
            echo "      docker rm -f egs-web"
            echo "      docker run -d --name egs-web -p 8080:80 egs-web:simple"
        fi
    else
        echo -e "${GREEN}   ✅ Pas d'erreurs critiques${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  EGS non disponible pour analyse${NC}"
fi

# ============================================
# ÉTAPE 4: Test Supabase
# ============================================
echo -e "${BLUE}[4/6] Test Supabase Cloud...${NC}"

CLOUD_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    "https://thykrnoqgylrbfupophs.supabase.co/rest/v1/user_profiles?select=count" \
    -H "apikey: sb_publishable_K2AvUraEL_URgy91DbLcyQ_wDPtmWuu" 2>/dev/null || echo "000")

if [ "$CLOUD_CODE" = "200" ]; then
    echo -e "${GREEN}   ✅ Supabase Cloud accessible${NC}"
else
    echo -e "${YELLOW}   ⚠️  Supabase: HTTP $CLOUD_CODE${NC}"
    if [ "$CLOUD_CODE" = "401" ]; then
        echo "      (401 = besoin d'authentification - normal)"
    fi
fi

# ============================================
# ÉTAPE 5: Vérifier contenu
# ============================================
echo -e "${BLUE}[5/6] Vérification contenu...${NC}"

if [ "$HTTP_CODE" = "200" ]; then
    HTML=$(curl -s --max-time 10 http://localhost:8080/ 2>/dev/null | head -c 1000)
    
    if echo "$HTML" | grep -qiE "EGS|Gnamba|DOCTYPE.*html|script.*src"; then
        echo -e "${GREEN}   ✅ Contenu HTML valide${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Contenu HTML suspect${NC}"
        echo "      Premier 200 caractères:"
        echo "$HTML" | head -c 200
    fi
else
    echo -e "${YELLOW}   ⚠️  Impossible de vérifier (EGS inaccessible)${NC}"
fi

# ============================================
# ÉTAPE 6: Résumé et actions
# ============================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}[6/6] RÉSUMÉ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Statut final
if docker ps | grep -q "egs-web" && [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}🎉 EGS EST OPÉRATIONNEL${NC}"
    echo ""
    echo -e "${CYAN}🌐 Accès:${NC}"
    echo "   http://localhost:8080"
    echo ""
    echo -e "${CYAN}🔑 Identifiants:${NC}"
    echo "   admin / GnambaAdmin2024!"
    echo ""
    echo -e "${CYAN}📊 Statut:${NC}"
    docker ps --filter "name=egs-web" --format "   {{.Names}}: {{.Status}} | {{.Ports}}"
    
elif docker ps | grep -q "egs-web"; then
    echo -e "${YELLOW}⚠️  EGS DÉMARRÉ MAIS INACCESSIBLE${NC}"
    echo ""
    echo "   Problèmes possibles:"
    echo "   • Nginx mal configuré"
    echo "   • Port 8080 occupé"
    echo "   • Build incomplet"
    echo ""
    echo "   Commandes de debug:"
    echo "   docker logs egs-web"
    echo "   docker exec egs-web ls -la /usr/share/nginx/html/"
    echo ""
    echo "   Pour recréer:"
    echo "   docker rm -f egs-web"
    echo "   docker run -d --name egs-web -p 8080:80 egs-web:simple"
    
else
    echo -e "${RED}❌ EGS NON DÉMARRÉ${NC}"
    echo ""
    echo "   Actions requises:"
    echo ""
    echo "   1. Vérifier si l'image existe:"
    echo "      docker images | grep egs-web"
    echo ""
    echo "   2. Si image manquante, rebuild:"
    echo "      cd /home/soma/gnamba-project"
    echo "      docker build --build-arg VITE_SUPABASE_MODE=cloud \\"
    echo "        --build-arg VITE_SUPABASE_URL=https://thykrnoqgylrbfupophs.supabase.co \\"
    echo "        --build-arg VITE_SUPABASE_ANON_KEY=sb_publishable_K2AvUraEL_URgy91DbLcyQ_wDPtmWuu \\"
    echo "        -t egs-web:simple -f Dockerfile.simple ."
    echo ""
    echo "   3. Démarrer:"
    echo "      docker run -d --name egs-web -p 8080:80 egs-web:simple"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo "Terminé: $(date)"
