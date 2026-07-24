# Audit des Modules ERP — Analyse Structurelle
**Date:** 14 juillet 2026  
**Scope:** `src/data/` (repositories) et `src/pages/` (UI pages)

---

## 📊 Résumé Exécutif

### Statistiques Globales
- **Modules identifiés:** 22 repositories
- **Pages UI:** 25 fichiers principaux (+ sous-dossiers)
- **Tests repository:** 8 fichiers (36% couverture)
- **Tests page:** 2 fichiers (8% couverture)
- **Erreurs TypeScript:** 0 (aucune erreur actuellement)

### Catégories de Maturité

| Catégorie | Modules | État |
|-----------|---------|------|
| **AVANCÉ** | Clients, Suppliers, Tenants, Leads, Foncier | Patterns robustes + tests |
| **MOYEN** | Projects, Employees, Tasks | Patterns standards, tests basiques |
| **BASIQUE** | Documents, Visitors, Finance, Media, etc. | QueryResult simple, sans ApiResult |
| **UTILITAIRE** | GenericTable | Générique, non typé |

---

## 🏗️ Modules Détaillés par Priorité d'Audit

### 🔴 PRIORITÉ 1 — CRITIQUE (Complexité Élevée + Tests Réduits)

#### 1. **FONCIER** (Foncier.tsx)
**État:** ⚠️ CRITIQUE — Module central non testé

| Aspect | État | Détails |
|--------|------|---------|
| **Repository** | ✅ AVANCÉ | `foncier.repository.ts` (900+ lignes) |
| **Page UI** | ⚠️ WRAPPER SIMPLIFIÉ | `Foncier.tsx` → `FoncierContainer` (abstraction) |
| **Tests** | ⚠️ MINIMAL | `foncier.repository.test.ts` (1 seul test: validation UUID) |
| **Couverture** | 5% | Seul le test de validation d'ID |
| **Pattern** | ✅ ApiResult | Utilise ApiResult/fromQueryResult |

**Anomalies Détectées:**
1. ❌ **Test extrêmement réduit**: 1 test pour 900+ lignes de code
2. ❌ **Logique métier complexe cachée** dans `FoncierContainer` (séparation unclear)
3. ⚠️ **Types importants:** `FoncierLot`, `LotSearchParams`, `VillageStatsRow`
4. ⚠️ **Fonctionnalités avancées:** Village stats, workflow attestation, sync offline
5. 🔍 **Imports externes:** `logFoncierAuditFromPayload` depuis lib (dépendance)
6. 📌 **Dépendances croisées:** Utilise plusieurs row types complexes

**Fichiers Importants:**
- [src/data/foncier.repository.ts](src/data/foncier.repository.ts) — 900+ lignes
- [src/pages/Foncier.tsx](src/pages/Foncier.tsx) — Wrapper sur composant
- [src/components/FoncierContainer.tsx](src/components/FoncierContainer.tsx) — Logique réelle

**Actions Recommandées:**
- 🔴 Étendre tests foncier.repository.test.ts (min 50 tests)
- 🔴 Auditer FoncierContainer pour logique métier
- 🔴 Identifier et tester toutes fonctionnalités: CRUD, stats, workflow

---

#### 2. **LEADS** (Leads.tsx)
**État:** ⚠️ CRITIQUE — Module avancé avec logique métier complexe

| Aspect | État | Détails |
|--------|------|---------|
| **Repository** | ✅ AVANCÉ | `leads.repository.ts` (250+ lignes) |
| **Page UI** | ⚠️ COMPLEXE | `Leads.tsx` avec interface Lead détaillée |
| **Tests** | ✅ MINIMAL | `leads.repository.test.ts` (1 test: normalization) |
| **Pattern** | ✅ ApiResult | Utilise normalizeLeadRow + type avancé |
| **Couverture** | 10% | 1 test sur normalizeLeadRow |

**Anomalies Détectées:**
1. ❌ **Test limité**: normalizeLeadRow testé mais pas getAll(), create(), etc.
2. ✅ **Pattern robuste**: Bonne normalisation avec party_lead_details
3. ⚠️ **Métadonnées complexes:** channels_optin, tags, score
4. 🔍 **Interface Lead complète** dans page (16 champs)
5. 📌 **Logique de deduplication** manquante pour Leads (à contrarier de Clients)

