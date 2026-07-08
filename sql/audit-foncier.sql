-- audit-foncier.sql
-- Audit cible du module Foncier:
-- - policies RLS
-- - vue de verification publique
-- - index de hash
\pset pager off
\pset tuples_only off
\pset format aligned

\echo '=== FONCIER: OBJETS ET RLS ==='
SELECT
  n.nspname AS schema_name,
  c.relname AS object_name,
  CASE c.relkind
    WHEN 'r' THEN 'table'
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized_view'
    ELSE c.relkind::text
  END AS object_type,
  c.relrowsecurity AS rls_enabled,
  CASE
    WHEN c.relkind = 'v' THEN EXISTS (
      SELECT 1
      FROM pg_options_to_table(c.reloptions) opt
      WHERE opt.option_name = 'security_invoker'
        AND opt.option_value = 'true'
    )
    ELSE NULL
  END AS security_invoker,
  COALESCE(
    string_agg(
      p.polname || ' [' ||
        CASE p.polcmd
          WHEN 'r' THEN 'SELECT'
          WHEN 'a' THEN 'INSERT'
          WHEN 'w' THEN 'UPDATE'
          WHEN 'd' THEN 'DELETE'
          ELSE p.polcmd::text
        END || ']',
      ', ' ORDER BY p.polname
    ),
    '—'
  ) AS policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relname IN (
    'foncier_lots',
    'foncier_attestations',
    'foncier_attestation_temoins',
    'foncier_village_config',
    'user_village_access',
    'v_foncier_attestation_verification'
  )
  AND c.relkind IN ('r', 'v')
GROUP BY n.nspname, c.relname, c.relkind, c.relrowsecurity, c.reloptions
ORDER BY object_type, object_name;

\echo ''
\echo '=== FONCIER: VUE DE VERIFICATION ==='
SELECT
  c.relname AS view_name,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_options_to_table(c.reloptions) opt
      WHERE opt.option_name = 'security_invoker'
        AND opt.option_value = 'true'
    )
    THEN 'true'
    ELSE 'false'
  END AS security_invoker,
  pg_get_viewdef(c.oid, true) AS definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'v_foncier_attestation_verification'
  AND c.relkind = 'v';

\echo ''
\echo '=== FONCIER: INDEX HASH ==='
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'foncier_attestations'
  AND indexname = 'idx_foncier_attestations_hash_sha256';

\echo ''
\echo '=== FONCIER: CHECKLIST RAPIDE ==='
SELECT
  'foncier_attestations' AS object_name,
  EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'foncier_attestations'
      AND c.relrowsecurity = true
  ) AS check_passed
UNION ALL
SELECT
  'v_foncier_attestation_verification' AS object_name,
  EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'v_foncier_attestation_verification'
      AND EXISTS (
        SELECT 1
        FROM pg_options_to_table(c.reloptions) opt
        WHERE opt.option_name = 'security_invoker'
          AND opt.option_value = 'true'
      )
  ) AS check_passed;
