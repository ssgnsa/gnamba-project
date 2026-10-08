# PHASE 3.3.1

## 1. Verdict

**NO-GO pour la suite.** Le bloc Media a été prouvé de bout en bout après une correction minimale : vrai login/JWT, route FastAPI, service/repository concrets, PostgreSQL, audit serveur et nettoyage. Les refus anonymes/non autorisés et accès testés passent. La validation métier définitive de la politique employés/gestionnaires manque; la consigne interdit de transformer le mapping technique temporaire en décision métier.

## 2. Baseline

La capture avant toute modification est [SITE-VITRINE-PHASE3.3.1-BASELINE.txt](SITE-VITRINE-PHASE3.3.1-BASELINE.txt). Branche `audit/fix-schema-site`, HEAD `634938c8`. Plusieurs changements Phase 3.3, Phase 3.2 et Foncier existaient déjà. Aucun n'a été écrasé. La Phase 3.3.1 a modifié une logique applicative Media directement concernée et ajouté ce rapport, la matrice métier et les preuves live.

## 3. Contrat Media réel

| Method / path | Auth / permission | Payload / réponse | Persistance / audit |
|---|---|---|---|
| `POST /api/v1/media` | Bearer JWT via `get_current_user`; `media/create` (admin selon la policy courante) | multipart `file` requis, `category`, `alt_text`, `description`, `tags`, `metadata`; réponse Media avec id, URLs, taille, acteur d'upload, hash | fichier via `StorageProvider`; ligne `media_files`; depuis cette correction, `media_audit_logs` action `upload`, acteur JWT et métadonnées dans la même transaction PostgreSQL |
| `GET /api/v1/media/{id}` | JWT; `media/read_private` | objet Media ou 404 | lecture `media_files` |
| `GET /api/v1/media/audit?media_id=...` | JWT; `media/read_audit` (admin) | liste action/acteur/métadonnées | lecture `media_audit_logs` |

Table PostgreSQL vérifiée : `media_files` et `media_audit_logs`; `media_usage` et `media_versions` n'ont pas été touchées par l'upload de test. L'identifiant acteur du fichier (`uploaded_by`) et du log (`actor_id`) est fourni côté serveur depuis l'utilisateur authentifié. Aucun changement de schéma.

## 4. Test Media anonyme

Sur le vrai endpoint avec service concret : GET et POST upload anonymes retournent chacun `401`. Détails et timestamp dans [backend/PHASE3.3.1-MEDIA-LIVE-TESTS.txt](backend/PHASE3.3.1-MEDIA-LIVE-TESTS.txt).

## 5. Test Media non autorisé

JWT réels délivrés par `/auth/login` à des comptes temporaires créés et supprimés via l'API locale : employé GET/upload `403`; gestionnaire upload `403`. Le gestionnaire a `GET /media` `200` selon la policy temporaire.

## 6. Test Media autorisé avec JWT réel

Le compte admin local a obtenu un JWT via login réel; upload `POST /api/v1/media` `200`; relecture `GET /api/v1/media/{id}` `200`; lecture de son événement par l'API audit `200`. Les identifiants d'accès et tokens ne sont pas consignés.

## 7. Preuve PostgreSQL

Base ciblée `egs_local` sur PostgreSQL local. Le test vérifie l'absence du marqueur avant l'upload, puis la présence de la ligne avec `original_name`, taille, SHA-256 et `uploaded_by` conformes à l'opération réelle. Les données complètes du test et son timestamp sont dans l'artefact live.

## 8. Preuve audit log

Le premier parcours avant correction avait produit zéro ligne d'audit : le défaut était confirmé dans PostgreSQL et dans le code. Après correction, PostgreSQL contient une ligne `action=upload`, avec `actor_id` égal à l'ID du vrai admin et les métadonnées du fichier; `GET /api/v1/media/audit?media_id={id}` la relit avec HTTP 200. Le test n'utilise pas un appel manuel à `POST /audit` pour simuler l'événement.

Classification de l'échec initial : **REPOSITORY**, cause confirmée (insert d'audit absent après l'insert Media). Correction minimale : ajout d'un événement `upload` dans la même transaction qui insère `media_files`; aucun changement de table ni de schéma.

## 9. Cleanup

Après vérification, les lignes de test Media/audit, les comptes temporaires et leurs entités ont été supprimés; les comptes, lignes Media/audit sont absents en SQL. Le répertoire local temporaire est supprimé. Pas de modification de données métier préexistantes.

## 10. Politique Employé

Le rôle exact est `employe`, lu en base lors de la validation JWT. État serveur testé : pas de lecture Media privée, pas d'upload, pas d'action CMS/layout privée. GET/POST Media testés avec vrai JWT et refusés (`403`). La validation métier définitive reste à confirmer.

## 11. Politique Gestionnaire

Le rôle exact est `gestionnaire`, lu en base lors de la validation JWT. État serveur testé : lecture Media autorisée, upload et publication layout refusés (`403`); `/tables/app_settings` refusé (`403`). Le compte employé/gestionnaire de test était temporaire et authentifié réellement. La base ne contenait aucun gestionnaire avant ce test. L'approbation métier finale et l'allowlist `/tables` restent à confirmer.