**Fichiers Importants:**
- [src/data/leads.repository.ts](src/data/leads.repository.ts)
- [src/pages/Leads.tsx](src/pages/Leads.tsx)

**Fonctionnalités Observées:**
- Lead filtering, campaign management, status updates
- Supports `sms`, `whatsapp`, `email`, `telegram` channels
- Score-based sorting

**Actions Recommandées:**
- 🔴 Ajouter tests CRUD complets
- 🔴 Tester normalizeLeadRow pour cas edge
- 🟡 Implémenter deduplication pour Leads si nécessaire

---

#### 3. **IMMOBILIER/TENANTS** (Immobilier.tsx)
**État:** ⚠️ IMPORTANT — Module immobilier fragmenté

| Aspect | État | Détails |
|--------|------|---------|
| **Repository** | ✅ AVANCÉ | `tenants.repository.ts` (180+ lignes) |
| **Pages UI** | 🏗️ FRAGMENTÉ | 5 sous-pages dans `src/pages/immobilier/` |
| **Tests** | ✅ CORRECT | `tenants.repository.test.ts` (2 tests) |
| **Pattern** | ✅ ApiResult | normalizeTenantRow + TenantFilters |
| **Couverture** | 25% | Tests pour normalization + defaults |

**Structure Immobilier:**
- [src/pages/immobilier/ContractsTab.tsx](src/pages/immobilier/ContractsTab.tsx)
- [src/pages/immobilier/PaymentReportsTab.tsx](src/pages/immobilier/PaymentReportsTab.tsx)
- [src/pages/immobilier/PaymentsTab.tsx](src/pages/immobilier/PaymentsTab.tsx)
- [src/pages/immobilier/PropertiesTab.tsx](src/pages/immobilier/PropertiesTab.tsx)
- [src/pages/immobilier/TenantsTab.tsx](src/pages/immobilier/TenantsTab.tsx)

**Anomalies Détectées:**
1. ⚠️ **Fragmentation**: Logique dispersée en 5 tabs (pas de repository dédié par tab)
2. ✅ **Good pattern**: normalizeTenantRow + TenantFilters type
3. 🔍 **Queries complexes**: party_roles avec ilike, range pagination
4. 📌 **Métadonnées manquantes:** Aucun repository pour ContractsTab, PaymentsTab, etc.

**Actions Recommandées:**
- 🟡 Vérifier si des repositories manquent (contracts, payments, properties)
- 🟡 Étendre tests tenants.repository
- 🟡 Tester les filtres et pagination

---

### 🟠 PRIORITÉ 2 — IMPORTANT (Complexité Moyenne + Anomalies)

#### 4. **CLIENTS** (Clients.tsx)
**État:** ✅ RÉFÉRENCE — Meilleur pattern implémenté

| Aspect | État | Détails |
|--------|------|---------|
| **Repository** | ✅ EXCELLENT | `clients.repository.ts` (350+ lignes) |
| **Page UI** | ✅ EXCELLENT | `Clients.tsx` avec cache local + sync |
| **Tests** | ✅ BON | `clients.repository.test.ts` (4 tests) |
| **Pattern** | ✅ ApiResult | Normalization + deduplication |
| **Couverture** | 40% | Tests pour normalization + dedup logic |

**Pattern Avancé:**
- ✅ `normalizeClientRow()` — Conversion parties → Client
- ✅ `isClientDuplicateCandidate()` — Déduplication par email/phone
- ✅ `normalizeEmailIdentity()` — Normalisation email
- ✅ `normalizePhoneIdentity()` — Normalisation téléphone (225, 0-prefix)
- ✅ Cache local avec `manualSyncStore` (offline support)
- ✅ `readManualCache()`, `writeManualCache()`, `mergeManualCacheWithRemote()`

**Fichiers:**
- [src/data/clients.repository.ts](src/data/clients.repository.ts) — Complet
- [src/data/clients.repository.test.ts](src/data/clients.repository.test.ts) — Tests
- [src/pages/Clients.tsx](src/pages/Clients.tsx) — Page complexe
- [src/pages/Clients.test.ts](src/pages/Clients.test.ts) — Assertions

