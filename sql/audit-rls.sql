-- audit-rls.sql
-- Liste les objets du schema public sans Row Level Security activé.
SELECT
  n.nspname AS schema_name,
  c.relname AS object_name,
  CASE c.relkind
    WHEN 'r' THEN 'table'
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized_view'
    ELSE c.relkind
  END AS object_type,
  c.relrowsecurity AS row_security
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'v', 'm')
  AND c.relrowsecurity = false
ORDER BY object_type, object_name;
