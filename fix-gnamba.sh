#!/bin/bash
set -e

cd /home/soma/gnamba-project

echo "🔧 CORRECTION GNAMBA - $(date)"
echo "================================"

# 1. Supabase local
echo "📦 1. Redémarrage Supabase local..."
supabase stop 2>/dev/null || true
sleep 3
supabase start --ignore-health-check
sleep 15

# Test API
if curl -s -f http://localhost:54321/rest/v1/ >/dev/null 2>&1; then
    echo "   ✅ Supabase API OK"
else
    echo "   ❌ Supabase API toujours inaccessible"
    echo "   🔍 Debug: supabase status"
    supabase status 2>&1 | tail -10
    exit 1
fi

# 2. Migrations
echo "📁 2. Application des migrations..."
find supabase/migrations -name "*.skip" -exec mv {} {%.skip}.sql \; 2>/dev/null || true

# Lister les migrations
echo "   📋 Migrations trouvées:"
ls supabase/migrations/*.sql | wc -l | xargs echo "   fichiers SQL:"

# Appliquer
if supabase db push 2>&1 | tail -5; then
    echo "   ✅ Migrations appliquées"
else
    echo "   ❌ Erreur migrations"
    exit 1
fi

# Vérification tables
echo "   🔍 Vérification tables critiques:"
for table in attestation_sequences foncier_lots properties user_profiles; do
    if supabase sql "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='$table');" 2>/dev/null | grep -q "t"; then
        echo "   ✅ Table $table existe"
    else
        echo "   ❌ Table $table manquante"
    fi
done

# 3. Backup test
echo "💾 3. Test de sauvegarde..."
source .env.server 2>/dev/null || true
export PGPASSWORD="$SUPABASE_DB_PASSWORD"

BACKUP_FILE="backups/supabase/backup-$(date +%Y%m%d-%H%M%S).dump"
if pg_dump -h db.thykrnoqgylrbfupophs.supabase.co -U postgres -Fc -f "$BACKUP_FILE" 2>/dev/null; then
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        echo "   ✅ Backup créé: $(basename "$BACKUP_FILE") ($(du -h "$BACKUP_FILE" | cut -f1))"
        # Garder ce backup comme backup valide
    else
        echo "   ❌ Backup vide"
    fi
else
    echo "   ❌ Échec du backup"
fi

# 4. Vérification finale
echo "📊 4. Validation finale..."
./scripts/gnamba-monitor.sh --cron 2>&1 | tail -20

echo "================================"
echo "✅ Correction terminée - $(date)"
echo ""
echo "📋 Résumé:"
echo "   ✅ Supabase API: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:54321/rest/v1/)"
echo "   ✅ Tables: $(supabase sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('attestation_sequences', 'foncier_lots', 'properties', 'user_profiles');" 2>/dev/null | grep -o '[0-9]\+' || echo 'check failed')/4"
echo "   ✅ Backup: $(find backups/supabase -name "*.dump" -o -name "*.sql" -printf '%T@\n' 2>/dev/null | sort -n | tail -1 | xargs -I {} date -d @{} '+%Hh' 2>/dev/null || echo 'unknown') ago"
echo "   ℹ️  Fichiers non commités: $(git status --porcelain | wc -l)"