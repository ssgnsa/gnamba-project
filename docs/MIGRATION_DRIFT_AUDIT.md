# Audit de dérive Alembic — migrations b350fd2b6f19 → 036_foncier_activity_logs_json

**Contexte** : après restauration PostgreSQL, `alembic` est bloqué au point de fusion `6c21cb4b996d` et `alembic upgrade head` échoue sur `b350fd2b6f19` avec `DuplicateColumn: users.entity_id already exists`. La base de données contient déjà les colonnes de `b350fd2b6f19` mais la table `alembic_version` n'est pas estampillée (`alembic_version` ne contient pas `b350fd2b6f19`). C'est un dérive de schéma : le schéma physique est en avance sur l'état suivi par Alembic.

**Source de vérité** : la base PostgreSQL gouvernée par Alembic. Ce document est un document de travail à lecture seule. Il ne modifie aucune migration, ni le backend, ni `docker-compose.yml`.

---

## 1. Chaîne de révisions concernée

| Révision | Description | Dépend de |
|---|---|---|
| `6c21cb4b996d` | Fusion des branches (no-op) | `018`, `021` |
| `b350fd2b6f19` | Ajoute `entity_id` / `locataire_entity_id` / `proprietaire_entity_id` + index + FK vers `entities` sur 10 tables | `6c21cb4b996d` |
| `028_normalize_vitrine_lots_types` | Convertit `caracteristiques` de JSON vers `varchar[]` sur `vitrine_lots` | `027` |
| `029_auth_password_lifecycle` | Ajoute `auth_password_reset_tokens` + `auth_rate_limit_events` (statut HOLD, non appliquée) | `028` |
| `030_restore_property_orm_compat_columns` | Ajoute colonnes compat ORM sur `properties` (`proprietaire`, `valeur`, `loyer_mensuel`, `cover_image_url`) | `029` |
| `031_contract_v2_products_finance` | Ajoute `type_transaction`, `reference` (products), colonnes finance, fonctions/triggers, contraintes | `030` |
| `032_immobilier_v2_contract` | Contrat Immobilier V2 : colonnes properties, tables référentiel, fonctions/triggers, audit, garde egs_local/egs_test | `031` |
| `033_api_performance_indexes` | Index partiels API sur propriétés, contrats, loyers, campagnes | `032` |
| `034_add_mfa_session_state` | Ajoute `mfa_verified_at` sur `auth_sessions` | `033` |
| `035_foncier_integrity` | Index uniques partiels sur `foncier_lots` et `foncier_attestations` + vérification doublons | `034` |
| `036_foncier_activity_logs_json` (HEAD) | Convertit `activity_logs.changed_fields` de `text[]` vers `JSON` | `035` |

**Point de blocage actuel** : `alembic_version` est à `6c21cb4b996d` (point de fusion). La tête de chaîne est `036_foncier_activity_logs_json`. `b350fd2b6f19` est la première révision à appliquer après le point de fusion, et elle échoue car ses colonnes existent déjà dans la base restaurée.

---

## 2. Extraction des opérations par migration

### 2.1 `6c21cb4b996d` — fusion des branches (no-op)

**Type** : point de fusion, pas de changement de schéma.
- `down_revisions`: `018_add_entity_id_to_foncier`, `021_add_app_settings_cols`
- `upgrade()` : `pass` (aucune opération)
- `downgrade()` : `pass` (aucune opération)

**Vérification SQL** :
```sql
SELECT version_num FROM alembic_version;
-- attendu actuellement : 6c21cb4b996d
```

**Recommandation** : aucune opération physique requise. C'est le point de départ de l'audit.

---

### 2.2 `b350fd2b6f19` — liens entités vers `entities` (BLOQUÉE)

**Opérations physiques (upgrade)** — pour chacune des 10 paires (table, colonne, contrainte) :

