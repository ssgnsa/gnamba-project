# 🔍 Analyse Comparative Base de Données vs Modules — Somagro ERP

> Note operatoire: ce document est un rapport d'analyse cible Somagro.
> Pour les commandes et la bascule des environnements, utiliser `README.md` + `scripts/workspace-stack.sh`.

**Date** : 2026-04-04
**Source** : Supabase Local (`supabase_db_somagro-erp`, PostgreSQL 17.6)
**Cible** : Somagro Frontend (`somagro-erp/app/`)

---

## 1. Cartographie DB → Modules Frontend

| Module Frontend                    | Tables DB attendues                                              | Tables présentes                | Statut                                   |
| ---------------------------------- | ---------------------------------------------------------------- | ------------------------------- | ---------------------------------------- |
| **🌾 Crops → Fields**              | `fields`, `crop_cycles`                                          | ✅ `fields`, `crop_cycles`      | ✅ Complet                               |
| **🌾 Crops → Harvests**            | `harvests`, `crop_cycles`                                        | ✅ `harvests`, `crop_cycles`    | ✅ Complet                               |
| **🌾 Crops → Interventions**       | `crop_interventions`, `crop_cycles`, `inventory_items`, `users`  | ✅ Toutes présentes             | ✅ Complet                               |
| **🐄 Livestock → Animals**         | `animals`, `lots`, `tenants`                                     | ✅ `animals`, `lots`, `tenants` | ✅ Complet                               |
| **🐄 Livestock → Health**          | `health_records`, `animals`, `lots`, `inventory_items`, `users`  | ✅ Toutes présentes             | ✅ Complet                               |
| **🐄 Livestock → Lots**            | `lots`, `species`, `breeds`, `buildings`                         | ✅ Toutes présentes             | ✅ Complet                               |
| **🏗️ Constructions → Buildings**   | `buildings`, `building_types`, `tenants`                         | ✅ Toutes présentes             | ✅ Complet                               |
| **🏗️ Constructions → Projects**    | `construction_projects`, `buildings`, `tenants`                  | ✅ `construction_projects`      | ✅ Complet                               |
| **🏗️ Constructions → Maintenance** | `buildings`, `equipment`                                         | ✅ Présentes                    | ⚠️ Page existe, formulaires equipment OK |
| **📦 Inventory**                   | `inventory_items`, `inventory_categories`, `inventory_movements` | ✅ Toutes présentes             | ✅ Complet                               |
| **📦 Inventory → Movements**       | `inventory_movements`, `inventory_items`, `users`                | ✅ Présentes                    | ✅ Complet                               |
| **💰 Finance**                     | `financial_transactions`, `users`, `tenants`                     | ✅ Présentes                    | ✅ Complet                               |
| **💰 Sales**                       | `sales`, `sale_items`, `customers`, `tenants`                    | ✅ Toutes présentes             | ✅ Complet                               |
| **📋 Tasks**                       | `tasks`, `users`, `tenants`                                      | ✅ Présentes                    | ✅ Complet                               |
| **⚙️ Settings**                    | `tenants`, `users`                                               | ✅ Présentes                    | ✅ Complet                               |
| **📸 Album**                       | (photos via Storage)                                             | —                               | ✅ Frontend existe                       |
| **📝 Blog**                        | (articles via Storage/DB?)                                       | —                               | ✅ Frontend existe                       |
| **📊 Analytics**                   | Agrégations multi-tables                                         | —                               | ✅ Dashboard API existe                  |

---

## 2. Tables Orphelines (DB sans module UI)

| Table               | Colonnes | FKs                                                  | Usage prévu                                       | Priorité                                                     |
| ------------------- | -------- | ---------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| `counting_sessions` | 15       | 3 (`camera_id`, `lot_id`, `tenant_id`)               | Comptage bétail via caméras                       | 🟡 Moyen — Module AI/counting API existe mais pas de page UI |
| `livestock_events`  | 12       | 4 (`animal_id`, `lot_id`, `created_by`, `tenant_id`) | Événements d'élevage (naissance, mort, transfert) | 🟠 Élevé — Données critiques sans UI dédiée                  |
| `equipment`         | 14       | 2 (`building_id`, `tenant_id`)                       | Équipement des bâtiments                          | 🟡 Moyen — Formulaire CRUD existe mais pas de page list      |
| `cameras`           | 12       | 2 (`building_id`, `tenant_id`)                       | Caméras de surveillance                           | 🟡 Moyen — Lié à `counting_sessions`                         |

