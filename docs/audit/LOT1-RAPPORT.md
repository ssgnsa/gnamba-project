# LOT 1 — Rapport forensic read-only

> **BROUILLON — NON VALIDÉ.** Ce document constate l’état observé au 2026-10-08. Il ne constitue ni une autorisation de migration, ni une décision de conservation/suppression.

## Décision

**LOT 1 — NON VALIDÉ.** Aucune migration, génération de migration, correction de schéma, suppression ou écriture en base n’a été exécutée. Toute différence constatée reste à qualifier avant décision.

Le fait que la révision Alembic courante soit égale à la tête ne prouve pas que PostgreSQL corresponde à la metadata SQLAlchemy.

| Domaine | Statut | Preuve / limite |
|---|---|---|
| DB / Alembic | PARTIAL — anomalie importante | 23 tables DB-only, écarts substantiels; qualification table par table requise |
| Auth / RBAC | PARTIAL | Dépendances backend présentes; matrice exhaustive routes/permissions/frontend non établie |
| Tests | DONE | Backend `pytest` exit 0; Vitest 37/37 fichiers et 131/131 tests; skips backend identifiés |
| Legacy / code mort | PARTIAL | Adaptateur `dbClient.service` / `tableClient` encore utilisé; classification exhaustive non établie |
| Git | À préserver | Changements préexistants laissés intacts |

## Périmètre et provenance

L’inspection a porté sur la base `egs_local`, schéma `public`, via le conteneur API actif. Les requêtes de comptage et d’inspection étaient des lectures. Les comptages initiaux via le rôle applicatif ont rencontré `permission denied` sur `immobilier_reference_counters`; ils ont été repris par `SELECT count(*)` depuis le conteneur PostgreSQL avec le rôle `postgres`. Aucun contenu métier n’a été lu.

La recherche des usages a couvert `src/`, `backend/app/`, `backend/alembic/`, `backend/tests/`, `scripts/`, `sql/`, `docker/`, `archive/`, `supabase/`, `docs/` et `reports/`, en excluant dépendances vendored et fichiers de sauvegarde. Les noms figurant dans une route générique ou dans un alias frontend sont signalés comme tels; une occurrence textuelle ne prouve pas à elle seule qu’un workflow réussit.

### Tables présentes uniquement dans PostgreSQL

`alembic_version` est exclue du décompte des 23 objets applicatifs ci-dessous. Le statut « aucune référence détectée » ne signifie pas « inutile ». Chaque décision de refonte devra être explicitement classée GARDER, SUPPRIMER ou À DÉCIDER; aucune suppression n’est autorisée par ce rapport.