| Table | Colonne | Contrainte FK | Index |
|---|---|---|---|
| `employees` | `entity_id` UUID NULL | `fk_employees_entity` → `entities(id)` | `ix_employees_entity_id` |
| `finances` | `entity_id` UUID NULL | `fk_finances_entity` → `entities(id)` | `ix_finances_entity_id` |
| `foncier_attestation_temoins` | `entity_id` UUID NULL | `fk_foncier_temoins_entity` → `entities(id)` | `ix_foncier_attestation_temoins_entity_id` |
| `leads` | `entity_id` UUID NULL | `fk_leads_entity` → `entities(id)` | `ix_leads_entity_id` |
| `lease_contracts` | `locataire_entity_id` UUID NULL | `fk_lease_contracts_locataire_entity` → `entities(id)` | `ix_lease_contracts_locataire_entity_id` |
| `parties` | `entity_id` UUID NULL | `fk_parties_entity` → `entities(id)` | `ix_parties_entity_id` |
| `properties` | `proprietaire_entity_id` UUID NULL | `fk_properties_proprietaire_entity` → `entities(id)` | `ix_properties_proprietaire_entity_id` |
| `rent_payments` | `locataire_entity_id` UUID NULL | `fk_rent_payments_locataire_entity` → `entities(id)` | `ix_rent_payments_locataire_entity_id` |
| `suppliers` | `entity_id` UUID NULL | `fk_suppliers_entity` → `entities(id)` | `ix_suppliers_entity_id` |
| `users` | `entity_id` UUID NULL | `fk_users_entity` → `entities(id)` | `ix_users_entity_id` |

**Cause de l'échec** : la base restaurée contient déjà ces colonnes (ex: `users.entity_id` existe déjà), donc `ADD COLUMN` lève `DuplicateColumn`.

**Vérification SQL (état actuel)** :
```sql
-- colonnes déjà présentes ?
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('entity_id','locataire_entity_id','proprietaire_entity_id')
ORDER BY table_name, column_name;

-- contraintes FK déjà présentes ?
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'
  AND conname LIKE '%_entity%';

-- index déjà présents ?
SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
  AND indexname LIKE 'ix_%_entity_id';
```

**Recommandation** : comme les colonnes existent déjà, appliquer `b350fd2b6f19` en l'état échouera. Il faut soit estampiller (`stamp`) cette révision si le schéma physique correspond exactement, soit créer manuellement les objets manquants uniquement s'ils sont absents (DDL idempotent `IF NOT EXISTS`), puis estampiller. Voir section 4.

---

### 2.3 `028_normalize_vitrine_lots_types` — conversion `caracteristiques` JSON → varchar[]

**Prérequis** : table `public.vitrine_lots` existe, PK `(id)`, types attendus :
- `id`: uuid
- `superficie`: numeric(10,2)
- `prix`: numeric(12,2)
- `created_at`/`updated_at`: timestamp with time zone
- `tags`: character varying[] ou text[]
- `caracteristiques`: json, jsonb, character varying[] ou text[]

**Opérations** :
1. Vérifie les types de chaque colonne ; rejette si inattendu (aucun changement si préflight échoue).
2. Si `caracteristiques` est déjà `varchar[]` / `text[]` : ne rien faire (idempotent).
3. Si `json` ou `jsonb` :
   - Rejette s'il existe des valeurs non-tableau ou des éléments non-chaîne.
   - Crée une fonction SQL `_egs_028_json_array_to_varchar(json)` / `(jsonb)`.
   - `ALTER TABLE ... ALTER COLUMN caracteristiques TYPE character varying[] USING ...`
   - Supprime la fonction temporaire.

**Vérification SQL** :
```sql
SELECT pg_catalog.format_type(a.atttypid, a.atttypmod)
FROM pg_catalog.pg_attribute a
WHERE a.attrelid = 'public.vitrine_lots'::regclass
  AND a.attname = 'caracteristiques'
  AND a.attnum > 0 AND NOT a.attisdropped;

-- valeurs non conformes ?
SELECT count(*) FROM public.vitrine_lots
WHERE caracteristiques IS NOT NULL
  AND jsonb_typeof(caracteristiques) <> 'array';
```

