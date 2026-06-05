#!/usr/bin/env bash
set -euo pipefail

cd /home/soma/gnamba-project

echo "🧹 Nettoyage des conteneurs Supabase verrouillés..."
echo "===================================================="

# Arrêter tous les processus supabase
echo "1️⃣  Arrêt des processus Supabase..."
pkill -f "supabase start" || true
pkill -f "supabase local" || true
sleep 2

# Arrêter Supabase proprement
echo "2️⃣  Arrêt du service Supabase..."
supabase stop || true
sleep 3

# Lister les conteneurs supabase
echo "3️⃣  Conteneurs avant nettoyage:"
docker ps -a | grep -i supabase || echo "   Aucun conteneur supabase trouvé"

# Supprimer les conteneurs problématiques
echo "4️⃣  Suppression des conteneurs verrouillés..."
for container in $(docker ps -a --format '{{.Names}}' | grep supabase); do
    echo "   Suppression de: $container"
    docker stop "$container" 2>/dev/null || true
    docker rm "$container" 2>/dev/null || true
done

# Vérifier l'espace Docker
echo "5️⃣  Nettoyage des ressources Docker..."
docker volume prune -f >/dev/null 2>&1 || true

# Vérifier que le nettoyage est complet
echo "6️⃣  Conteneurs après nettoyage:"
docker ps -a | grep -i supabase || echo "   ✅ Aucun conteneur supabase"

echo ""
echo "✅ Nettoyage terminé. Supabase est prêt à redémarrer."