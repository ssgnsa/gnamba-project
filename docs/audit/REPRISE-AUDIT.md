# Reprise — audit de contrôle (lecture seule)

Date de collecte : 2026-10-09. Périmètre : `~/gnamba-project`, branche attendue `refonte/clean-slate`.

Aucun test n'a été relancé. Les requêtes PostgreSQL sont des `SELECT` ou de l'introspection. Aucun `.env`, contenu de CSV, écriture DB, migration, ni opération Git modificatrice n'a été exécuté. Tout fait non prouvé est indiqué **NON ÉTABLI**.

## Tableau de contrôle

| Attendu | Observé | Écart | Commande |
|---|---|---|---|
| **1. Git** — branche `refonte/clean-slate`, HEAD `8be48d05…`, tags présents. | Branche, HEAD et deux tags conformes; sorties brutes dans l'étape 1. | Aucun changement hors `docs/`, sauf `.codex/context/server-context.json` déclaré préexistant. `docs/JOURNAL.md` est aussi déjà modifié; diff limité à l'ajout LOT 1. Ces états existaient avant le rapport. | `git branch --show-current; git rev-parse HEAD; git status --short; git tag --list 'pre-refonte-*'; git rev-parse pre-refonte-20261008 pre-refonte-wip-20261008` |
| **2. Filet de sécurité** — dump/hash attendus, liste du dump, aucun `.sql` vide. | Dump de 209604 octets, SHA conforme, format CUSTOM; header `TOC Entries: 353`. | Aucun `.sql` vide. Une extraction indépendante compte 349 lignes non commentées; différence avec le header **NON ÉTABLIE** au-delà de ces sorties. | `ls -l backups/pre-refonte-20261008.dump; sha256sum backups/pre-refonte-20261008.dump; pg_restore --list backups/pre-refonte-20261008.dump; find backups -type f -name '*.sql' -size 0 -print` |
| **3. Documents** — existence, taille, date, lignes, marqueur, dernier lot/date. | Les cinq documents existent; métadonnées et sorties du marqueur à l'étape 3. JOURNAL : dernier lot LOT 1, date `2026-10-08`. | Marqueur SPEC présent; LOT 1 explicitement NON VALIDÉ. | `stat -c 'FILE=%n SIZE=%s MTIME=%y' <f>; wc -l < <f>; grep -nF 'BROUILLON — NON VALIDÉ' docs/SPEC.md` |
| **4. SPEC** — 13 modules, 24 règles DB, 23 tables hors metadata, questions numérotées. | 13 modules, 6 triggers, 18 CHECK, 23 tables, 19 questions. | Comptages conformes; les 13 décisions générales de module restent `= ?`. | `awk` ciblés et lecture de `docs/SPEC.md` |
| **5. Base** — nombre de tables, current/head, agrégats, triggers/CHECK. | 75 tables publiques; metadata 51; current=head `032_immobilier_v2_contract`; 6 triggers, 18 CHECK; agrégats en sortie 5. | Conforme au LOT1-RAPPORT : 75 tables dont `alembic_version`, 51 metadata, 23 DB-only, current=head et 6/18. Aucun écart de ces chiffres observé depuis le 2026-10-08. | `docker exec -i -u postgres egs-postgres psql -X -U postgres -d egs_local` avec SELECT; comptage Base après chargement API; `alembic current; alembic heads` dans `egs-api` |
| **6. Code** — 238 routes runtime (231 `/api/v1`), migrations 008→032, dossiers absents. | 242 routes (234 `/api/v1`); 34 scripts Alembic dont 25 révisions 008–032; `frontend/` et `backend/seeds/` absents; huit handlers Foncier 501. | +4 routes total et +3 `/api/v1`. L'absence des dossiers est constatée, mais ne prouve pas seule que les lots 4 à 9 n'ont pas eu lieu (**NON ÉTABLI**). | Comptage routes dans `egs-api`; `alembic history --verbose`; `find backend/alembic/versions`; vérification chemins; recherche 501 Foncier |
| **7. Risques** — compte test, SECURITY DEFINER, CSV suivis, routes 501. | Compte et fonction présents; CSV suivis avec 3, 3 et 1 lignes; routes listées aux points ouverts. | Risques présents; acceptabilité/remédiation **NON ÉTABLIES**. Aucun contenu de CSV/SQL lu. | SELECT users/pg_proc; `git ls-files 'reports/backup_pre_migration_*'`; `wc -l` sur CSV; recherche des 501 |