**Recommandation** : vérification préalable obligatoire. Si la colonne est déjà un tableau, estampiller sans appliquer. Sinon, appliquer avec la logique de préflight de la migration.

---

### 2.4 `029_auth_password_lifecycle` — HOLD, non appliquée

**Statut** : marquée HOLD dans le docstring, non appliquée en production.

**Opérations** (si elle devait être appliquée un jour) :
- Crée `auth_password_reset_tokens` (id, user_id, token_hash, created_at, expires_at, used_at) + 4 index (dont un unique partiel sur `user_id WHERE used_at IS NULL`).
- Crée `auth_rate_limit_events` (id, event_type, identifier, created_at) + 5 index.

**Recommandation** : comme elle est en HOLD et n'est pas dans le chemin vers HEAD (la chaîne passe de 028 à 030 via le down_revision de 030 qui pointe vers 029, mais 029 n'a pas été appliquée), il faut confirmer si cette révision doit être intégrée. Pour l'audit de dérive actuelle, elle est hors périmètre immédiat sauf si le schéma cible l'exige.

> **Note d'architecture** : le down_revision de `030` pointe vers `029`, ce qui place `029` dans la chaîne linéaire. Si `029` n'est pas appliquée, `030` et les suivantes ne peuvent pas être estampillées séquentiellement sans traiter `029`.

---

### 2.5 `030_restore_property_orm_compat_columns` — colonnes compat ORM sur `properties`

**Opérations** (toutes `ADD COLUMN IF NOT EXISTS`, idempotentes) :
- `properties.proprietaire VARCHAR`
- `properties.valeur NUMERIC(12, 2)`
- `properties.loyer_mensuel NUMERIC(10, 2)`
- `properties.cover_image_url VARCHAR`

**Downgrade** : no-op (préserve les colonnes qui peuvent exister depuis avant cette révision).

**Vérification SQL** :
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='properties'
  AND column_name IN ('proprietaire','valeur','loyer_mensuel','cover_image_url');
```

**Recommandation` : `IF NOT EXISTS` rend l'application sans danger si les colonnes existent. Estampiller après vérification.

---

### 2.6 `031_contract_v2_products_finance` — colonnes finance + référence produits + fonctions/triggers

**Opérations** :
1. `finances`: `ADD COLUMN IF NOT EXISTS type_transaction VARCHAR(20)`, validation des valeurs existantes (doit être `recette`/`depense` ou NULL).
2. `products`: `ADD COLUMN IF NOT EXISTS reference VARCHAR(50)`, backfill `PRD-YYYY-XXXXXX`, `SET NOT NULL`, index unique `uq_products_reference`.
3. Crée table `ref_counters(namespace, ref_year, last_value)`.
4. Fonction `eg_next_reference(TEXT, INTEGER)` + initialisation des compteurs depuis `products.reference`.
5. Fonction trigger `eg_product_reference_guard()` + trigger `trg_products_contract_reference` (reference immuable).
6. `finances`: ajoute `type_operation`, `taux_source`, `date_transaction`, `date_operation`, `montant_xof`, `taux_change`, `devise` (`IF NOT EXISTS`).
7. `ALTER COLUMN montant/montant_xof TYPE NUMERIC(18,2)`, `devise TYPE VARCHAR(4)`.
8. Crée table `finance_exchange_rates`.
9. Backfill `finances` (type_operation, date_operation, montant_xof, taux_change, taux_source) là où NULL.
10. `ALTER COLUMN type_operation SET NOT NULL`.
11. Fonction trigger `eg_finance_contract_guard()` + trigger `trg_finances_contract_guard`.
12. Contraintes CHECK `NOT VALID` : `ck_finance_type_operation_v2`, `ck_finance_montant_positive_v2`, `ck_finance_devise_v2`.

**Downgrade** : drop contraintes, triggers, fonctions `eg_finance_contract_guard`, `trg_products_contract_reference`, `eg_product_reference_guard`, `eg_next_reference`. Ne drop pas les colonnes ajoutées.

