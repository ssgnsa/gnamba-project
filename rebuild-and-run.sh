#!/bin/bash
# ============================================
# REBUILD ET DÉMARRAGE RAPIDE - EGS sans Filebrowser
# ============================================

set -e

echo "🚀 REBUILD EGS (sans dépendance filebrowser)..."
echo ""

# Charger les variables
export $(grep -v '^#' /home/soma/gnamba-project/.env | xargs)

echo "Variables:"
echo "  URL: ${VITE_SUPABASE_URL:0:50}..."
echo "  KEY: ${VITE_SUPABASE_ANON_KEY:0:20}..."
echo ""

# Vérifier que la clé est au format JWT
if [[ ! "$VITE_SUPABASE_ANON_KEY" =~ ^eyJ ]]; then
    echo "❌ ERREUR: La clé n'est pas au format JWT"
    exit 1
fi

# Arrêter et supprimer l'ancien conteneur s'il existe
docker stop egs-web 2>/dev/null || true
docker rm egs-web 2>/dev/null || true

# Build
echo "🔧 Build Docker..."
cd /home/soma/gnamba-project

# Use canonical local API variable when available
LOCAL_API_URL="${VITE_LOCAL_API_URL:-${VITE_SUPABASE_URL:-}}"

docker build \
    --build-arg VITE_LOCAL_API_URL="$LOCAL_API_URL" \
    --build-arg VITE_SUPABASE_MODE="$VITE_SUPABASE_MODE" \
    --build-arg VITE_SUPABASE_URL="$LOCAL_API_URL" \
    --build-arg VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}" \
    -t egs-web:nofb \
    -f Dockerfile.nofb . 2>&1 | tail -10

echo ""
echo "✅ Build terminé"
echo ""

# Démarrer
echo "🚀 Démarrage EGS..."
docker run -d \
  --name egs-web \
  --network gnamba-network \
  --restart unless-stopped \
  -p 8080:80 \
  egs-web:nofb

echo "✅ EGS démarré sur port 8080"
echo ""

# Démarrer Filebrowser si pas déjà
if ! docker ps | grep -q "filebrowser"; then
    echo "🚀 Démarrage Filebrowser..."
    
    if [ ! -f "/home/soma/filebrowser.db" ]; then
        touch /home/soma/filebrowser.db
    fi
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
        filebrowser/filebrowser:latest 2>/dev/null || echo "Filebrowser déjà démarré"
    
    echo "✅ Filebrowser démarré sur port 8081"
else
    echo "✅ Filebrowser déjà actif"
fi

echo ""
sleep 3

# Vérification
echo "🔍 Vérification..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(egs-web|filebrowser)" || echo "Aucun conteneur trouvé"

echo ""
echo -n "Test EGS: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8080/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK (HTTP 200)"
else
    echo "❌ ERREUR (HTTP $HTTP_CODE)"
fi

echo -n "Test Filebrowser: "
FB_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8081/ 2>/dev/null || echo "000")
if [ "$FB_CODE" = "200" ] || [ "$FB_CODE" = "401" ]; then
    echo "✅ OK (HTTP $FB_CODE)"
else
    echo "⚠️  HTTP $FB_CODE"
fi

echo ""
echo "🎉 Terminé !"
echo "   EGS: http://localhost:8080"
echo "   Filebrowser: http://localhost:8081"