---

## 3. Tables Critiques Sans RLS — 🔴 RISQUE SÉCURITÉ

Sur **26 tables**, seulement **3 ont des policies RLS** :

| Table                | RLS | Politique                                             | Risque          |
| -------------------- | --- | ----------------------------------------------------- | --------------- |
| `tenants`            | ✅  | `tenant_self` — Chaque tenant ne voit que ses données | ✅ OK           |
| `users`              | ✅  | `tenant_isolation` — Isolation par tenant             | ✅ OK           |
| `tasks`              | ✅  | `tasks_tenant` — Isolation par tenant                 | ✅ OK           |
| **23 autres tables** | ❌  | **AUCUNE POLICY**                                     | 🔴 **CRITIQUE** |

### Tables sans RLS (données exposées à tous les authenticated) :

```
animals, breeds, building_types, buildings, cameras, construction_projects,
counting_sessions, crop_cycles, crop_interventions, customers, equipment,
fields, financial_transactions, harvests, health_records, inventory_categories,
inventory_items, inventory_movements, livestock_events, lots, sale_items,
sales, species
```

**Impact** : Un utilisateur d'un tenant peut voir/modifier les données d'un autre tenant (élevage, récoltes, finances, ventes).

---

## 4. Index Missing — 🔴 PERFORMANCE

Sur **53 foreign keys**, **52 n'ont pas d'index** (seul `species.tenant_id` en a un).

### Impact :

- **Jointures lentes** dès que les données augmentent (scan séquentiel sur chaque FK)
- **DELETE cascade lent** — PostgreSQL doit scanner toute la table enfant pour vérifier les FK
- **Requêtes multi-tenant** — chaque `WHERE tenant_id = ?` fait un full table scan

### FKs critiques sans index (par fréquence d'usage) :

| Colonne FK      | Table                                           | Table référencée | Usage                                        |
| --------------- | ----------------------------------------------- | ---------------- | -------------------------------------------- |
| `tenant_id`     | 22 tables                                       | `tenants`        | Isolation multi-tenant (TOUTES les requêtes) |
| `crop_cycle_id` | `harvests`, `crop_interventions`                | `crop_cycles`    | Dashboard + pages Crops                      |
| `lot_id`        | `animals`, `lots`, `health_records`             | `lots`           | Pages Livestock + Health                     |
| `animal_id`     | `health_records`, `livestock_events`            | `animals`        | Page Health                                  |
| `building_id`   | `cameras`, `equipment`, `construction_projects` | `buildings`      | Page Constructions                           |

---

## 5. Analyse des Contraintes et Intégrité

### Tables avec contraintes UNIQUE

| Table             | Colonne unique          | Usage                            |
| ----------------- | ----------------------- | -------------------------------- |
| `animals`         | `identification_number` | ✅ Identifiant unique par animal |
| `inventory_items` | (composite ?)           | À vérifier                       |
| `lots`            | (composite ?)           | À vérifier                       |
| `sales`           | (composite ?)           | À vérifier                       |
| `species`         | (composite ?)           | À vérifier                       |
| `tenants`         | (PK)                    | ✅                               |
| `users`           | (PK)                    | ✅                               |

### Arbre de dépendances (cascade DELETE)

```
tenants (racine)
├── species
│   └── breeds
│       └── lots
│           ├── animals
│           │   ├── health_records
│           │   └── livestock_events
│           ├── health_records
│           ├── livestock_events
│           └── counting_sessions
├── building_types
│   └── buildings
│       ├── cameras → counting_sessions
│       ├── construction_projects
│       └── equipment
├── fields
│   └── crop_cycles
│       ├── crop_interventions
│       └── harvests
├── inventory_categories
│   └── inventory_items
│       ├── crop_interventions (product_id)
│       ├── health_records (medication_id)
│       └── inventory_movements
├── customers
│   └── sales
│       └── sale_items
├── users
│   ├── tasks (assigned_to)
│   ├── crop_interventions (applied_by)
│   ├── financial_transactions (created_by)
│   ├── health_records (administered_by)
│   ├── inventory_movements (created_by)
│   └── livestock_events (created_by)
├── lots (building_id → buildings)
├── financial_transactions
└── tasks
```