**Vérification SQL** :
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='finances'
  AND column_name IN ('type_transaction','type_operation','montant_xof','devise');
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='products'
  AND column_name='reference';
SELECT to_regclass('public.ref_counters'), to_regclass('public.finance_exchange_rates');
```

**Recommandation** : additive et largement idempotente (`IF NOT EXISTS`). Les `ALTER COLUMN ... TYPE` sont à vérifier : si la colonne est déjà du type cible, elles sont sans effet ; sinon elles réécrivent la table. À appliquer avec précaution.

---

### 2.7 `032_immobilier_v2_contract` — contrat Immobilier V2 (garde de base de données)

**Garde critique** : l'upgrade interdit toute base sauf `egs_test` et `egs_local`. Pour `egs_local`, l'utilisateur connecté doit être `postgres` (superutilisateur). Pour `egs_test`, le rôle `egs_test_user` doit exister. La base de production autre que ces deux noms est rejetée.

**Opérations** :
1. `properties`: ajoute colonnes `reference`, `titre`, `commune`, `ville`, `quartier`, `publier_vitrine` (NOT NULL DEFAULT FALSE), `titre_fige_le`, `localite_statut` (NOT NULL DEFAULT 'HOLD'), `localite_preuve_reference`, `localite_anstat_code`, `localite_verifiee_le`, `localite_verifiee_par`. `ALTER COLUMN reference/titre DROP NOT NULL`. `UPDATE ... SET localite_statut='HOLD', ...`.
2. Crée `immobilier_types_bien` (17 valeurs semencées), `immobilier_reference_counters`, `immobilier_statut_transitions` (18 transitions), `properties_audit` (audit append-only, owner `postgres`).
3. Index sur `properties_audit(property_id, occurred_at)` et `(request_id)`.
4. Contraintes : `ck_property_statut_v2`, `ck_property_localite_statut_v2`, `ck_property_localite_contract_v2`, FK `fk_properties_type_bien_v2`, uniques `uq_properties_titre_v2`, `uq_properties_reference_v2`.
5. Fonctions : `eg_immobilier_next_reference`, `eg_immobilier_type_label`, `eg_immobilier_derive_title`, `eg_immobilier_audit_insert`, `eg_immobilier_property_guard`, `eg_immobilier_property_audit`, `eg_immobilier_record_refusal`, `eg_immobilier_audit_no_mutation`.
6. Triggers sur `properties` (guard, audit) et sur `properties_audit` (immutable, no truncate).
7. Grants : `egs_app` lit `properties_audit`, `immobilier_types_bien`, `immobilier_statut_transitions` sur `egs_local`.
8. Validation finale (DO block) : 18 transitions, 17 types, pas de VERIFIEE sans référence/titre, pas de doublon de titre.

**Downgrade** : uniquement sur `egs_test`, refuse si `properties` contient des lignes. Drop triggers, tables, fonctions, contraintes, recrée les anciennes contraintes `ck_property_statut` et `ck_property_type`, drop `immobilier_types_bien`, drop colonne `titre_fige_le`.

**Vérification SQL** :
```sql
SELECT current_database(), current_user;
-- doit être egs_local / postgres ou egs_test / egs_test_user

SELECT to_regclass('public.immobilier_types_bien'),
       to_regclass('public.immobilier_reference_counters'),
       to_regclass('public.immobilier_statut_transitions'),
       to_regclass('public.properties_audit');
