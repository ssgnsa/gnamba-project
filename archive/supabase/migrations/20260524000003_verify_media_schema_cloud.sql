-- ============================================================
-- Script de vérification manuelle.
-- Ne doit pas exécuter de requêtes bloquantes dans la chaîne de migrations.
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'Skipping 20260524000003_verify_media_schema_cloud.sql: manual verification script only';
END $$;
