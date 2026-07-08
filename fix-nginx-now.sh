#!/bin/bash
# ============================================
# FIX IMMÉDIAT: Nginx sans Filebrowser
# Résout: "host not found in upstream 'filebrowser'"
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔧 FIX: Nginx sans dépendance Filebrowser            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# 1. Arrêter les conteneurs en boucle
# ============================================
echo -e "${YELLOW}[1/5] Arrêt des conteneurs...${NC}"
docker stop egs-web 2>/dev/null || true
docker rm egs-web 2>/dev/null || true

# Vérifier si filebrowser existe sur le bon réseau
echo -e "${CYAN}   Vérification filebrowser...${NC}"
if docker ps | grep -q "filebrowser"; then
    echo -e "${GREEN}   ✅ Filebrowser est démarré${NC}"
else
    echo -e "${YELLOW}   ⚠️  Filebrowser non démarré (normal, on le sépare)${NC}"
fi
echo ""

# ============================================
# 2. Charger les variables
# ============================================
echo -e "${YELLOW}[2/5] Chargement des variables d'environnement...${NC}"
if [ -f "/home/soma/gnamba-project/.env" ]; then
    export $(grep -v '^#' /home/soma/gnamba-project/.env | xargs)
    echo -e "${GREEN}   ✅ Variables chargées${NC}"
else
    echo -e "${RED}   ❌ Fichier .env non trouvé${NC}"
    exit 1
fi
echo ""

# Vérifier que la clé est au format JWT
if [[ ! "$VITE_SUPABASE_ANON_KEY" =~ ^eyJ ]]; then
    echo -e "${RED}❌ ERREUR: La clé n'est pas au format JWT${NC}"
    echo "   Attendu: eyJhbGciOiJIUzI1NiIs..."
    echo "   Actuel: ${VITE_SUPABASE_ANON_KEY:0:30}..."
    exit 1
fi

# ============================================
# 3. Build avec Dockerfile.nofb (utiliser VITE_LOCAL_API_URL pour production)
# ============================================
echo -e "${YELLOW}[3/5] Build Docker (sans filebrowser)...${NC}"
cd /home/soma/gnamba-project

# Prefer canonical API variable
LOCAL_API_URL="${VITE_LOCAL_API_URL:-${VITE_SUPABASE_URL:-}}"

docker build \
    --build-arg VITE_LOCAL_API_URL="$LOCAL_API_URL" \
    --build-arg VITE_SUPABASE_MODE="$VITE_SUPABASE_MODE" \
    --build-arg VITE_SUPABASE_URL="$LOCAL_API_URL" \
    --build-arg VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}" \
    -t egs-web:nofb \
    -f Dockerfile.nofb . 2>&1 | tail -20

echo -e "${GREEN}   ✅ Build terminé (image: egs-web:nofb)${NC}"
echo ""

# ============================================
# 4. Démarrer EGS (sans dépendance filebrowser)
# ============================================
echo -e "${YELLOW}[4/5] Démarrage EGS...${NC}"
docker run -d \
  --name egs-web \
  --network gnamba-network \
  --restart unless-stopped \
  -p 8080:80 \
  egs-web:nofb

echo -e "${GREEN}   ✅ EGS démarré sur port 8080${NC}"
echo ""

# ============================================
# 5. Démarrer Filebrowser (si pas déjà) sur port 8081
# ============================================
echo -e "${YELLOW}[5/5] Démarrage Filebrowser (séparé)...${NC}"
if ! docker ps | grep -q "filebrowser"; then
    # Créer la DB si n'existe pas
    if [ ! -f "/home/soma/filebrowser.db" ]; then
        touch /home/soma/filebrowser.db
    fi
    # Créer le dossier partage
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
    
    echo -e "${GREEN}   ✅ Filebrowser démarré sur port 8081${NC}"
else
    echo -e "${GREEN}   ✅ Filebrowser déjà démarré${NC}"
fi
echo ""

# ============================================
# 6. Vérification finale
# ============================================
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🔍 Vérification des services...${NC}"
sleep 3

echo ""
echo -e "${CYAN}Conteneurs actifs:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(egs-web|filebrowser)" || echo "   Aucun conteneur trouvé"

echo ""
echo -n "Test EGS (port 8080): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8080/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}OK (HTTP 200)${NC}"
else
    echo -e "${RED}ERREUR (HTTP $HTTP_CODE)${NC}"
fi

echo -n "Test Filebrowser (port 8081): "
FB_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8081/ 2>/dev/null || echo "000")
if [ "$FB_CODE" = "200" ] || [ "$FB_CODE" = "401" ]; then
    echo -e "${GREEN}OK (HTTP $FB_CODE)${NC}"
else
    echo -e "${YELLOW}ATTENTION (HTTP $FB_CODE)${NC}"
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ FIX APPLIQUÉ !${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}URLs d'accès:${NC}"
echo "   🌐 EGS:         http://localhost:8080"
echo "   📁 Filebrowser: http://localhost:8081"
echo ""
echo -e "${CYAN}Logs:${NC}"
echo "   docker logs -f egs-web"
echo "   docker logs -f filebrowser"
echo ""