SELECT count(*) FROM public.immobilier_types_bien;  -- attendu 17
SELECT count(*) FROM public.immobilier_statut_transitions;  -- attendu 18
```

**Recommandation** : cette migration a une garde de base de données stricte. Sur une base restaurée qui n'est ni `egs_test` ni `egs_local`, elle ne peut pas s'appliquer. Il faut confirmer le nom de la base cible avant toute action.

---

### 2.8 `033_api_performance_indexes` — index partiels API

**Opérations** (`CREATE INDEX IF NOT EXISTS`, idempotentes) :

| Index | Table | Colonnes | Condition |
|---|---|---|---|
| `idx_properties_active_created` | `properties` | `created_at DESC, id` | `deleted_at IS NULL` |
| `idx_properties_active_status_created` | `properties` | `statut, created_at DESC, id` | `deleted_at IS NULL` |
| `idx_properties_published_created` | `properties` | `created_at DESC, id` | `deleted_at IS NULL AND publier_vitrine IS TRUE` |
| `idx_lease_contracts_active_created` | `lease_contracts` | `created_at DESC, id` | `deleted_at IS NULL` |
| `idx_lease_contracts_active_status_created` | `lease_contracts` | `statut, created_at DESC, id` | `deleted_at IS NULL` |
| `idx_rent_payments_active_created` | `rent_payments` | `created_at DESC, id` | `deleted_at IS NULL` |
| `idx_rent_payments_active_property_created` | `rent_payments` | `property_id, created_at DESC, id` | `deleted_at IS NULL` |
| `idx_rent_payments_active_contract_created` | `rent_payments` | `contract_id, created_at DESC, id` | `deleted_at IS NULL` |
| `idx_lead_campaigns_created` | `lead_campaigns` | `created_at DESC, id DESC` | (aucune) |

**Vérification SQL** :
```sql
SELECT indexname FROM pg_indexes WHERE schemaname='public'
  AND indexname LIKE 'idx_%_active%' OR indexname LIKE 'idx_%_published%'
  OR indexname = 'idx_lead_campaigns_created';
```

**Recommandation** : idempotentes, sans danger. À appliquer après les migrations de schéma auxquelles elles dépendent.

---

### 2.9 `034_add_mfa_session_state` — MFA sur auth_sessions

**Opérations** :
- `ALTER TABLE auth_sessions ADD COLUMN mfa_verified_at TIMESTAMPTZ NULL`.

**Vérification SQL** :
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='auth_sessions'
  AND column_name='mfa_verified_at';
```

**Recommandation** : colonne nullable, ajout simple. À appliquer si la table `auth_sessions` existe.

---

### 2.10 `035_foncier_integrity` — unicité active lots et attestations

**Opérations** :
1. Vérifie l'absence de doublons actifs sur `foncier_lots (ilot_id, numero_lot WHERE deleted_at IS NULL)` — échoue si doublons.
2. Vérifie l'absence de doublons actifs sur `foncier_attestations (lot_id, version WHERE deleted_at IS NULL)` — échoue si doublons.
3. Crée `uq_foncier_lots_active_ilot_numero_lot` (unique partiel).
4. Crée `uq_foncier_attestations_active_lot_version` (unique partiel).

**Downgrade** : drop les deux index.

**Vérification SQL** :
```sql
-- doublons bloquants ?
SELECT ilot_id, numero_lot, count(*) FROM foncier_lots
WHERE deleted_at IS NULL GROUP BY ilot_id, numero_lot HAVING count(*) > 1;
SELECT lot_id, version, count(*) FROM foncier_attestations
WHERE deleted_at IS NULL GROUP BY lot_id, version HAVING count(*) > 1;

-- index présents ?
SELECT indexname FROM pg_indexes WHERE schemaname='public'
  AND indexname IN ('uq_foncier_lots_active_ilot_numero_lot','uq_foncier_attestations_active_lot_version');
```

**Recommandation** : si des doublons existent, la migration échoue et il faut les archiver/corriger avant. Les index sont idempotents (`IF NOT EXISTS`).

---

### 2.11 `036_foncier_activity_logs_json` (HEAD) — changed_fields JSON

**Opérations** :
- `ALTER TABLE activity_logs ALTER COLUMN changed_fields TYPE JSON USING to_json(changed_fields)`, `existing_type=ARRAY(String)`, `existing_nullable=True`.

**Downgrade** :
- `ALTER TABLE activity_logs ALTER COLUMN changed_fields TYPE text[] USING regexp_replace(...)::text[]`, `existing_type=JSON`.