| Table | Lignes | Statut / preuves courantes | Dernière migration ou script repéré |
|---|---:|---|---|
| `app_settings_old` | 2 | Aucune référence d’exécution/script trouvée; citée par `docs/audit/DATABASE_MAP.md` seulement | Aucune trouvée |
| `app_settings_test` | 2 | Aucune référence d’exécution/script trouvée; citée par `docs/audit/DATABASE_MAP.md` seulement | Aucune trouvée |
| `campagnes_marketing` | 0 | Référence runtime dans l’allowlist générique et frontend (`src/data/client.ts`, `src/data/leads.repository.ts`); les requêtes génériques sont soumises à la politique `erp_table` | Aucune trouvée dans Alembic |
| `documents` | 0 | Route frontend `/tables/documents`, allowlist backend et usage vitrine; le modèle `public_site.py` contient aussi un champ `documents`, qui n’est pas une preuve de table distincte | `backend/alembic/versions/031_contract_v2_products_finance.py` (dernière mention textuelle détectée) |
| `finance_exchange_rates` | 0 | Référencée par `eg_finance_contract_guard`, déclenchée sur `finances` | `backend/alembic/versions/031_contract_v2_products_finance.py` |
| `foncier_audit` | 0 | Référence script uniquement dans `scripts/clean-foncier-database.sql`; ce script contient des `DELETE` et n’a pas été exécuté | `scripts/clean-foncier-database.sql` |
| `foncier_audit_old` | 0 | Aucune référence d’exécution/script trouvée; documentation d’inventaire seulement | Aucune trouvée |
| `foncier_items` | 0 | Alias frontend dans `src/data/tableClient.ts` vers `/foncier`; aucune preuve que cet alias accède à la table SQL homonyme | Aucune trouvée |
| `foncier_items_old` | 0 | Aucune référence d’exécution/script trouvée; documentation d’inventaire seulement | Aucune trouvée |
| `foncier_lots_old` | 0 | Aucune référence d’exécution/script trouvée; documentation d’inventaire seulement | Aucune trouvée |
| `foncier_villages_old` | 0 | Aucune référence d’exécution/script trouvée; documentation d’inventaire seulement | Aucune trouvée |
| `immobilier_reference_counters` | 0 | Utilisée par `eg_immobilier_next_reference`, appelée depuis la garde de propriétés; pas d’accès direct autorisé au rôle API | `backend/alembic/versions/032_immobilier_v2_contract.py` |
| `immobilier_statut_transitions` | 18 | Lecture runtime dans `backend/app/api/v1/immobilier/properties_router.py`; test PostgreSQL présent | `backend/alembic/versions/032_immobilier_v2_contract.py` |
| `immobilier_types_bien` | 17 | Référentiel lu par `eg_immobilier_type_label`; FK active depuis `properties` | `backend/alembic/versions/032_immobilier_v2_contract.py` |
| `opportunites` | 0 | Allowlist backend et références frontend (`src/data/publicLots.repository.ts`); appels génériques soumis à `erp_table` | Aucune trouvée dans Alembic |
| `page_layouts_backup_20260827` | 38 | Aucune référence d’exécution/script trouvée; documentation d’inventaire seulement | Aucune trouvée |
| `page_layouts_canonical_20260827` | 1 | Aucune référence d’exécution/script trouvée; documentation d’inventaire seulement; contenu à examiner avant décision | Aucune trouvée |
| `properties_audit` | 0 | Journal utilisé par les triggers d’audit; tests PostgreSQL présents | `backend/alembic/versions/032_immobilier_v2_contract.py` |
| `ref_counters` | 0 | Utilisée par `eg_next_reference` / règles de référence produits | `backend/alembic/versions/031_contract_v2_products_finance.py` |
| `social_posts` | 0 | Allowlist backend et références frontend (`src/data/social.repository.ts`, `src/lib/social-publish.ts`); accès générique soumis à `erp_table` | Aucune trouvée dans Alembic |
| `ventes_foncieres` | 0 | Références runtime dans les routes RPC/tables et le frontend | Aucune trouvée dans Alembic |
| `visites` | 0 | Références runtime RPC/tables, frontend et fichier `backend/app/models/visits.py`; ce modèle n’est pas enregistré dans la metadata inspectée | Aucune trouvée dans Alembic |
| `visites_terrain` | 0 | Références runtime RPC/tables et frontend | Aucune trouvée dans Alembic |

Les comptages directs donnent **17 tables à zéro ligne** et 6 non vides (`app_settings_old` 2, `app_settings_test` 2, `immobilier_statut_transitions` 18, `immobilier_types_bien` 17, `page_layouts_backup_20260827` 38, `page_layouts_canonical_20260827` 1). Cela diffère du décompte « 14 vides » avancé dans un commentaire précédent; les 23 résultats bruts listés ici sont la référence de cette passe.

Sur ces 23 tables DB-only, l’inspection PostgreSQL a trouvé **24 contraintes** et **20 index**, clés primaires indexées comprises. Les contraintes et index proposés par Alembic sont quantifiés plus bas; aucun objet n’a été modifié.

### Route générique et portée frontend

`backend/app/api/v1/tables/router.py` expose `/{table}`, mais `_repository()` n’accepte que les noms de `TABLES`. Le client frontend construit des chemins `/tables/{table}` pour les noms sans alias spécifique; certains alias, dont `foncier_items`, pointent au contraire vers une API métier (`/foncier`). Il faut donc distinguer la mention d’un identifiant, l’accès à une route et la lecture effective d’une table SQL.

