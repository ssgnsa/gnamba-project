-- ============================================================================
-- check-immobilier-schema.sql
-- Usage: psql -f scripts/check-immobilier-schema.sql
-- Ou: copier-coller dans Supabase SQL Editor
-- ============================================================================

-- 1. Vérifier l'existence des tables immobilier
\echo '=== TABLES IMMOBILIER ==='
SELECT table_name, 
       table_schema,
       CASE 
         WHEN table_name = 'locataires' THEN '✅ Table renommée (ex: tenants)'
         WHEN table_name = 'tenants' THEN '⚠️ ANCIENT NOM — migration rename non appliquée !'
         ELSE '✅'
       END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('properties', 'tenants', 'locataires', 'lease_contracts', 'rent_payments')
ORDER BY table_name;

-- 2. Vérifier les colonnes de locataires
\echo '=== COLONNES DE locataires ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'locataires'
ORDER BY ordinal_position;

-- 3. Vérifier les clés étrangères
\echo '=== CLÉS ÉTRANGÈRES IMMOBILIER ==='
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('properties', 'locataires', 'lease_contracts', 'rent_payments')
ORDER BY tc.table_name, kcu.column_name;

-- 4. Vérifier les politiques RLS
\echo '=== POLITIQUES RLS IMMOBILIER ==='
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('properties', 'locataires', 'lease_contracts', 'rent_payments')
ORDER BY tablename, policyname;

-- 5. Vérifier si RLS est activé sur les tables
\echo '=== RLS ACTIVÉ ? ==='
SELECT
  relname AS table_name,
  CASE WHEN relrowsecurity THEN '✅ OUI' ELSE '❌ NON' END AS rls_enabled,
  CASE WHEN relforcerowsecurity THEN '✅ FORCÉ' ELSE '⚪ Non forcé' END AS rls_forced
FROM pg_class
WHERE relname IN ('properties', 'locataires', 'lease_contracts', 'rent_payments')
ORDER BY relname;

-- 6. Vérifier les index
\echo '=== INDEX IMMOBILIER ==='
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('properties', 'locataires', 'lease_contracts', 'rent_payments')
ORDER BY tablename, indexname;

-- 7. Vérifier les triggers
\echo '=== TRIGGERS IMMOBILIER ==='
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('properties', 'locataires', 'lease_contracts', 'rent_payments')
ORDER BY event_object_table, trigger_name;

-- 8. Compteur de lignes par table
\echo '=== NOMBRE DE LIGNES ==='
SELECT 'properties' AS table_name, count(*) AS row_count FROM properties
UNION ALL
SELECT 'locataires', count(*) FROM locataires
UNION ALL
SELECT 'lease_contracts', count(*) FROM lease_contracts
UNION ALL
SELECT 'rent_payments', count(*) FROM rent_payments
ORDER BY table_name;

-- 9. Reload du schema cache PostgREST (conformément à la doc PostgREST)
-- ⚠️ Décommenter uniquement si vous avez une erreur de schema cache
-- \echo '=== RELOAD SCHEMA CACHE POSTGREST ==='
-- NOTIFY pgrst, 'reload schema';

\echo '=== VÉRIFICATION TERMINÉE ==='