**Contexte métier** : le modèle SQLAlchemy `ActivityLog.changed_fields` est déclaré `JSON`. La colonne physique était `text[]` (array), ce qui provoque des erreurs de sérialisation sous SQLite (les tests lient une liste Python à une colonne TEXT). La migration rend le schéma PostgreSQL cohérent avec le modèle ORM et portable SQLite.

**Vérification SQL** :
```sql
SELECT pg_catalog.format_type(a.atttypid, a.atttypmod)
FROM pg_catalog.pg_attribute a
WHERE a.attrelid = 'public.activity_logs'::regclass
  AND a.attname = 'changed_fields'
  AND a.attnum > 0 AND NOT a.attisdropped;
-- attendu après 036 : json
```

**Recommandation** : c'est la tête de chaîne. L'endpoint `/ready` (backend/app/main.py:185-201) attend `alembic_version = '036_foncier_activity_logs_json'` et renvoie 503 sinon. C'est la révision finale à atteindre.

---

## 3. Matrice de vérification SQL (à exécuter sur la base restaurée)

Avant toute décision, exécuter ces requêtes en lecture seule :

```sql
-- 1. État actuel d'alembic
SELECT version_num FROM alembic_version;

-- 2. Colonnes de b350fd2b6f19 déjà présentes ?
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema='public'
  AND column_name IN ('entity_id','locataire_entity_id','proprietaire_entity_id')
ORDER BY table_name, column_name;

-- 3. FK déjà présentes ?
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint WHERE contype='f' AND conname LIKE '%_entity%';

-- 4. Index déjà présents ?
SELECT indexname FROM pg_indexes WHERE schemaname='public'
  AND indexname LIKE 'ix_%_entity_id';

-- 5. activité_logs.changed_fields type actuel
SELECT pg_catalog.format_type(a.atttypid, a.atttypmod)
FROM pg_catalog.pg_attribute a
WHERE a.attrelid='public.activity_logs'::regclass
  AND a.attname='changed_fields' AND a.attnum>0 AND NOT a.attisdropped;

-- 6. Base et utilisateur courant (garde 032)
SELECT current_database(), current_user;

-- 7. Doublons foncier (blocage 035)
SELECT ilot_id, numero_lot, count(*) FROM foncier_lots
WHERE deleted_at IS NULL GROUP BY ilot_id, numero_lot HAVING count(*)>1;
SELECT lot_id, version, count(*) FROM foncier_attestations
WHERE deleted_at IS NULL GROUP BY lot_id, version HAVING count(*)>1;

-- 8. vitrine_lots.caracteristiques type actuel
SELECT pg_catalog.format_type(a.atttypid, a.atttypmod)
FROM pg_catalog.pg_attribute a
WHERE a.attrelid='public.vitrine_lots'::regclass
  AND a.attname='caracteristiques' AND a.attnum>0 AND NOT a.attisdropped;

-- 9. Colonnes finances/products de 031
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('finances','products')
  AND column_name IN ('type_transaction','type_operation','montant_xof','devise','reference')
ORDER BY table_name, column_name;

-- 10. Index 033 déjà présents ?
SELECT indexname FROM pg_indexes WHERE schemaname='public'
  AND indexname LIKE 'idx_%_active%' OR indexname LIKE 'idx_%_published%'
  OR indexname='idx_lead_campaigns_created';
```

---

## 4. Recommandations : stamp vs apply vs correction manuelle

### Règle générale
- **`alembic stamp <rev>`** : met à jour `alembic_version` sans toucher au schéma. À utiliser quand les objets physiques existent déjà et correspondent à la révision.
- **`alembic upgrade`** : exécute le DDL. À utiliser uniquement quand les objets sont absents ou que le DDL est idempotent et sans risque.
- **Correction manuelle (DDL idempotent `IF NOT EXISTS`)** : à utiliser quand la migration échoue sur un objet existant mais que d'autres objets de la même révision manquent encore.

### Cas par cas

