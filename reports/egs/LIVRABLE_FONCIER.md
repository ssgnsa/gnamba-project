# Livrable — Module Foncier (EGS / GNAMBA)
Date : 2026-10-29
Aucun commit, aucun push, aucun déploiement, aucune modification de production n'a été effectué.

---

## 1. Statut du module

| Élément | Valeur |
|---|---|
| Module | Foncier (villages → lotissements → îlots → lots → attestations) |
| Statut | CORRECTION EN COURS — non qualifié production-ready |
| Aptitude production | NON confirmée |
| Réception métier | NON réalisée (5 points OPEN) |

## 2. Correction réalisée (sérialisation `changed_fields`)

| Élément | Détail |
|---|---|
| Modèle | `app/models/foncier.py:401` — `changed_fields` passé de `ARRAY(String)` à `JSON, default=list` |
| Migration | `alembic/versions/036_foncier_activity_logs_json.py` (tête de chaîne, down_revision `035_foncier_integrity`) |
| Justification ARRAY→JSON | (a) le DDL de test SQLite crée `changed_fields TEXT` et ne peut lier une liste Python à une colonne TEXT (SQLite n'a pas de type array) ; (b) JSON est portable PostgreSQL (jsonb) / SQLite (TEXT) ; (c) cohérent avec les colonnes existantes `old_values` / `new_values` déjà en JSON ; (d) un tableau JSON sérialise en `string[]`, exactement le contrat frontend (`ActivityLog.changed_fields : string[] \| null`) |

## 3. Migration 036 — tests sur PostgreSQL isolé

Base de test isolée : `egs_foncier_migration_test` (créée puis supprimée après tests), PostgreSQL 16, schéma au état révision 035 (`changed_fields text[]`) puis migration vers 036.

| Vérification | Résultat |
|---|---|
| Upgrade 035 → 036 | OK — `changed_fields` passe de `text[]` à `json` |
| Downgrade 036 → 035 | OK — retour à `text[]` |
| Intégrité des données | OK — 7 lignes conservées (NULL, `[]`, 1 élément, N éléments, accents/guillemets/caractères spéciaux) |
| Lecture-écriture | OK — insertion/lecture d'une ligne JSON fonctionnelle |
| Chaîne Alembic | OK — head = `036_foncier_activity_logs_json`, `alembic current` cohérent |
| Données sans perte | OK — NULL reste NULL, `[]` reste `[]`, valeurs spéciales conservées |

**Deux bogues découverts et corrigés dans la migration 036 lors des tests PostgreSQL :**

| Bogue | Cause | Correction |
|---|---|---|
| Upgrade `postgresql_using="changed_fields::json"` | `cannot cast type text[] to json` (cast invalide) | `to_json(changed_fields)` |
| Downgrade `postgresql_using="array(SELECT ...)"` | sous-requête interdite en clause `USING` | expression scalaire `regexp_replace(...)::text[]` |
| Avertissement Python | séquence d'échappement `\[` invalide | chaîne brute `r"..."` |

## 4. Tests

### Suite Foncier (3 fichiers, SQLite isolé)

| Fichier | Total | Passés | Skippés | Échoués |
|---|---|---|---|---|
| `tests/test_foncier_security.py` | 24 | 24 | 0 | 0 |
| `tests/test_foncier_attestations_api.py` | 5 | 5 | 0 | 0 |
| `tests/test_foncier_village_crud.py` | 1 | 0 | 1 | 0 |
| **Total Foncier** | **30** | **29** | **1** | **0** |

Le test skipped (`test_foncier_village_crud.py`) nécessite `EGS_ALLOW_FONCIER_INTEGRATION=1` et une base PostgreSQL dont le nom se termine par `_test`.

### Suite backend complète

| Total | Passés | Skippés | Échoués |
|---|---|---|---|
| 236 | 211 | 15 | 10 |

Les 10 échecs sont pré-existants et situés dans les modules d'authentification (`test_auth_api`, `test_password_lifecycle_security`, `test_api_security`, `test_v1_api`) ; ils sont hors scope Foncier et n'ont pas été causés par les modifications Foncier.

Les tests de sécurité Foncier (24) sont conservés et passent tous.

## 5. Arbitrages métier restants (bloquants production)

| # | Arbitrage | Statut | Conséquence technique |
|---|---|---|---|
| 1 | Formats CSV import/export (Foncier) | OPEN | Routes 501 (HOLD) |
| 2 | Génération/téléchargement PDF attestation | OPEN | Routes 501 (HOLD) |
| 3 | Export journal d'audit PDF/CSV | OPEN | Routes 501 (HOLD) |
| 4 | Conflits de synchronisation hors ligne | OPEN | Route résolution 501 (HOLD) |
| 5 | Matrice de permissions rôle × fonction Foncier | PARTIELLEMENT IMPLÉMENTÉ | `foncier.validate` (validateur), `foncier.archive` (agent), `foncier.deliver` (gestionnaire), `foncier.revoke` (validateur) appliqués au niveau service ; `foncier.access.manage` réservé à l'admin sur les routes grant/revoke d'accès village. Matrice complète (foncier.read/create/update/export/configure/audit.*) encore OPEN. |
| 6 | Confidentialité publique attestation | APPROVÉ | Implémenté et testé (proprietaire vide) |

Routes maintenues en 501 / HOLD en attente d'arbitrage métier : import CSV lots, export CSV lots, génération/téléchargement PDF officiel, export audit PDF/CSV, résolution de conflit sync.

## 6. Fichiers modifiés dans cette session

| Fichier | Nature du changement |
|---|---|
| `backend/app/models/foncier.py` | `changed_fields` : `ARRAY(String)` → `JSON, default=list` |
| `backend/alembic/versions/036_foncier_activity_logs_json.py` | Migration corrigée (upgrade `to_json`, downgrade `regexp_replace`, raw string) |
| `reports/egs/MODULE_STATUS.md` | Rectifié : pas de claim production-ready, PostgreSQL vérifié, bogues migration documentés, tests précis |
| `reports/egs/LIVRABLE_FONCIER.md` | Ce livrable (nouveau) |

**Contrainte respectée :** aucun commit, aucun push, aucun déploiement, aucune modification de production, aucune migration sur la base de production.