**Risque** : Supprimer un `tenant` cascade sur **TOUTES** les tables (23 tables liées directement ou indirectement).

---

## 6. Colonnes par Module — Analyse de Complétude

### ✅ Modules Complets (toutes les colonnes utilisées)

| Module        | Page                           | Tables               | Colonnes requises                                       | Colonnes DB | Écart                             |
| ------------- | ------------------------------ | -------------------- | ------------------------------------------------------- | ----------- | --------------------------------- |
| Fields        | `crops/fields/page.tsx`        | `fields`             | 6 (`id, name, area_hectares, soil_type, status, notes`) | 8           | ✅ notes ajouté récemment         |
| Harvests      | `crops/harvests/page.tsx`      | `harvests`           | 7 (+ `crop_cycles`)                                     | 9           | ✅ notes inclus                   |
| Interventions | `crops/interventions/page.tsx` | `crop_interventions` | 8 (+ relations)                                         | 10          | ✅ notes, applied_by inclus       |
| Animals       | `livestock/animals/page.tsx`   | `animals`            | 5 (+ `lots`)                                            | 9           | ✅ notes, rfid_tag, lot_id inclus |
| Health        | `livestock/health/page.tsx`    | `health_records`     | 12 (+ relations)                                        | 15          | ✅ complet                        |
| Lots          | `livestock/lots/page.tsx`      | `lots`               | 5 (+ relations)                                         | 14          | ✅ notes, batch_code, etc.        |

### ⚠️ Modules avec colonnes non exploitées

| Module  | Table     | Colonnes DB non utilisées dans la page     | Impact                                                     |
| ------- | --------- | ------------------------------------------ | ---------------------------------------------------------- |
| Fields  | `fields`  | `gps_coordinates` (si existe), `tenant_id` | Faible — `tenant_id` est géré par le middleware            |
| Animals | `animals` | `rfid_tag`                                 | Moyen — Champ présent en DB mais pas affiché dans la liste |
| Lots    | `lots`    | `initial_count`, `batch_code`              | Faible — visible uniquement en détail/edit                 |

---

## 7. État des Données

**Toutes les 26 tables sont vides** (0 row chacune).

Cela signifie que :

- ✅ Le schéma est prêt mais aucun data entry n'a été fait
- ⚠️ Les formulaires CRUD n'ont jamais été testés en conditions réelles
- ⚠️ Les FK constraints n'ont jamais été validées par l'insertion de données

---

## 8. Synthèse — Actions Recommandées

| Priorité | Action                                                                                              | Impact                       | Effort |
| -------- | --------------------------------------------------------------------------------------------------- | ---------------------------- | ------ |
| 🔴 P0    | **Appliquer RLS sur les 23 tables sans policy**                                                     | Sécurité multi-tenant        | Moyen  |
| 🔴 P0    | **Créer indexes sur les 52 FK sans index**                                                          | Performance                  | Faible |
| 🟠 P1    | **Module `livestock_events`** — Créer page UI                                                       | Données critiques orphelines | Moyen  |
| 🟠 P1    | **Module `counting_sessions`** — Connecter à l'API AI                                               | Fonctionnalité IA inutilisée | Moyen  |
| 🟡 P2    | **Peupler les tables de référence** (`species`, `breeds`, `building_types`, `inventory_categories`) | Permettre le CRUD            | Faible |
| 🟡 P2    | **Tester les formulaires CRUD** avec des données réelles                                            | Valider l'intégrité FK       | Faible |
| 🟡 P2    | **Page list `equipment`** — CRUD existe mais pas de page                                            | Complétude Constructions     | Faible |

---

**Fin de l'analyse** — 2026-04-04
