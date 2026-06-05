#!/bin/bash
# ============================================
# Déploiement Complet EGS + Vérification Logs
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

LOG_FILE="/tmp/deploy-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_header() {
    log "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    log "${BLUE}║ $1${NC}"
    log "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
}

# ============================================
# ÉTAPE 1: Arrêt propre
# ============================================
log_header "🛑 ÉTAPE 1/7: Arrêt des services"

docker stop egs-web filebrowser 2>/dev/null || true
docker rm egs-web filebrowser 2>/dev/null || true

log "${GREEN}✅ Conteneurs arrêtés${NC}"
echo ""

# ============================================
# ÉTAPE 2: Vérification environnement
# ============================================
log_header "🔍 ÉTAPE 2/7: Vérification environnement"

# Vérifier .env
if [ ! -f "/home/soma/gnamba-project/.env" ]; then
    log "${RED}❌ Fichier .env manquant${NC}"
    exit 1
fi

# Extraire et vérifier les variables
SUPABASE_URL=$(grep VITE_SUPABASE_URL /home/soma/gnamba-project/.env | head -1 | cut -d'=' -f2)
ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY /home/soma/gnamba-project/.env | head -1 | cut -d'=' -f2)
MODE=$(grep VITE_SUPABASE_MODE /home/soma/gnamba-project/.env | head -1 | cut -d'=' -f2)

log "${CYAN}Configuration:${NC}"
log "  Mode: ${MODE:-non défini}"
log "  URL: ${SUPABASE_URL:-non défini}"
log "  Clé Anon: ${ANON_KEY:0:20}..."

if [ -z "$SUPABASE_URL" ] || [ -z "$ANON_KEY" ]; then
    log "${RED}❌ Variables manquantes dans .env${NC}"
    exit 1
fi

log "${GREEN}✅ Environnement OK${NC}"
echo ""

# ============================================
# ÉTAPE 3: Build EGS
# ============================================
log_header "🏗️ ÉTAPE 3/7: Build image EGS"

cd /home/soma/gnamba-project

log "${YELLOW}Build en cours (cela peut prendre 2-3 minutes)...${NC}"

if docker build \
    --build-arg VITE_SUPABASE_MODE=cloud \
    --build-arg VITE_SUPABASE_URL="$SUPABASE_URL" \
    --build-arg VITE_SUPABASE_ANON_KEY="$ANON_KEY" \
    -t egs-web:cloud-final \
    -f Dockerfile . 2>&1 | tee -a "$LOG_FILE" | tail -20; then
    log "${GREEN}✅ Build réussi${NC}"
else
    log "${RED}❌ Build échoué - voir $LOG_FILE${NC}"
    exit 1
fi

echo ""

# ============================================
# ÉTAPE 4: Démarrage EGS
# ============================================
log_header "🚀 ÉTAPE 4/7: Démarrage EGS"

if docker run -d \
    --name egs-web \
    --network gnamba-network \
    -p 8080:80 \
    egs-web:cloud-final 2>&1 | tee -a "$LOG_FILE"; then
    log "${GREEN}✅ EGS démarré sur port 8080${NC}"
else
    log "${RED}❌ Échec démarrage EGS${NC}"
    exit 1
fi

sleep 3
echo ""

# ============================================
# ÉTAPE 5: Démarrage Filebrowser
# ============================================
log_header "📁 ÉTAPE 5/7: Démarrage Filebrowser"

if docker run -d \
    --name filebrowser \
    --network gnamba-network \
    -p 8081:80 \
    -v /home/soma/partage:/srv \
    -v /home/soma/filebrowser.db:/database.db \
    filebrowser/filebrowser 2>&1 | tee -a "$LOG_FILE"; then
    log "${GREEN}✅ Filebrowser démarré sur port 8081${NC}"
else
    log "${YELLOW}⚠️ Filebrowser échoué (optionnel)${NC}"
fi

sleep 2
echo ""

# ============================================
# ÉTAPE 6: Vérification santé
# ============================================
log_header "🏥 ÉTAPE 6/7: Vérification santé"

# Test EGS
log "${CYAN}Test EGS (http://localhost:8080)...${NC}"
for i in 1 2 3; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8080/ 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log "${GREEN}✅ EGS répond HTTP 200${NC}"
        break
    else
        log "  Tentative $i: HTTP $HTTP_CODE"
        sleep 2
    fi
done

if [ "$HTTP_CODE" != "200" ]; then
    log "${RED}❌ EGS ne répond pas correctement${NC}"
fi

# Test Filebrowser
log "${CYAN}Test Filebrowser (http://localhost:8081)...${NC}"
FB_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:8081/ 2>/dev/null || echo "000")
if [ "$FB_CODE" = "200" ] || [ "$FB_CODE" = "401" ]; then
    log "${GREEN}✅ Filebrowser répond HTTP $FB_CODE${NC}"
else
    log "${YELLOW}⚠️ Filebrowser: HTTP $FB_CODE${NC}"
fi

# Test Supabase Cloud
log "${CYAN}Test Supabase Cloud...${NC}"
CLOUD_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    "${SUPABASE_URL}/rest/v1/" 2>/dev/null || echo "000")
if [ "$CLOUD_CODE" = "401" ]; then
    log "${GREEN}✅ Supabase Cloud accessible (401 = OK, besoin auth)${NC}"
else
    log "${YELLOW}⚠️ Supabase Cloud: HTTP $CLOUD_CODE${NC}"
fi

echo ""

# ============================================
# ÉTAPE 7: Logs et résumé
# ============================================
log_header "📋 ÉTAPE 7/7: Logs et résumé"

log "${CYAN}Logs EGS (dernières lignes):${NC}"
docker logs --tail 10 egs-web 2>&1 | tee -a "$LOG_FILE" | while read line; do
    log "  $line"
done

log ""
log "${CYAN}Conteneurs actifs:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(egs|filebrowser)" | while read line; do
    log "  $line"
done

log ""
log_header "🎉 DÉPLOIEMENT TERMINÉ"

log "${CYAN}URLs:${NC}"
log "  🌐 EGS:         http://localhost:8080"
log "  📁 Filebrowser: http://localhost:8081"
log "  ☁️  Supabase:    ${SUPABASE_URL}"
log ""
log "${CYAN}Identifiants EGS:${NC}"
log "  Admin: admin / GnambaAdmin2024!"
log ""
log "${CYAN}Fichier log complet:${NC}"
log "  $LOG_FILE"
log ""

# Afficher aussi les erreurs récentes
if docker logs egs-web 2>&1 | grep -i "error\|failed\|404\|500" | tail -5 > /tmp/errors.log 2>/dev/null && [ -s /tmp/errors.log ]; then
    log "${YELLOW}⚠️  Erreurs récentes détectées:${NC}"
    cat /tmp/errors.log | while read line; do
        log "  $line"
    done
    log ""
fi