## Sorties brutes extraites par étape

### 1. État Git

```text
refonte/clean-slate
8be48d0567cc5e49dba54c53395dcf004a690927
 M .codex/context/server-context.json
 M docs/JOURNAL.md
?? docs/ARCHITECTURE.md
?? docs/SPEC.md
?? docs/audit/LOT1-INVENTAIRE-FONCTIONNEL.md
?? docs/audit/LOT1-RAPPORT.md
pre-refonte-20261008
pre-refonte-wip-20261008
dce8a11bb2b3be2a2b408773731cd8169702baa4
8be48d0567cc5e49dba54c53395dcf004a690927
```

Commandes : `git branch --show-current; git rev-parse HEAD; git status --short; git tag --list 'pre-refonte-*'; git rev-parse pre-refonte-20261008 pre-refonte-wip-20261008`. Le diff de JOURNAL ajoute l'entrée LOT 1 datée du 2026-10-08.

### 2. Filet de sécurité

```text
-rw------- 1 soma soma 209604 oct. 8 16:58 backups/pre-refonte-20261008.dump
f99be1d0a6421e58ce3bf3ab02cac35fd076eb2ad919e21e5c12817aa825ab35  backups/pre-refonte-20261008.dump
; Archive created at 2026-10-08 16:58:37 UTC
;     dbname: egs_local
;     TOC Entries: 353
;     Compression: gzip
;     Dump Version: 1.15-0
;     Format: CUSTOM
;     Dumped from database version: 16.14
;     Dumped by pg_dump version: 16.14
ENTRIES_NON_COMMENT=349
```

Commandes : `ls -l`, `sha256sum`, `pg_restore --list` du dump; `find backups -type f -name '*.sql' -size 0 -print` n'a produit aucune ligne.

### 3. Documents de la refonte

```text
FILE=docs/SPEC.md SIZE=34007 MTIME=2026-10-08 20:13:05.532285459 +0000; LINES=320
FILE=docs/JOURNAL.md SIZE=1649 MTIME=2026-10-08 18:56:36.596617837 +0000; LINES=24
FILE=docs/ARCHITECTURE.md SIZE=3024 MTIME=2026-10-08 18:06:22.762231597 +0000; LINES=82
FILE=docs/audit/LOT1-RAPPORT.md SIZE=19000 MTIME=2026-10-08 19:01:21.473648113 +0000; LINES=208
FILE=docs/audit/LOT1-INVENTAIRE-FONCTIONNEL.md SIZE=46509 MTIME=2026-10-08 19:35:40.709203143 +0000; LINES=400
3:> BROUILLON — NON VALIDÉ (Lot 1 non validé)
320:**Aucune cible n’est validée dans ce document. Le marqueur BROUILLON — NON VALIDÉ reste en place.**
```

Commandes : `stat -c 'FILE=%n SIZE=%s MTIME=%y' <f>` et `wc -l < <f>` pour chaque document, puis `grep -nF 'BROUILLON — NON VALIDÉ' docs/SPEC.md`. JOURNAL consigne LOT 0 puis LOT 1; dernière date `2026-10-08`.

### 4. Cohérence SPEC.md

```text
MODULE_COUNT=13
TRIGGER_DATA_ROWS=6
CHECK_DATA_ROWS=18
TABLE_DATA_ROWS=23
OPEN_QUESTIONS=19
```

### 5. État réel de la base

```text
public_tables_including_alembic_version | 75
METADATA_TABLES=51
alembic_current | 032_immobilier_v2_contract
032_immobilier_v2_contract (head)
non_internal_triggers | 6
public_check_constraints | 18
role=admin, access_level=admin, count=1
role=employe, access_level=admin, count=1
role=employe, access_level=employe, count=1
role=gestionnaire, access_level=gestionnaire, count=1
newtest@egs.local | employe | admin
public | current_user_role | prosecdef=t
```

Les requêtes DB sont uniquement des `SELECT`; `METADATA_TABLES` a été compté après chargement de l'application et de `Base`.

