#!/usr/bin/env bash
# =============================================================================
# FULL SUPABASE RESET & RECOVERY
# Nettoie complètement les volumes Docker et redémarre Supabase
# Date: 13 mai 2026
# =============================================================================

set -euo pipefail

PROJECT_ROOT="/home/soma/gnamba-project"
cd "${PROJECT_ROOT}"

echo "🧹 RESET COMPLET SUPABASE"
echo "=========================="

# 1. Arrêter Supabase
echo "1️⃣  Arrêt de Supabase..."
supabase stop 2>/dev/null || true
sleep 3

# 2. Supprimer les volumes problématiques
echo "2️⃣  Suppression des volumes..."
docker volume rm -f supabase_db_gnamba-project 2>/dev/null || echo "   (db volume déjà supprimé)"
docker volume rm -f supabase_storage_gnamba-project 2>/dev/null || echo "   (storage volume déjà supprimé)"

# 3. Vérifier qu'il n'y a plus de volumes
echo "3️⃣  Vérification:"
REMAINING=$(docker volume ls --filter label=com.supabase.cli.project=gnamba-project | wc -l)
if [ $REMAINING -le 1 ]; then
    echo "   ✅ Volumes nettoyés"
else
    echo "   ⚠️  Volumes restants:"
    docker volume ls --filter label=com.supabase.cli.project=gnamba-project
fi

# 4. Désactiver Studio pour éviter les timeouts réseau
echo "4️⃣  Désactivation de Studio..."
if grep -q "enabled = true" "${PROJECT_ROOT}/supabase/config.toml"; then
    sed -i 's/\[studio\]/[studio]\nenabled = false/' "${PROJECT_ROOT}/supabase/config.toml" 2>/dev/null || \
    sed -i '' 's/enabled = true/enabled = false/' "${PROJECT_ROOT}/supabase/config.toml"
    echo "   ✅ Studio désactivé"
else
    echo "   ℹ️  Studio déjà désactivé"
fi

# 5. Redémarrer avec --ignore-health-check
echo "5️⃣  Redémarrage de Supabase..."
supabase start --ignore-health-check 2>&1 | tail -20

echo ""
echo "✅ Reset terminé"
echo "🔍 Vérification du statut dans 10 secondes..."
sleep 10

echo ""
echo "📊 Status final:"
supabase status 2>&1 || echo "Status command failed - services may still be starting"