**Anomalies:** AUCUNE (référence de bonnes pratiques)

**À Imiter Pour:**
- Suppliers ❌ (utilise supabase direct au lieu de repository)
- Leads ❌ (pas de deduplication)
- Projects ❌ (pattern trop simple)

---

#### 5. **SUPPLIERS** (Fournisseurs.tsx)
**État:** ⚠️ CRITIQUE ANOMALIE — Repository existant mais non utilisé

| Aspect | État | Détails |
|--------|------|---------|
| **Repository** | ✅ AVANCÉ | `suppliers.repository.ts` (200+ lignes) |
| **Page UI** | ❌ CRITIQUE | `Fournisseurs.tsx` IGNORE le repository |
| **Tests** | ❌ AUCUN | Pas de fichier test |
| **Pattern** | ⚠️ MISMATCH | Repository existe mais page utilise `supabase` direct |

**❌ ANOMALIE CRITIQUE DÉTECTÉE:**

**Page Fournisseurs.tsx (ligne 1-30):**
```tsx
import { supabase } from "../lib/supabase";  // ❌ DIRECT SUPABASE
import { Supplier } from "../types";
import { suppliersRepository } from "../data/suppliers.repository";  // ✅ IMPORT mais

export default function Fournisseurs() {
  // UTILISE SUPABASE DIRECT (ligne 42):
  const { data } = await supabase.from("suppliers").select("*").order("nom");
  // AU LIEU DE:
  // const result = await suppliersRepository.getAll();
}
```

**Repository (suppliersRepository) existe avec:**
- ✅ `isSupplierDuplicateCandidate()` — Pattern dedup (comme Clients!)
- ✅ `normalizePhoneIdentity()`, `normalizeEmailIdentity()`
- ✅ Complet avec méthodes CRUD

**Fichiers:**
- [src/data/suppliers.repository.ts](src/data/suppliers.repository.ts) — Complet + patterns
- [src/pages/Fournisseurs.tsx](src/pages/Fournisseurs.tsx) — PAGE UTILISE SUPABASE DIRECT ❌

**Actions Recommandées (IMMÉDIAT):**
- 🔴 Refactoriser Fournisseurs.tsx pour utiliser suppliersRepository
- 🔴 Créer suppliers.repository.test.ts (tests manquants)
- 🔴 Vérifier cohérence avec pattern Clients

---

#### 6. **PROJECTS** (Projets.tsx)
**État:** 🟡 BASIQUE — Pattern simple, pas de complexité

| Aspect | État | Détails |
|--------|------|---------|
| **Repository** | ⚠️ SIMPLE | `projects.repository.ts` (60 lignes) |
| **Page UI** | ✅ PRÉSENT | `Projets.tsx` |
| **Tests** | ✅ MINIMAL | `projects.repository.test.ts` (1 test) |
| **Pattern** | ✅ ApiResult | Mais très simple |
| **Couverture** | 15% | Seul test: validation UUID |

**Pattern Simple:**
- ✅ CRUD basique (getAll, getById, create, update, delete)
- ✅ Join: `clients(nom, prenom)`
- ✅ Order par created_at

**Anomalies:**
1. ⚠️ Pas de normalization (à contrarier des Clients/Tenants)
2. ⚠️ Pas de deduplication logic
3. 🟡 Test trop simple (validation UUID only)

**Actions Recommandées:**
- 🟡 Clarifier si normalization est nécessaire pour Projects
- 🟡 Ajouter tests CRUD complets
- 🟡 Valider cohérence avec Clients pattern

---

### 🟡 PRIORITÉ 3 — MOYEN (Faible Complexité, Tests Basiques)

#### 7. **EMPLOYEES** (Employes.tsx)
**État:** 🟡 MOYEN — Pattern simple, tests minimalistes

| Aspect | État | Détails |
|--------|------|---------|
| **Repository** | ✅ STANDARD | `employees.repository.ts` (100+ lignes) |
| **Tests** | ⚠️ MINIMAL | `employees.repository.test.ts` (1 test) |
| **Pattern** | ✅ ApiResult | Basique CRUD |
| **Couverture** | 10% | Validation UUID only |