### 6. Dérive du code

```text
RUNTIME_ROUTES_TOTAL=242
RUNTIME_ROUTES_API_V1=234
RUNTIME_FONCIER_ROUTES=59
VERSION_SCRIPTS=34
NUMBERED_008_TO_032=25
ABSENT=frontend
ABSENT=backend/seeds
```

Les 34 scripts correspondent aux révisions 001–032 et deux révisions de fusion, `6c21cb4b996d` et `b350fd2b6f19`; current/head reste `032_immobilier_v2_contract`.

### 7. Risques ouverts

```text
newtest@egs.local | employe | admin
public | current_user_role | prosecdef=t
reports/backup_pre_migration_clients.csv | 3 lignes
reports/backup_pre_migration_leads.csv | 3 lignes
reports/backup_pre_migration_locataires.csv | 1 ligne
```

Commandes : `SELECT email, role, access_level FROM public.users WHERE email='newtest@egs.local'`; inspection `pg_proc`; `git ls-files 'reports/backup_pre_migration_*'`; `wc -l` sur les CSV seulement. Un SQL suivi de même préfixe est `reports/backup_pre_migration_parties_202607021128.sql`; contenu non lu.

## SPEC — inventaires

### Modules

Décision générale non renseignée pour chacun : `GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?`.

1. Clients — `= ?`
2. Immobilier — `= ?`
3. Foncier — `= ?`
4. Finances — `= ?`
5. Leads — `= ?`
6. Médias / documents — `= ?`
7. Site vitrine — `= ?`
8. Auth / utilisateurs — `= ?`
9. Projets / tâches — `= ?`
10. Fournitures / fournisseurs — `= ?`
11. Employés — `= ?`
12. Registre — `= ?`
13. Paramètres — `= ?`

Décisions fonctionnelles Foncier distinctes : garder hiérarchie village/lotissement/îlot/lot, attestations, vérification publique, accès par village et audit/timeline; garder ou finir exports, imports, PDF et Sync. La route `sign` est indiquée à supprimer au profit du papier; aucune suppression de code n'a eu lieu.

### Règles DB

- 6 triggers : `trg_finances_contract_guard`, `trg_products_contract_reference`, `trg_immobilier_property_guard`, `trg_immobilier_property_audit`, `trg_properties_audit_immutable`, `trg_properties_audit_no_truncate`.
- 18 CHECK : `entities` (2), `finance_exchange_rates` (3), `finances` (3), `foncier_attestations` (2), `foncier_lots` (1), `immobilier_reference_counters` (1), `immobilier_statut_transitions` (1), `properties` (3), `ref_counters` (1), `user_village_access` (1). Chaque décision reste `REPRODUIRE / ABANDONNER / À DÉCIDER = ?`. Les trois CHECK Finance sont NOT VALID pour les anciennes lignes selon LOT 1.

### Tables DB hors metadata

Les 23 noms : `app_settings_old`, `app_settings_test`, `campagnes_marketing`, `documents`, `finance_exchange_rates`, `foncier_audit`, `foncier_audit_old`, `foncier_items`, `foncier_items_old`, `foncier_lots_old`, `foncier_villages_old`, `immobilier_reference_counters`, `immobilier_statut_transitions`, `immobilier_types_bien`, `opportunites`, `page_layouts_backup_20260827`, `page_layouts_canonical_20260827`, `properties_audit`, `ref_counters`, `social_posts`, `ventes_foncieres`, `visites`, `visites_terrain`. Calcul live : 75 - 1 `alembic_version` - 51 metadata = 23.

## Décisions du commanditaire consignées

**DÉCISION CONSIGNÉE :** le chef de village valide les attestations en signant sur papier; il n'a pas de compte ERP; aucun rôle `chef_village` n'est demandé.

**DÉCISIONS FONCTIONNELLES CONSIGNÉES :** garder l'accès par village et le refondre en rôle avec périmètre; les détails restent à décider. `agent@village` est le libellé de périmètre donné par le commanditaire, mais le mapping en rôle/scope technique est **NON ÉTABLI**. Le tableau fonctionnel consigne aussi : aucune validation d'attestation sans scan signé joint.

