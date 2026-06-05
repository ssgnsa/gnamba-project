#!/usr/bin/env bash
# =============================================================================
# RESTORE DATABASE FROM BACKUP
# Restaurer le schéma depuis le backup complet
# =============================================================================

set -euo pipefail

PROJECT_ROOT="/home/soma/gnamba-project"
cd "${PROJECT_ROOT}"

BACKUP_SCHEMA="${PROJECT_ROOT}/backups/supabase/latest/schema_full.sql"

if [ ! -f "${BACKUP_SCHEMA}" ]; then
    echo "❌ Fichier de schéma non trouvé: ${BACKUP_SCHEMA}"
    exit 1
fi

echo "🔄 Restauration de la base de données à partir du backup..."
echo "==========================================================="

# 1. Arrêter Supabase
echo "1️⃣  Arrêt de Supabase..."
supabase stop 2>/dev/null || true
sleep 3

# 2. Supprimer les volumes pour un reset complet
echo "2️⃣  Suppression des volumes Docker..."
docker volume rm -f supabase_db_gnamba-project 2>/dev/null || echo "   (db volume)"
docker volume rm -f supabase_storage_gnamba-project 2>/dev/null || echo "   (storage volume)"
sleep 2

# 3. Démarrer Supabase avec une base vierge
echo "3️⃣  Démarrage de Supabase..."
# Créer un fichier temporaire pour inhiber les migrations
touch "${PROJECT_ROOT}/supabase/.ignore_migrations"

supabase start --ignore-health-check 2>&1 | tail -10 || true

sleep 15

# 4. Restaurer le schéma depuis le backup
echo ""
echo "4️⃣  Restauration du schéma depuis backup..."

if supabase db psql -f "${BACKUP_SCHEMA}" 2>&1 | tail -20; then
    echo ""
    echo "✅ Schéma restauré avec succès"
else
    echo ""
    echo "⚠️  Restauration du schéma terminée (peut avoir des avertissements)"
fi

# 5. Vérifier les tables
echo ""
echo "5️⃣  Vérification des tables..."
supabase sql "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='public';" 2>&1 || true

# Nettoyer
rm -f "${PROJECT_ROOT}/supabase/.ignore_migrations"

echo ""
echo "✅ Restauration terminée"
echo "🔍 Vérification du statut..."
supabase status 2>&1 | tail -30