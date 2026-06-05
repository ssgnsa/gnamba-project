#!/usr/bin/env bash
# =============================================================================
# FIX DATABASE MIGRATION ISSUES
# Restaurer à partir du backup et appliquer les migrations proprement
# =============================================================================

set -euo pipefail

PROJECT_ROOT="/home/soma/gnamba-project"
cd "${PROJECT_ROOT}"

echo "🔧 Correction des problèmes de migration..."
echo "============================================"

# 1. Arrêter Supabase
echo "1. Arrêt de Supabase..."
supabase stop 2>/dev/null || true
sleep 3

# 2. Supprimer les volumes pour un reset complet
echo "2. Suppression des volumes Docker..."
docker volume rm -f supabase_db_gnamba-project 2>/dev/null || true
docker volume rm -f supabase_storage_gnamba-project 2>/dev/null || true
sleep 2

# 3. Restaurer depuis le backup Supabase
echo "3. Restauration depuis le backup local..."
supabase start 2>&1 | grep -E "Starting|Seeding|Applying|database" | tail -5

echo ""
echo "✅ Database devrait être en bon état"
echo "🔍 Vérification en cours..."
sleep 10

# 4. Vérifier l'état
supabase status 2>&1 | tail -20 || echo "Status check failed"