-- ============================================
-- NETTOYAGE BASE DE DONNÉES FONCIER
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- IMPORTANT: Sauvegardez votre base avant d'exécuter ce script !
-- Exécutez d'abord la section "AUDIT" pour voir ce qui va être supprimé.

-- ============================================
-- 1. AUDIT - VOIR LES DONNÉES AVANT SUPPRESSION
-- ============================================

-- Compter les enregistrements dans chaque table
SELECT 'foncier_lots' as table_name, COUNT(*) as total, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as soft_deleted FROM foncier_lots
UNION ALL
SELECT 'foncier_attestations', COUNT(*), COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) FROM foncier_attestations
UNION ALL
SELECT 'foncier_attestation_temoins', COUNT(*), 0 FROM foncier_attestation_temoins
UNION ALL
SELECT 'foncier_villages', COUNT(*), 0 FROM foncier_villages
UNION ALL
SELECT 'foncier_lotissements', COUNT(*), 0 FROM foncier_lotissements
UNION ALL
SELECT 'foncier_ilots', COUNT(*), 0 FROM foncier_ilots
UNION ALL
SELECT 'foncier_village_config', COUNT(*), 0 FROM foncier_village_config
UNION ALL
SELECT 'user_village_access', COUNT(*), 0 FROM user_village_access
UNION ALL
SELECT 'foncier_audit', COUNT(*), 0 FROM foncier_audit
UNION ALL
SELECT 'v_foncier_attestation_verification (view)', COUNT(*), 0 FROM v_foncier_attestation_verification;

-- Voir les lots par village (pour référence)
SELECT village, COUNT(*) as nb_lots
FROM foncier_lots
WHERE deleted_at IS NULL
GROUP BY village
ORDER BY nb_lots DESC;


-- ============================================
-- 2. OPTION A: NETTOYAGE COMPLET (TOUT SUPPRIMER)
-- ============================================
-- DÉCOMMENTEZ LES LIGNES CI-DESSOUS POUR EXÉCUTER
-- ATTENTION: IRRÉVERSIBLE !

/*
-- Désactiver les contraintes temporairement pour suppression en cascade
-- (Pas nécessaire si on supprime dans le bon ordre)

-- 1. Supprimer les témoins d'attestation (enfants de foncier_attestations)
DELETE FROM foncier_attestation_temoins;

-- 2. Supprimer les attestations (enfants de foncier_lots via lot_id)
DELETE FROM foncier_attestations;

-- 3. Supprimer les logs d'audit
DELETE FROM foncier_audit;

-- 4. Supprimer les lots (table principale)
DELETE FROM foncier_lots;

-- 5. Supprimer les îlots (enfants de lotissements)
DELETE FROM foncier_ilots;

-- 6. Supprimer les lotissements (enfants de villages)
DELETE FROM foncier_lotissements;

-- 7. Supprimer les villages
DELETE FROM foncier_villages;

-- 8. Supprimer la configuration village
DELETE FROM foncier_village_config;

-- 9. Supprimer les accès utilisateur village
DELETE FROM user_village_access;

-- Réinitialiser les séquences si nécessaire (pour les IDs auto-incrémentés)
-- SELECT setval(pg_get_serial_sequence('foncier_villages', 'id'), 1, false);
-- etc.
*/


-- ============================================
-- 3. OPTION B: NETTOYER SEULEMENT LES LOTS (GARDER VILLAGES/LOTISSEMENTS)
-- ============================================
-- DÉCOMMENTEZ POUR EXÉCUTER

/*
-- Supprimer les données liées aux lots uniquement
DELETE FROM foncier_attestation_temoins;
DELETE FROM foncier_attestations;
DELETE FROM foncier_audit;
DELETE FROM foncier_lots;
*/


-- ============================================
-- 4. OPTION C: NETTOYER SEULEMENT LES ENREGISTREMENTS SOFT-DELETED (ARCHIVÉS)
-- ============================================
-- DÉCOMMENTEZ POUR EXÉCUTER