Les routes génériques GET/POST/PATCH/DELETE appellent `enforce_permission(..., module="erp_table", resource=table)`. La politique centralisée n’autorise que la lecture de `stats_journalieres` pour les rôles admin/gestionnaire, et refuse les autres actions génériques. Les occurrences frontend/backend de `campagnes_marketing`, `documents`, `opportunites` et `social_posts` prouvent des références de code, mais pas que ces parcours génériques aboutissent aujourd’hui. Les routes spécialisées RPC/métier sont à suivre séparément. Aucune référence aux 23 noms n’a été trouvée dans `Dockerfile`, `docker-compose.yml`, `docker-compose.new-host.yml`, `backend/Dockerfile` ou `backend/docker-compose.yml`.

## Écarts Alembic / metadata / PostgreSQL

```text
SQLAlchemy metadata                    51 tables
PostgreSQL public                      75 tables (alembic_version incluse)
Tables DB-only applicatives            23
Tables metadata absentes de PostgreSQL 0
Alembic current                        032_immobilier_v2_contract
Alembic heads                          032_immobilier_v2_contract
```

Les comparaisons ci-dessous ont été exécutées en lecture seule avec `compare_type=True`. Le chiffre **760** correspond aux entrées groupées renvoyées par `compare_metadata` lorsque `compare_server_default=False`. L’aplatissement de ces groupes donne 840 opérations élémentaires. En activant la comparaison des defaults, Alembic renvoie 815 entrées groupées / 991 opérations élémentaires.

| Catégorie | Entrées/opérations sans defaults | Avec defaults | Interprétation Alembic |
|---|---:|---:|---|
| Tables DB-only (`remove_table`) | 23 | 23 | Objets PostgreSQL sans table metadata; ne pas appliquer ces propositions |
| Colonnes metadata-only (`add_column`) | 93 | 93 | Présentes dans les modèles, absentes en DB, sur 18 tables |
| Colonnes DB-only (`remove_column`) | 124 | 124 | Présentes en DB, absentes metadata, sur 20 tables |
| Types | 319 | 319 | Sur 42 tables |
| Nullabilité | 99 | 99 | Sur 32 tables |
| `server_default` | non comparé | 151 | Sur 41 tables |
| Index à ajouter / retirer | 116 / 16 | 116 / 16 | Index metadata manquants / index DB non déclarés |
| Contraintes à ajouter / retirer | 10 / 5 | 10 / 5 | Contraintes non concordantes |
| Clés étrangères à ajouter / retirer | 34 / 1 | 34 / 1 | Relations non concordantes |

Ces nombres comptent des opérations demandées par l’autogenerate, pas des changements appliqués. Ils ne choisissent pas automatiquement le schéma cible et ne justifient aucune migration corrective. Les colonnes/type/defaults doivent être confrontés aux migrations et au contrat métier, table par table.

## Fonctions, triggers et contraintes côté PostgreSQL

Les comparaisons Alembic/metadata de tables ne constituent pas un inventaire exhaustif des fonctions, triggers ou règles. Inspection directe de `pg_proc`, `pg_trigger`, `pg_constraint` et `pg_policies` : **6 triggers non internes**, **7 fonctions `SECURITY DEFINER`**, **18 contraintes CHECK publiques**, **0 politique RLS dans `public`**.

### Triggers observés

| Table | Trigger | Fonction | Constat |
|---|---|---|---|
| `finances` | `trg_finances_contract_guard` | `eg_finance_contract_guard` | `BEFORE INSERT OR UPDATE`; valide direction, montant, date, devise et conversion XOF |
| `products` | `trg_products_contract_reference` | `eg_product_reference_guard` | Garde-fou des références produits |
| `properties` | `trg_immobilier_property_guard` | `eg_immobilier_property_guard` | `BEFORE INSERT/UPDATE/DELETE`; validation métier immobilier |
| `properties` | `trg_immobilier_property_audit` | `eg_immobilier_property_audit` | `AFTER INSERT/UPDATE`; journal d’audit |
| `properties_audit` | `trg_properties_audit_immutable` | `eg_immobilier_audit_no_mutation` | Refuse UPDATE/DELETE |
| `properties_audit` | `trg_properties_audit_no_truncate` | `eg_immobilier_audit_no_mutation` | Refuse TRUNCATE |

