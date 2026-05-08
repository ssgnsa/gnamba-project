#!/bin/bash
# Correction des permissions FileBrowser

echo "=== CORRECTION PERMISSIONS ==="
sudo chown -R 1000:1000 /home/soma/filebrowser
sudo chmod -R 755 /home/soma/filebrowser
echo "✅ Permissions corrigées"

echo ""
echo "=== REDÉMARRAGE FILEBROWSER ==="
docker stop filebrowser 2>/dev/null || true
docker rm filebrowser 2>/dev/null || true

cd /home/soma/gnamba-project
docker-compose -f docker-compose.filebrowser.yml --env-file .env.filebrowser up -d

echo ""
echo "=== ATTENTE DÉMARRAGE ==="
sleep 5

echo ""
echo "=== STATUT ==="
docker ps --filter "name=filebrowser"

echo ""
echo "=== TEST LOCAL ==="
curl -I http://localhost:8081 2>&1 | head -3