/*
-- Supprimer définitivement les lots archivés (deleted_at IS NOT NULL)
DELETE FROM foncier_attestation_temoins
WHERE attestation_id IN (SELECT id FROM foncier_attestations WHERE deleted_at IS NOT NULL);

DELETE FROM foncier_attestations WHERE deleted_at IS NOT NULL;
DELETE FROM foncier_lots WHERE deleted_at IS NOT NULL;
DELETE FROM foncier_audit WHERE lot_id IN (SELECT id FROM foncier_lots WHERE deleted_at IS NOT NULL);
*/


-- ============================================
-- 5. OPTION D: NETTOYER PAR VILLAGE SPÉCIFIQUE
-- ============================================
-- Remplacez 'NOM_DU_VILLAGE' par le village à nettoyer
-- DÉCOMMENTEZ ET MODIFIEZ POUR EXÉCUTER

/*
WITH lots_to_delete AS (
    SELECT id FROM foncier_lots WHERE village = 'NOM_DU_VILLAGE'
)
DELETE FROM foncier_attestation_temoins
WHERE attestation_id IN (SELECT id FROM foncier_attestations WHERE lot_id IN (SELECT id FROM lots_to_delete));

WITH lots_to_delete AS (
    SELECT id FROM foncier_lots WHERE village = 'NOM_DU_VILLAGE'
)
DELETE FROM foncier_attestations WHERE lot_id IN (SELECT id FROM lots_to_delete);

DELETE FROM foncier_audit WHERE lot_id IN (SELECT id FROM foncier_lots WHERE village = 'NOM_DU_VILLAGE');

DELETE FROM foncier_lots WHERE village = 'NOM_DU_VILLAGE';
*/


-- ============================================
-- 6. VÉRIFICATION APRÈS NETTOYAGE
-- ============================================
-- Exécutez cette section après le nettoyage pour confirmer

/*
SELECT 'foncier_lots' as table_name, COUNT(*) as remaining FROM foncier_lots
UNION ALL
SELECT 'foncier_attestations', COUNT(*) FROM foncier_attestations
UNION ALL
SELECT 'foncier_attestation_temoins', COUNT(*) FROM foncier_attestation_temoins
UNION ALL
SELECT 'foncier_villages', COUNT(*) FROM foncier_villages
UNION ALL
SELECT 'foncier_lotissements', COUNT(*) FROM foncier_lotissements
UNION ALL
SELECT 'foncier_ilots', COUNT(*) FROM foncier_ilots
UNION ALL
SELECT 'foncier_village_config', COUNT(*) FROM foncier_village_config
UNION ALL
SELECT 'user_village_access', COUNT(*) FROM user_village_access
UNION ALL
SELECT 'foncier_audit', COUNT(*) FROM foncier_audit;
*/

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 1. Les suppressions respectent l'ordre des clés étrangères :
--    temoins -> attestations -> lots -> ilots -> lotissements -> villages
-- 2. Si vous avez des politiques RLS, assurez-vous d'être authentifié avec un rôle admin
-- 3. Pour Supabase Cloud, utilisez l'éditeur SQL dans le dashboard
-- 4. Pour Supabase Local: `supabase db shell` puis copier-coller le script
-- 5. Les vues (v_foncier_attestation_verification) se mettent à jour automatiquement
-- 6. N'oubliez pas de vider le cache de l'application après nettoyage

-- ============================================
-- NETTOYAGE CACHE APPLICATION (si nécessaire)
-- ============================================
-- Si vous utilisez le mode hors-ligne, videz aussi le localStorage:
-- localStorage.clear(); // Dans la console navigateur
-- Ou spécifiquement:
-- localStorage.removeItem('foncier_offline_lots');
-- localStorage.removeItem('foncier_offline_queue');