#!/bin/bash
# Fix EGS - Corrige le problème upstream filebrowser

echo "🔧 Correction EGS - Problème réseau"
echo "=================================="

# 1. S'assurer que filebrowser est sur le réseau gnamba-network
echo "1. Vérification Filebrowser..."
if docker ps | grep -q filebrowser; then
    echo "   Filebrowser trouvé, connexion au réseau..."
    docker network connect gnamba-network filebrowser 2>/dev/null || echo "   Déjà connecté"
else
    echo "   Démarrage Filebrowser..."
    docker run -d --name filebrowser --network gnamba-network -p 8081:80 \
        -v /home/soma/partage:/srv -v /home/soma/filebrowser.db:/database.db \
        filebrowser/filebrowser
fi

sleep 2

# 2. Redémarrer EGS
echo "2. Redémarrage EGS..."
docker rm -f egs-web 2>/dev/null
docker run -d --name egs-web --network gnamba-network -p 8080:80 egs-web:cloud-v3

sleep 5

# 3. Vérifier
echo "3. Vérification..."
for i in 1 2 3; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:8080/ 2>/dev/null || echo "000")
    if [ "$CODE" = "200" ]; then
        echo "   ✅ EGS répond HTTP 200"
        break
    fi
    echo "   Tentative $i: HTTP $CODE"
    sleep 2
done

echo ""
echo "Logs EGS:"
docker logs --tail 5 egs-web