| Situation | Action recommandée |
|---|---|
| `users.entity_id` existe déjà (erreur `DuplicateColumn`) | Ne pas relancer `b350fd2b6f19` en l'état. Vérifier chaque colonne/FK/index de la liste 2.2. Créer manuellement uniquement les objets manquants avec `IF NOT EXISTS`, puis `alembic stamp b350fd2b6f19`. |
| `activity_logs.changed_fields` est déjà `JSON` | `alembic stamp 036_foncier_activity_logs_json` (HEAD atteint, pas de DDL nécessaire). |
| `activity_logs.changed_fields` est encore `text[]` | Appliquer `036` (convertit `text[]` → `JSON` via `to_json`). |
| Colonnes `030` déjà présentes sur `properties` | `030` est `IF NOT EXISTS`, application sans danger, puis estampiller. |
| `032` sur base autre que `egs_test`/`egs_local` | Bloquée par la garde. Confirmer le nom de la base cible. |
| Doublons sur `foncier_lots`/`foncier_attestations` | `035` échoue. Archiver/corriger les doublons avant d'appliquer `035` et `036`. |

### Ordre critique (critical path)

```
6c21cb4b996d  (état actuel, estampillé)
    ↓
b350fd2b6f19  (liens entités — colonnes déjà présentes : vérifier, compléter manuellement si besoin, puis stamp)
    ↓
028           (vitrine_lots caracteristiques — vérifier type, appliquer si json→varchar[])
    ↓
029           (HOLD — confirmer si applicable, sinon traiter comme un trou dans la chaîne)
    ↓
030           (properties colonnes compat — IF NOT EXISTS, appliquer puis stamp)
    ↓
031           (finance/products — additive, appliquer puis stamp)
    ↓
032           (Immobilier V2 — garde base egs_local/egs_test, appliquer puis stamp)
    ↓
033           (index API — IF NOT EXISTS, appliquer puis stamp)
    ↓
034           (mfa_verified_at — appliquer puis stamp)
    ↓
035           (foncier unicité — vérifier doublons, appliquer puis stamp)
    ↓
036           (activity_logs JSON — appliquer puis stamp = HEAD)
```

> **Note sur 029** : `029` est en HOLD et son down_revision est `028`, celui de `030` est `029`. Si `029` n'est jamais appliquée, la chaîne linéaire est interrompue entre `028` et `030`. Il faut décider : soit appliquer `029` (créer les tables auth), soit ré-chaîner `030` sur `028` (ce qui modifierait une migration — interdit par les contraintes de l'audit). Dans l'immédiat, `029` est un blocage potentiel pour l'estampillage séquentiel.

---

## 5. Procédure recommandée

Toutes les commandes sont exécutées **une à a une**, avec vérification entre chaque. Aucune commande n'est exécutée deux fois sans confirmation du résultat précédent. Ce document ne génère pas de script Alembic exécutable ; il liste les commandes manuelles à lancer par l'opérateur.

**Prérequis** :
1. Sauvegarde vérifiée de la base PostgreSQL restaurée (variable `EGS_BACKUP_VERIFIED=1`).
2. Approbation explicite des migrations (`EGS_MIGRATION_APPROVED=1`).
3. `DATABASE_URL` pointant vers la base restaurée, rôle applicatif (non superutilisateur sauf `egs_local` via `postgres` pour 032).

### Étape 1 — Constater l'état actuel

```bash
cd /home/soma/gnamba-project/backend
alembic current
```

Vérifier que la sortie affiche `6c21cb4b996d`. Exécuter les requêtes de la section 3 pour inventorier l'état physique.

### Étape 2 — Traiter b350fd2b6f19 (colonnes entités)

Vérifier quelles colonnes/FK/index de la liste 2.2 manquent. Pour chaque objet manrant, créer manuellement (exemple) :

```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS entity_id UUID;
CREATE INDEX IF NOT EXISTS ix_users_entity_id ON public.users(entity_id);
ALTER TABLE public.users ADD CONSTRAINT fk_users_entity FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE SET NULL;
```