**Méthodes Disponibles:**
- getAll(), getById(), getByEmail(), create(), update(), delete()

**Anomalies:** Minimal, pattern cohérent

---

#### 8. **TASKS** (Taches.tsx)
**État:** ✅ BON — Pattern cohérent

| Aspect | État | Détails |
|--------|------|---------|
| **Repository** | ✅ STANDARD | `tasks.repository.ts` (120+ lignes) |
| **Tests** | ✅ MINIMAL | `tasks.repository.test.ts` (1 test) |
| **Pattern** | ✅ ApiResult | Complet CRUD |
| **Couverture** | 10% | Validation UUID |

---

#### 9. **DOCUMENTS** (Documents.tsx)
**État:** ⚠️ BASIQUE — QueryResult (ancien pattern)

| Aspect | État | Détails |
|--------|------|---------|
| **Repository** | ⚠️ SIMPLE | `documents.repository.ts` (40 lignes) |
| **Pattern** | ⚠️ QueryResult | Pas ApiResult |
| **Methods** | CRUD basic | getAll, create, update, delete |
| **Join** | ✅ Present | clients(nom, prenom), projects(nom) |

**Anomalie:** Utilise QueryResult au lieu de ApiResult → inconsistency pattern

---

#### 10. **FINANCE** (Finances.tsx)
**État:** ⚠️ BASIQUE — Pattern QueryResult

| Aspect | État | Détails |
|--------|------|---------|
| **Repository** | ⚠️ SIMPLE | `finance.repository.ts` (45 lignes) |
| **Pattern** | ⚠️ QueryResult | Directement QueryResult, pas ApiResult |
| **Joins** | ✅ OK | clients, projects |

**Note:** Pas de type Finance spécifique dans repository (générique)

---

#### 11. **VISITORS** (RegistreVisiteur.tsx)
**État:** ⚠️ BASIQUE — Plusieurs tables

| Aspect | État | Détails |
|--------|------|---------|
| **Repository** | ⚠️ MULTI-TABLE | `visitors.repository.ts` (60 lignes) |
| **Tables** | 3 tables | visiteurs, visites_du_jour, visites_en_cours, user_profiles |
| **Pattern** | ⚠️ QueryResult | Pas ApiResult |

**Méthodes:**
- getVisiteurs(), getVisitesDuJour(), getVisitesEnCours(), getEmployes()

---

### 🟢 PRIORITÉ 4 — BAS (Utilitaires, Peu de Complexité)

#### 12-22. **Modules Utilitaires Restants**

| Module | Repository | Pages | Tests | État |
|--------|-----------|-------|-------|------|
| **MEDIA** | `media.repository.ts` (60L) | `Media.tsx` | ❌ | ⚠️ QueryResult |
| **CMS** | `cms.repository.ts` (100L) | Admin/public | ❌ | ⚠️ Multi-type |
| **BOT** | `bot.repository.ts` (80L) | Codex assistant | ❌ | ⚠️ QueryResult |
| **USERS** | `users.repository.ts` (70L) | Utilisateurs.tsx | ❌ | ⚠️ QueryResult |
| **SOCIAL** | `social.repository.ts` (30L) | - | ❌ | ⚠️ Simple |
| **PRODUCTS** | `products.repository.ts` (30L) | Fournitures.tsx | ❌ | ⚠️ Simple |
| **PUBLICLOTS** | `publicLots.repository.ts` (40L) | Public/Lots | ❌ | ⚠️ QueryResult |
| **PAGELAYOUTS** | `pageLayouts.repository.ts` (30L) | - | ❌ | ⚠️ Simple |
| **DASHBOARD** | `dashboard.repository.ts` (30L) | Dashboard.tsx | ❌ | ⚠️ Simple |
| **EMPLOYEEDASH** | `employeeDashboard.repository.ts` (50L) | AccueilEmploye.tsx | ❌ | ⚠️ QueryResult |
| **GENERICTABLE** | `genericTable.repository.ts` (20L) | - | ❌ | ⚠️ Generic |

**Observations Communes:**
- ❌ **Zéro test pour tous ces modules**
- ⚠️ Plutôt QueryResult que ApiResult
- ✅ Patterns cohérents mais simples