Les triggers listés sont activés (`tgenabled = O`). La fonction financière et son trigger sont définis dans la migration `031`; les fonctions/triggers immobiliers dans `032`.

### Fonctions et chaîne de privilèges

- `eg_finance_contract_guard` lit `finance_exchange_rates` pour les devises non XOF/EUR et écrit les champs normalisés de `finances`.
- `eg_next_reference` utilise `ref_counters`; `eg_product_reference_guard` est le trigger produit associé.
- `eg_immobilier_next_reference` utilise `immobilier_reference_counters`; `eg_immobilier_type_label` lit `immobilier_types_bien`; `eg_immobilier_derive_title` compose le titre canonique.
- Vérification des ACL : `egs_app` peut lire `finance_exchange_rates`, lire/insérer/mettre à jour `ref_counters` et exécuter `eg_next_reference`; les gardes finance et produits sont invoker (`SECURITY DEFINER = false`) et appartiennent à `egs_app`.
- `eg_immobilier_property_guard`, `eg_immobilier_property_audit`, `eg_immobilier_audit_no_mutation`, `eg_immobilier_audit_insert` et `eg_immobilier_record_refusal` appartiennent aux règles d’audit/immobilier de la migration `032`.
- `current_user_role()` existe en `public`, propriétaire `postgres`, `SECURITY DEFINER`, et son ACL autorise `PUBLIC` et `egs_app` à l’exécuter. Son corps dépend de `auth.uid()` / `auth.users`. Aucune utilisation runtime, définition de migration courante ou politique RLS active n’a été trouvée. Les rapports historiques mentionnent `20260408030000_current_user_role_fn`, mais le fichier SQL correspondant n’est pas présent dans les archives inspectées ni suivi par Git. Classement : fonction historique orpheline à décision de sécurité explicite; ne pas révoquer/supprimer dans ce rapport.

### Vérification du compteur immobilier

Le rôle effectif API est `egs_app`. PostgreSQL confirme :

```text
egs_app: SELECT/INSERT/UPDATE immobilier_reference_counters = false
egs_app: EXECUTE eg_immobilier_next_reference(integer) = false
egs_app: INSERT/UPDATE properties = true
eg_immobilier_property_guard: owner postgres, SECURITY DEFINER
postgres: EXECUTE eg_immobilier_next_reference(integer) = true
```

La migration définit la fonction garde de propriété comme `SECURITY DEFINER`; elle appelle la fonction de référence sous l’identité de son propriétaire. La restriction directe du rôle API paraît donc compatible avec le chemin du trigger. Ce chemin a été vérifié structurellement seulement : aucun INSERT/UPDATE n’a été exécuté pour ne pas modifier la base.

### Contraintes CHECK observées

Les 18 contraintes CHECK courantes sont :

- `entities`: `ck_entity_status`, `ck_entity_type`.
- `finance_exchange_rates`: devise sur 3 lettres, taux strictement positif, source non vide.
- `finances`: `ck_finance_devise_v2`, `ck_finance_montant_positive_v2`, `ck_finance_type_operation_v2` (les trois sont `NOT VALID`, mais s’appliquent aux nouvelles écritures).
- `foncier_attestations`: statut autorisé, type autorisé.
- `foncier_lots`: statut autorisé.
- `immobilier_reference_counters`: compteur entre 0 et 9999.
- `immobilier_statut_transitions`: statut source différent du statut cible.
- `properties`: contrat localité v2, statut de localité autorisé, statut propriété autorisé.
- `ref_counters`: `last_value > 0`.
- `user_village_access`: niveau d’accès autorisé.