## 12. Politique Administrateur

Le compte `admin` existant a obtenu un JWT par `/auth/login`. Upload Media réussi, acteur vérifié dans PostgreSQL, audit relu par API. Le guard central autorise toutes les actions exposées des routes qui l'utilisent.

## 13. Tests RBAC

Résultats HTTP réels : anonyme GET/upload `401/401`; employé GET/upload `403/403`; gestionnaire GET/upload `200/403`; admin upload/read `200/200`. Les identités de test non-admin, provisionnées via l'API admin puis authentifiées par login réel, ont aussi reçu `403` pour les suppressions Media/table, la suppression lot et la publication layout. Les comptes temporaires ont été nettoyés.

## 14. Tests d'escalade

Employé vers lecture/upload/suppression Media, publication layout et suppression générique `/tables` : refus `403`; gestionnaire vers upload/suppression Media, suppression lot, publication layout et accès générique `/tables/app_settings` : refus `403`. Ces requêtes utilisent des ressources inexistantes pour vérifier le guard avant l'accès au repository. Aucune escalade démontrée dans ce périmètre. L'allowlist complète expose encore des données potentiellement sensibles aux gestionnaires et exige validation métier.

## 15. TypeScript

`npm run typecheck -- --pretty false` : baseline stable à 35 erreurs préexistantes, sans source TypeScript modifiée en Phase 3.3.1. Détails et comparaison avec [TYPECHECK-BASELINE-PHASE3.3.txt](TYPECHECK-BASELINE-PHASE3.3.txt). Erreurs hors périmètre, non corrigées.

## 16. Backend tests

Les 19 tests ciblés de Phase 3.3 sont relancés après la correction. Les 5 tests Media ciblés passent. Avertissements existants de dépréciation Python/SQLAlchemy/FastAPI seulement.

## 17. Compileall

`python -m compileall -q backend` : PASS.

## 18. Build

`npm run build` : PASS. Avertissements Vite existants sur imports dynamiques Foncier, aucune erreur de build.

## 19. Fichiers modifiés

- `backend/app/infrastructure/sqlalchemy_media_repository.py` : ajout atomique de l'événement serveur `upload` dans la transaction qui insère la ligne Media; aucune modification de schéma.
- `SITE-VITRINE-PHASE3.3.1-BASELINE.txt`
- `SITE-VITRINE-RBAC-METIER.md`
- `SITE-VITRINE-PHASE3.3.1-MEDIA-RBAC.md`
- `backend/PHASE3.3.1-MEDIA-LIVE-TESTS.txt`

Les autres fichiers déjà modifiés/non suivis sont hérités, comme détaillé dans la baseline; ils n'ont pas été réécrits.

## 20. Risques restants

- La policy manager lit une allowlist générique `/tables` comprenant des tables à données potentiellement sensibles, sans portée par ligne.
- La décision métier employé/gestionnaire/admin et l'allowlist n'ont pas d'approbation métier formelle dans les sources EGS.
- L'initialisation normale de `SqlAlchemyMediaRepository` exécute toujours du DDL (`CREATE TABLE`/`ALTER TABLE`) à l'instanciation. Pour respecter l'interdiction de DDL, la preuve HTTP a injecté le service/repository concrets sans appeler cet initialiseur; les méthodes réellement testées ont accédé au vrai PostgreSQL. Le problème de DDL runtime reste hors correction dans cette phase.
- Le drift Alembic demeure ouvert.
- 35 diagnostics TypeScript préexistants restent.

## 21. Blockers

- Décision métier du responsable sur les permissions employé/gestionnaire et revue des tables de l'allowlist gestionnaire.
- Analyse/réconciliation Alembic dans une phase dédiée.
- Dette TypeScript préexistante si un typecheck vert devient exigence de livraison.

## 22. Verdict final

Le bloc Media est PASS après correction et preuve PostgreSQL/audit réelle. Le RBAC technique testé est cohérent avec la policy codée et aucun bypass n'a été démontré sur les routes testées. La validation métier demeure explicitement non définie dans une source EGS et conditionne la suite : **NO-GO**. Phase 4 non commencée.

```text
========================================
PHASE 3.3.1 — RESULTAT
========================================

MEDIA ANONYME : PASS
MEDIA NON AUTORISÉ : PASS
MEDIA AUTORISÉ JWT RÉEL : PASS
POSTGRESQL : PASS
AUDIT LOG : PASS

RBAC EMPLOYÉ : PARTIEL
RBAC GESTIONNAIRE : PARTIEL
RBAC ADMIN : PASS
ESCALADE : PASS

TYPESCRIPT : STABLE (35 erreurs préexistantes)
BACKEND TESTS : PASS
COMPILEALL : PASS
BUILD : PASS

ALEMBIC : NON TRAITÉ
PAGE BUILDER : NON TRAITÉ

VERDICT : NO-GO

BLOCKERS :
- validation métier de la distinction employés/gestionnaires et de l'allowlist /tables;
- drift Alembic ouvert;
- 35 erreurs TypeScript préexistantes.

NEXT STEP :
- obtenir la décision métier RBAC;
- traiter le drift Alembic dans une phase dédiée;
- ne pas commencer la Phase 4.
```