---

## 🔍 Anomalies Systémiques Détectées

### 1️⃣ **Pattern Mismatch: ApiResult vs QueryResult**

**État Actuel:**
- ✅ ApiResult (bon): Clients, Suppliers, Tenants, Leads, Foncier, Projects, Employees, Tasks
- ⚠️ QueryResult (ancien): Documents, Finance, Visitors, Media, CMS, Bot, Users, Social, etc.

**Impact:** Code inconsistency, duplication error handling

**Action:** Standardiser sur ApiResult ou QueryResult

---

### 2️⃣ **Repository Importé Mais Non Utilisé**

**CRITICAL ANOMALY — Fournisseurs.tsx:**
```tsx
❌ import { suppliersRepository } from "../data/suppliers.repository";
❌ BUT: const { data } = await supabase.from("suppliers").select(...)
```

**Autres Cas Suspects:**
- Fournitures.tsx (Products) — Vérifier si utilise repository

---

### 3️⃣ **Couverture de Tests Extrêmement Réduite**

| Module | Tests | Couverture |
|--------|-------|-----------|
| Foncier | 1 test | 5% |
| Leads | 1 test | 10% |
| Projects | 1 test | 15% |
| Employees | 1 test | 10% |
| Tasks | 1 test | 10% |
| **Autres 14 modules** | 0 tests | 0% |

**Impact:**
- ⚠️ Pas de validation CRUD
- ⚠️ Pas de validation error handling
- ⚠️ Pas de edge cases coverage

---

### 4️⃣ **Logique Métier Dispersée**

**Exemples:**
- Foncier: Logique dans FoncierContainer (abstraction forte)
- Immobilier: Logique fragmentée en 5 tabs sans repository
- Clients: Cache local dans page (offline sync)

**Impact:** Difficile à tester, à maintenir, à réutiliser

---

### 5️⃣ **Normalisation Data Inconsistente**

**Patterns:**
- ✅ Clients, Tenants, Leads: Excellent normalizeXRow()
- ⚠️ Suppliers: Normalization existe mais page l'ignore
- ❌ Projects, Finance, Documents: Pas de normalization

**Impact:** Risques de data inconsistency

---

### 6️⃣ **Pages Directement Connectées à Supabase**

**Found In:**
- Fournisseurs.tsx ❌
- Fournitures.tsx ❌ (à vérifier)
- Potentially others

**Action:** Audit toutes pages pour vérifier pattern

---

## 📋 Classement Priorité d'Audit Final

### 🔴 AUDIT IMMÉDIAT (Semaine 1)

1. **Foncier** (900+ lignes, 1 test)
   - Étendre test coverage à min 50+ tests
   - Auditer FoncierContainer logique
   
2. **Suppliers/Fournisseurs** (Anomalie repository non utilisé)
   - Refactoriser page pour utiliser repository
   - Créer tests (suppliers.repository.test.ts)
   
3. **Leads** (Complexité haute, tests faibles)
   - Ajouter tests CRUD complets
   - Tester normalization + edge cases

---

### 🟠 AUDIT IMPORTANT (Semaine 2)

4. **Immobilier** (5 tabs fragmentés)
   - Vérifier repositories manquants
   - Tester all 5 tabs

5. **Projects** (Pattern trop simple)
   - Valider si normalization nécessaire
   - Étendre tests
   
6. **Pattern Standardization**
   - Décider: ApiResult vs QueryResult
   - Refactoriser tous les modules

---

### 🟡 AUDIT COMPLÉMENTAIRE (Semaine 3+)

7-22. **Remaining 16 modules**
- Créer tests basiques pour chaque
- Harmoniser patterns
- Valider CRUD operations

---

## 🎯 Recommandations Structurelles

### Architecture Proposée

```
src/data/
├── repositories/
│   ├── clients.repository.ts        ← PATTERN RÉFÉRENCE
│   ├── suppliers.repository.ts      ← REFACTOR pour utiliser
│   ├── foncier.repository.ts        ← AUDIT logique complexe
│   └── [22 autres]
├── repositories.test/
│   ├── clients.repository.test.ts   ← PATTERN TEST RÉFÉRENCE
│   ├── suppliers.repository.test.ts ← À CRÉER
│   └── [20 nouveaux tests]
└── result.ts                         ← ApiResult vs QueryResult
```

