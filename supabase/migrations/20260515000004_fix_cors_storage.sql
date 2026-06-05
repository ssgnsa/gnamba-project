-- ============================================
-- Fix CORS pour Supabase Storage
-- Date: 2026-05-15
-- ============================================
-- NOTE: La configuration CORS de Supabase Storage n'est PAS
-- gérée via SQL. Elle se configure dans:
--   Supabase Dashboard > Storage > Buckets > [bucket] > CORS
-- ou via l'API REST:
--   PATCH https://api.supabase.com/v1/projects/{ref}/storage/buckets/{bucket}
--   Body: {"cors_origins": ["*"]}
--
-- Cette migration est un no-op intentionnel.
-- Les policies RLS existent dans 20260509180000_fix_storage_rls_policies.sql
-- La correction OpaqueResponseBlocking est faite côté client (SafeImage.tsx)
-- ============================================

SELECT 'CORS doit etre configure via le Dashboard Supabase Storage' AS info;
