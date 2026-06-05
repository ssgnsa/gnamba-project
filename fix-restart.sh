#!/bin/bash
# Fix restart - Démarrage dans le bon ordre avec vérification DNS

echo "🔧 Fix Redémarrage EGS + Filebrowser"
echo "===================================="

# 1. Nettoyer
echo "1. Nettoyage..."
docker rm -f egs-web filebrowser 2>/dev/null
docker network create gnamba-network 2>/dev/null || echo "Réseau existe"
sleep 2

# 2. Démarrer Filebrowser d'abord
echo "2. Démarrage Filebrowser..."
docker run -d \
    --name filebrowser \
    --network gnamba-network \
    -p 8081:80 \
    -v /home/soma/partage:/srv \
    filebrowser/filebrowser

sleep 5

# Vérifier filebrowser est healthy
for i in 1 2 3 4 5; do
    if curl -s http://localhost:8081/health 2>/dev/null | grep -q "OK\|healthy"; then
        echo "   ✅ Filebrowser prêt"
        break
    fi
    echo "   Attente filebrowser... ($i/5)"
    sleep 2
done

# 3. Démarrer EGS (maintenant filebrowser est résolvable)
echo "3. Démarrage EGS..."
docker run -d \
    --name egs-web \
    --network gnamba-network \
    -p 8080:80 \
    egs-web:cloud-v3

sleep 5

# 4. Vérifier EGS
echo "4. Vérification EGS..."
for i in 1 2 3; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8080/ 2>/dev/null || echo "000")
    if [ "$CODE" = "200" ]; then
        echo "   ✅ EGS répond HTTP 200"
        break
    fi
    echo "   Tentative $i: HTTP $CODE"
    docker logs --tail 3 egs-web
    sleep 3
done

# 5. Résumé
echo ""
echo "===================================="
echo "📊 Statut:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(egs|file)"
echo ""
echo "🌐 URLs:"
echo "   EGS: http://localhost:8080"
echo "   Filebrowser: http://localhost:8081"