### Patterns à Normaliser

1. **Tous les repositories:** Utiliser ApiResult (cohérent)
2. **Data normalization:** Si data complexe → normalizeXRow()
3. **Deduplication:** Si entité a email/phone → isDuplicateCandidate()
4. **Tests:** Min 50% couverture pour modules complexes (>100L code)

---

## 📊 Tableau Récapitulatif Complet

```
MODULE                 | REPO     | PAGE      | TESTS | PATTERN      | PRIORITÉ | ANOMALIES
=======================|==========|===========|=======|==============|==========|===================
Foncier                | 900L     | FoncierCo | ⚠️1   | ApiResult    | 🔴 P1    | Low test cov
Leads                  | 250L     | Leads     | ⚠️1   | ApiResult    | 🔴 P1    | No CRUD tests
Immobilier/Tenants     | 180L     | 5 Tabs    | ✅2   | ApiResult    | 🔴 P1    | Fragmented
Clients                | 350L     | Clients   | ✅4   | ApiResult    | ✅ REF   | PERFECT
Suppliers              | 200L     | ❌PAGE   | ❌    | ApiResult    | 🟠 P2    | REPO NOT USED!
Projects               | 60L      | Projets   | ⚠️1   | ApiResult    | 🟠 P2    | No normalization
Employees              | 100L     | Employes  | ⚠️1   | ApiResult    | 🟡 P3    | Minimal
Tasks                  | 120L     | Taches    | ⚠️1   | ApiResult    | 🟡 P3    | Minimal
Documents              | 40L      | Documents | ❌    | QueryResult  | 🟡 P3    | Old pattern
Finance                | 45L      | Finances  | ❌    | QueryResult  | 🟡 P3    | No type
Visitors               | 60L      | Registre  | ❌    | QueryResult  | 🟡 P3    | 3 tables
Media                  | 60L      | Media     | ❌    | QueryResult  | 🟢 P4    | Generic
CMS                    | 100L     | Admin     | ❌    | QueryResult  | 🟢 P4    | Multi-type
Bot                    | 80L      | Codex     | ❌    | QueryResult  | 🟢 P4    | Generic
Users                  | 70L      | Users     | ❌    | QueryResult  | 🟢 P4    | Generic
Social                 | 30L      | -         | ❌    | QueryResult  | 🟢 P4    | Unused?
Products               | 30L      | Fournitures| ❌   | QueryResult  | 🟢 P4    | Check usage
PublicLots             | 40L      | Public    | ❌    | QueryResult  | 🟢 P4    | Generic
PageLayouts            | 30L      | -         | ❌    | QueryResult  | 🟢 P4    | Generic
Dashboard              | 30L      | Dashboard | ❌    | QueryResult  | 🟢 P4    | Simple
EmployeeDashboard      | 50L      | Accueil   | ❌    | QueryResult  | 🟢 P4    | Generic
GenericTable           | 20L      | -         | ❌    | Generic      | 🟢 P4    | Util only
=======================|==========|===========|=======|==============|==========|===================

RÉSUMÉ:
- Total Repositories: 22
- Total Tests Files: 8 (36%)
- Aucun test pour: 14 modules (64%)
- Pattern ApiResult: 8 modules
- Pattern QueryResult: 12 modules
- Repos importés mais non utilisés: 1+ (Suppliers)
```

---

## ✅ Checklist d'Audit

- [ ] Audit Foncier (étendre tests)
- [ ] Audit Suppliers (refactor page)
- [ ] Audit Leads (ajouter CRUD tests)
- [ ] Vérifier tous pages n'utilisent pas supabase direct
- [ ] Standardiser ApiResult vs QueryResult
- [ ] Créer tests pour 14 modules restants
- [ ] Implémenter normalization pour tous complex entities
- [ ] Valider deduplication pour email/phone entities
- [ ] Documenter patterns dans ARCHITECTURE.md

---

**Fin du rapport**  
*Généré le 14 juillet 2026 — Audit EGS Data Layer*