**PROPOSITIONS NON VALIDÉES :** acteurs proposés `admin`, `gestionnaire`, `secretaire`, `agent@village`; préparation/soumission et dépôt du scan, confirmation par `admin`/`gestionnaire` avec scan joint, révocation et traces à préciser. La matrice RBAC complète n'a pas de cible validée; les agrégats DB ne démontrent aucune permission par module.

## Points ouverts

Statut au 2026-10-09. Les quatre premiers points sont les risques demandés; les points 5–23 correspondent aux questions 1–19 de la SPEC.

1. **Compte `newtest@egs.local` — CONFIRMÉ PRÉSENT :** `role=employe`, `access_level=admin`.
2. **`current_user_role()` — CONFIRMÉE :** `public`, `SECURITY DEFINER=true`; comportement attendu et décision sécurité **OUVERTS**.
3. **CSV suivis par Git — CONFIRMÉS :** clients (3 lignes), leads (3), locataires (1), sous les noms donnés ci-dessus. Contenus non lus; un fichier SQL pré-migration est aussi suivi, sans lecture.
4. **Foncier HTTP 501 — CONFIRMÉ dans le code :** `POST /ilots/{ilot_id}/lots/import`, `POST /lots/export`, `PATCH /attestations/{attestation_id}`, `POST /attestations/{attestation_id}/generate-pdf`, `GET /attestations/{attestation_id}/pdf`, `POST /audit/export-pdf`, `POST /audit/export-csv`, `POST /sync/queue/{queue_item_id}/resolve`; préfixe runtime `/api/v1/foncier`.
5. **Question 1 — DECISION-003 :** périmètre objet/lignes Agent (`employe`) et Gestionnaire par table, preuves d'approbation : **OUVERT**.
6. **Question 2 :** niveaux UI `gerant`, `secretaire`, `ouvrier`, `visiteur` : rôles métier ou valeurs historiques; gouvernance d'attribution : **OUVERT**.
7. **Question 3 :** référence entre politique `/tables` et documents décrivant 34 lectures Gestionnaire/CRUD Admin : **OUVERT**.
8. **Question 4 :** MFA Admin et choix entre `require_admin_user` et `require_permission` : **OUVERT**.
9. **Question 5 :** données publiables par les GET publics Site/Settings/Properties/Brand assets : **OUVERT**.
10. **Question 6 :** contrat Documents et endpoints UI sans routeur dédié : **OUVERT**.
11. **Question 7 :** routes Foncier TODO (501 ou valeurs neutres) à finir ou retirer : **OUVERT**.
12. **Question 8 :** comportement de `current_user_role()` et antispam en mémoire multi-instance : **OUVERT**.
13. **Question 9 :** niveau de preuve requis pour qualifier une page de fonctionnelle : **OUVERT**.
14. **Question 10 :** maintien/configuration du client Orval face à `ApiClient` : **OUVERT**.
15. **Question 11 :** tests/intégrations en environnement isolé avec fixtures TOTP/DB : **OUVERT**.
16. **Question 12 :** acteur confirmant l'enregistrement ERP d'une attestation : **OUVERT**.
17. **Question 13 :** rattachement d'un agent à plusieurs villages : **OUVERT**.
18. **Question 14 :** paiements de loyers par les secrétaires : **OUVERT**.
19. **Question 15 :** création de lots fonciers par les agents : **OUVERT**.
20. **Question 16 :** effectif à retenir, 6 ou 8 : **OUVERT**.
21. **Question 17 :** accès Internet des agents en village et besoin hors ligne : **OUVERT**.
22. **Question 18 :** données existantes à importer : **OUVERT**.
23. **Question 19 :** modèle papier officiel de l'attestation : **OUVERT**.

**Autres écarts/limites :** 242 routes runtime (234 sous `/api/v1`) contre 238/231 attendues. `frontend/` et `backend/seeds/` absents; cela seul ne prouve pas l'historique des lots 4–9. 34 scripts Alembic, avec les révisions de fusion; current=head `032_immobilier_v2_contract`. Les 353 entrées du header pg_restore et les 349 lignes non commentées extraites ne sont pas réconciliées.

## Prochaine action recommandée

Obtenir la validation formelle du LOT 1 et des arbitrages ouverts de la SPEC par le commanditaire avant d'engager le LOT 3. **Action non exécutée.**
