#!/bin/bash
# =============================================================================
# RESTORE DATABASE FROM MIGRATIONS - ORDERED APPROACH
# Appliquer les migrations dans le bon ordre pour éviter les dépendances
# =============================================================================

set -euo pipefail

PROJECT_ROOT="/home/soma/gnamba-project"
cd "${PROJECT_ROOT}"

echo "🔄 Restauration ordonnée de la base de données..."
echo "=================================================="

# 1. Arrêter Supabase et nettoyer
echo "1️⃣  Nettoyage..."
supabase stop 2>/dev/null || true
sleep 3
docker volume rm -f supabase_db_gnamba-project supabase_storage_gnamba-project 2>/dev/null || true
sleep 2

# 2. Démarrer Supabase avec base vierge
echo "2️⃣  Démarrage base vierge..."
supabase start --ignore-health-check 2>&1 | grep -E "Starting|database|schema" | tail -5
sleep 15

# 3. Appliquer les migrations de base d'abord (celles qui créent user_profiles)
echo "3️⃣  Application migrations de base..."

# Liste des migrations de base (dans l'ordre)
BASE_MIGRATIONS=(
    "20260326000000_create_foncier_attestations_tables.sql"
    "20260330000000_fix_unique_constraint.sql"
    "20260401080000_fix_foncier_attestations.sql"
    "20260401090000_foncier_attestation_reference_archive.sql"
    "20260402080000_create_immobilier_tables.sql"
    "20260402090000_fix_tenants_schema.sql"
    "20260404080000_fix_rls_policies_foncier_attestations.sql"
    "20260404110000_align_immobilier_schema.sql"
    "20260405120000_rename_tenants_to_locataires.sql"
    "20260405130000_add_comprehensive_rls_policies.sql"
    "20260405140000_create_lead_capture_system.sql"
    "20260405150000_create_foncier_base_tables_and_rpc.sql"
    "20260405160000_fix_lease_contracts_fk_and_cleanup_rls.sql"
    "20260407000000_fix_foncier_lots.sql"
    "20260408010000_add_foncier_lots_deleted_at.sql"
    "20260408020000_idx_foncier_lots_deleted_at.sql"
    "20260408030000_current_user_role_fn.sql"
    "20260408040000_rename_tenants_table.sql"
    "20260408050000_rename_lease_contracts_tenant_col.sql"
    "20260408060000_rename_rent_payments_tenant_col.sql"
    "20260408070000_rls_lease_contracts.sql"
    "20260408080000_rls_rent_payments.sql"
    "20260408090000_rls_properties.sql"
    "20260408100000_rls_locataires.sql"
    "20260408120000_rls_critical_tables.sql"
    "20260409000001_add_rls_business_tables.sql"
    "20260409000002_fix_security_definer_functions.sql"
    "20260409140000_fix_user_profiles_email.sql"
    "20260428000003_migrate_tenants_to_locataires.sql"
)

# Appliquer chaque migration de base
for migration in "${BASE_MIGRATIONS[@]}"; do
    if [ -f "supabase/migrations/$migration" ]; then
        echo "   📄 Appliquant: $migration"
        if supabase db push --file "supabase/migrations/$migration" 2>&1 | grep -q "ERROR"; then
            echo "   ❌ Erreur sur $migration - continuant..."
        else
            echo "   ✅ $migration OK"
        fi
    else
        echo "   ⚠️  Migration non trouvée: $migration"
    fi
done

# 4. Réactiver et appliquer les migrations restantes
echo "4️⃣  Réactivation migrations restantes..."
find supabase/migrations -name "*.skip" -exec mv {} {%.skip}.sql \; 2>/dev/null || true

echo "5️⃣  Application migrations restantes..."
supabase db push 2>&1 | tail -10

# 5. Vérification finale
echo "6️⃣  Vérification tables..."
for table in attestation_sequences foncier_lots properties user_profiles; do
    if supabase sql "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='$table');" 2>/dev/null | grep -q "t"; then
        echo "   ✅ Table $table existe"
    else
        echo "   ❌ Table $table manquante"
    fi
done

echo ""
echo "✅ Restauration terminée"
echo "🔍 Vérification API..."
curl -s -o /dev/null -w "API Status: %{http_code}\n" http://localhost:54321/rest/v1/