Répéter pour chaque paire manquante de la liste 2.2. Puis :

```bash
alembic stamp b350fd2b6f19
alembic current
```

Vérifier que `alembic current` affiche maintenant `b350fd2b6f19`.

### Étape 3 — Traiter 028 (vitrine_lots)

Vérifier le type de `caracteristiques` (requête 3.8). Si déjà `varchar[]`/`text[]`, estampiller directement :

```bash
alembic stamp 028_normalize_vitrine_lots_types
```

Sinon (JSON/JSONB), vérifier l'absence de valeurs non-tableau ou non-chaîne, puis appliquer la migration (ou exécuter l'équivalent SQL de sa logique de conversion) et estampiller.

```bash
alembic current
```

### Étape 4 — Décider de 029 (HOLD)

Confirmer si `auth_password_reset_tokens` et `auth_rate_limit_events` doivent exister. Si oui, appliquer `029`. Sinon, noter le trou dans la chaîne et consulter l'architecte avant de continuer (030 et suivantes dépendent de 029 dans le graphe down_revision).

Si appliquée :

```bash
alembic upgrade 029_auth_password_lifecycle
alembic current
```

### Étape 5 — Appliquer 030 à 036 séquentiellement

Pour chaque révision, dans l'ordre `030` → `031` → `032` → `033` → `034` → `035` → `036` :

1. Vérifier les prérequis spécifiques (voir section 4) :
   - `032` : confirmer `current_database()` ∈ {egs_test, egs_local} et utilisateur approprié.
   - `035` : confirmer l'absence de doublons actifs sur `foncier_lots` et `foncier_attestations`.
2. Exécuter :

```bash
alembic upgrade <revision>
```

3. Vérifier :

```bash
alembic current
```

La sortie doit afficher la révision tout juste appliquée.

### Étape 6 — Atteindre HEAD et vérifier le contrat API

Après `036` :

```bash
alembic current
-- doit afficher : 036_foncier_activity_logs_json
```

Vérifier le type de `activity_logs.changed_fields` (doit être `json`). Puis tester l'endpoint de readiness :

```bash
curl -s http://localhost:8000/ready
-- attendu : {"status":"ready","service":"egs-local-api"}
```

Si 503 avec `current_revision` différent de `036_foncier_activity_logs_json`, ne pas forcer : reprendre à l'étape de la révision concernée.

### Étape 7 — Tests

Lancer la suite backend :

```bash
cd /home/soma/gnamba-project/backend
pytest -q
-- attendu : 242 passed, 0 failed, 15 skipped (résultat de référence du 2026-10-30)
```

---

## 6. Points ouverts et risques

1. **029 en HOLD** : crée un trou dans la chaîne `down_revision` entre 028 et 030. Décider si elle est appliquée ou si la chaîne est réarchitecturée (interdit par les contraintes actuelles sans modification de migration).
2. **032 garde de base** : refuse toute base qui n'est pas `egs_test` ou `egs_local`. Sur une base restaurée avec un autre nom, 032 et toutes les révisions suivantes sont bloquées.
3. **035 doublons** : si des doublons actifs existent sur `foncier_lots` ou `foncier_attestations`, la migration échoue et doit être précédée d'un nettoyage métier.
4. **b350fd2b6f19 déjà partiellement appliquée** : `DuplicateColumn` signifie que le schéma physique est en avance sur `alembic_version`. L'estampillage doit être précédé d'un inventaire exhaustif des objets de 2.2 pour ne pas laisser d'index ou de FK orphelins.
5. **Aucune modification de migration, backend ou docker-compose.yml** n'est autorisée dans le cadre de cet audit. Toute correction de schéma doit se faire par SQL manuel idempotent ou par `alembic stamp`.

---

**Fin de l'audit.** Ce document doit être conservé avec la preuve d'exécution de chaque étape (sorties de `alembic current`, requêtes de vérification, réponse de `/ready`, résultats des tests).