Relations immobilières confirmées : `properties.type_bien` référence `immobilier_types_bien.code` avec `ON DELETE RESTRICT`; contrainte validée `fk_properties_type_bien_v2`. Le référentiel compte 17 types et 18 transitions; leur création/seed est définie dans `032`.

## Vérifications Git et données suivies

`git ls-files quarantine reports | head -30` montre des rapports suivis et aucun chemin `quarantine/`; `git ls-files quarantine` retourne 0 fichier. `quarantine/.env.backup.20260804_180639` existe sur disque, est couvert par `.gitignore:102 (/quarantine/)`, n’est pas dans l’index et aucune entrée de chemin n’a été trouvée dans les branches, remotes ou tags valides inspectés. Son contenu n’a pas été ouvert. Une tentative `git log --all` a rencontré une référence locale de capture invalide; la vérification a été répétée explicitement sur les refs valides.

`git ls-files reports | grep -E '\\.csv$|\\.sql$'` retourne les noms suivants, sans inspection du contenu :

- `reports/backup_pre_migration_clients.csv`
- `reports/backup_pre_migration_leads.csv`
- `reports/backup_pre_migration_locataires.csv`
- `reports/backup_pre_migration_parties_202607021128.sql`
- `reports/phase3_parties_dryrun_report.sql`
- `reports/phase3_parties_real_migration.sql`

Les trois CSV sont un risque potentiel de données personnelles à qualifier séparément. Aucun contenu n’a été affiché ni copié dans ce rapport.

Référence snapshot confirmée : commit `8be48d0567cc5e49dba54c53395dcf004a690927` (`8be48d05`) et tag `pre-refonte-wip-20261008`, tous deux pointant vers le même commit du 2026-10-08.

## État du worktree et documents

Avant la rédaction, `git status --short` affichait :

```text
 M .codex/context/server-context.json
?? docs/ARCHITECTURE.md
?? docs/SPEC.md
```

Ces éléments préexistants ont été préservés. `docs/SPEC.md` a reçu l’étiquette `BROUILLON — NON VALIDÉ (Lot 1 non validé)` à la demande explicite du commanditaire. Le présent rapport est lui aussi non validé.

## Commandes et preuves principales

Commandes de collecte utilisées (requêtes DB strictement `SELECT` / introspection) :

```text
docker exec -i -w /app egs-api python - <<'PY'
# SQLAlchemy Base.metadata, inspect(engine), alembic ScriptDirectory,
# MigrationContext.configure(compare_type=True, compare_server_default=...),
# compare_metadata(...); SELECT current_database/current_schema/alembic_version
PY

docker exec -i -u postgres egs-postgres psql -X -U postgres -d egs_local
# SELECT count(*) pour chaque table DB-only
# SELECT dans pg_proc, pg_trigger, pg_constraint, pg_policies

rg -n -w <nom_table> src backend/app backend/alembic backend/tests scripts sql docker archive supabase docs reports
git ls-files quarantine reports | head -30
git check-ignore -v quarantine/.env.backup.20260804_180639
git ls-files reports | grep -E '\\.csv$|\\.sql$'
git show --no-patch 8be48d05
git show-ref --tags pre-refonte-wip-20261008
git status --short
```

Les comptages, différences, fonctions et triggers consignés plus haut proviennent des sorties de ces commandes; les fichiers CSV/SQL suivis n’ont pas été lus.

Un premier comptage des lignes avec le rôle applicatif a échoué faute de privilèges sur `immobilier_reference_counters`; il a été repris avec le rôle PostgreSQL. Un premier formateur du diff a également échoué sur une structure groupée; l’extraction a été relancée avec aplatissement explicite. Les chiffres du rapport sont ceux des relances réussies.

## Suite sûre

Avant toute validation du Lot 1, poursuivre l’analyse des colonnes/type/nullabilité/defaults et de l’origine des tables restantes. Chaque objet devra recevoir une décision explicite **GARDER / SUPPRIMER / À DÉCIDER**, avec migration/seed des règles métier retenues. Aucune migration ni refonte du schéma ne doit partir de cette seule comparaison automatique.
