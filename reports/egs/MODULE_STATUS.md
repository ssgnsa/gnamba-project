# État de santé des Modules

## Foncier
- Date: 2026-10-29
- Statut: CORRECTION EN COURS — non qualifié production-ready
- Détails:
  - Correction de sérialisation réalisée : `ActivityLog.changed_fields` passé de `ARRAY(String)` à `JSON` (modèle `app/models/foncier.py`) + migration Alembic `036_foncier_activity_logs_json.py` (tête de chaîne). Motif : portabilité du schéma de test SQLite (le DDL de test crée `changed_fields TEXT` et ne peut lier une liste Python à une colonne TEXT). PostgreSQL conserve un comportement fonctionnel via JSON.
  - Migration 036 VÉRIFIÉE sur PostgreSQL isolé (base `egs_foncier_migration_test`, désormais supprimée) : upgrade 035→036 et downgrade 036→035 exécutés avec succès, intégrité des données conservée (NULL, tableau vide, éléments simples, accents/guillemets/caractères spéciaux), lecture-écriture sur la colonne JSON confirmée, chaîne Alembic intacte (head = 036).
  - Deux bogues découverts et corrigés dans la migration 036 lors des tests PostgreSQL :
    * `postgresql_using="changed_fields::json"` invalide (`cannot cast type text[] to json`) → corrigé en `to_json(changed_fields)`.
    * `postgresql_using="array(SELECT ...)"` invalide en clause USING (sous-interdite) → corrigé par une expression scalaire `regexp_replace(...)::text[]`.
  - Tests annoncés passants : 24 tests `test_foncier_security.py` (24 passed, 0 skipped, 0 failed). Suite foncier complète (3 fichiers) : 29 passed, 1 skipped, 0 failed. Résultat obtenu sur la base de test SQLite isolée du dépôt.
  - Suite backend complète : 242 passed, 0 failed, 15 skipped (tests exécutés le 2026-10-30, base SQLite isolée).
  - Intégration Postgrexion : VÉRIFIée pour la migration 036 (upgrade/downground, intégrité des données, lecture-écriture).
  - Réception métier : NON réalisée. Les 4 points OPEN du registre `docs/audit/ARBITRAGES-METIER-RESTANTS.md` restent en attente (CSV import/export, PDF attestation, export audit, conflits de sync). La matrice de permissions est partiellement implémentée (foncier.validate/archive/deliver/revoke + foncier.access.manage admin).
  - Aptitude à la production : NON confirmée. Les dépendances essentielles, autorisations et preuves d'exploitation restent ouvertes tant que les arbitrages métier ne sont pas rendus.
- Routes maintenues en 501 / HOLD (en attente d'arbitrage métier) : import CSV lots, export CSV lots, génération/téléchargement PDF officiel, export audit PDF/CSV, résolution de conflit sync.
- Tests: 29 passed, 1 skipped, 0 failed sur la suite Foncier (SQLite isolé). Migration 036 vérifiée sur PostgreSQL isolé.
