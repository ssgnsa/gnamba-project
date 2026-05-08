# 🔍 Audit Profond — Gnamba Project (EGS + Somagro ERP)

> Note operatoire: ce document est un instantane d'audit du 4 avril 2026.
> La source de verite pour l'exploitation courante est `README.md` + `scripts/workspace-stack.sh`.

**Date** : 2026-04-04
**Serveur** : `gnamba-server` (`soma@gnamba-server`)
**Racine** : `/home/soma/gnamba-project`

---

## 📊 Vue d'ensemble

| Projet                        | Tech                                                                             | Taille                  | Statut               |
| ----------------------------- | -------------------------------------------------------------------------------- | ----------------------- | -------------------- |
| **EGS** (ERP Gnamba Services) | Vite + React 18 + TypeScript + Supabase Cloud                                    | 93 fichiers, 32K lignes | ✅ En production     |
| **Somagro ERP**               | Next.js (App Router) + Supabase Local                                            | Dockerisé, 227MB        | ✅ En production     |
| **Supabase Local**            | 14 containers (Postgres 17.6, Kong, Auth, Storage, Realtime, Edge Runtime, etc.) | ~5GB images             | ⚠️ Edge Runtime down |

### Infrastructure réseau exposée

| Service                           | Port                 | Santé                     |
| --------------------------------- | -------------------- | ------------------------- |
| **egs-web** (EGS frontend)        | `:8080`              | ✅ Healthy                |
| **somagro-web** (Next.js ERP)     | `:8082`              | ✅ Healthy                |
| **Supabase Studio**               | `:55323`             | ✅ Healthy                |
| **Supabase Kong (API)**           | `:55321`             | ✅ Healthy                |
| **Supabase DB**                   | `:55322`             | ✅ Healthy                |
| **Supabase Inbucket (mail)**      | `:55324` (web :8025) | ✅ Healthy                |
| **Supabase Analytics (Logflare)** | `:54327`             | ✅ Healthy                |
| **FileBrowser**                   | `:8081`              | ❌ **Unhealthy**          |
| **Edge Runtime**                  | —                    | ❌ **Exited (255) — 42h** |

---

## 🏗️ Architecture EGS (32 012 lignes)

### Pages principales

| Fichier                                      | Lignes | Rôle                                                                               |
| -------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| `src/pages/Foncier.tsx`                      | 3 662  | 🏗️ **Module foncier complet** — Lots, attestations, config village, offline, audit |
| `src/utils/print.ts`                         | 1 761  | 🖨️ Impression attestations, quittances, reçus, annexes techniques                  |
| `src/pages/RegistreVisiteur.tsx`             | 1 078  | 📋 Registre des visiteurs                                                          |
| `src/pages/Parametres.tsx`                   | 1 043  | ⚙️ Paramètres application                                                          |
| `src/pages/immobilier/PaymentsTab.tsx`       | 965    | 💰 Paiements immobiliers                                                           |
| `src/pages/AccueilEmploye.tsx`               | 946    | 👤 Dashboard employé                                                               |
| `src/pages/Documents.tsx`                    | 928    | 📄 Documents                                                                       |
| `src/App.tsx`                                | 877    | 🚪 Router SPA state-based                                                          |
| `src/pages/Utilisateurs.tsx`                 | 849    | 👥 Gestion utilisateurs                                                            |
| `src/components/public/PublicSocialWall.tsx` | 664    | 🌐 Site vitrine — Social wall                                                      |
| `src/types/index.ts`                         | 653    | 📐 Types TypeScript partagés                                                       |

### Architecture frontend

```
src/
├── App.tsx                    ← SPA sans router (state-based navigation)
├── context/
│   ├── AuthContext.tsx        ← Supabase auth + RBAC (admin/gestionnaire/employe)
│   ├── SettingsContext.tsx    ← Branding dynamique (couleurs, logo, titre)
│   └── SiteContentContext.tsx ← CMS key-value (site vitrine)
├── pages/
│   ├── Foncier.tsx            ← Module principal (3662 lignes)
│   ├── Immobilier/            ← Sous-modules: Properties, Tenants, Payments, Contracts
│   ├── Finances.tsx           ← Trésorerie
│   ├── Dashboard.tsx          ← Dashboard admin
│   ├── public/                ← Site vitrine (Home, Services, Contact, About)
│   └── admin/                 ← SiteEditor (CMS visuel)
├── components/
│   ├── foncier/               ← VillageLogoUploader, WorkflowValidation
│   ├── media/                 ← Media library avec versioning
│   ├── page-builder/          ← Éditeur visuel pages vitrine
│   └── ui/                    ← Modal, Badge, etc.
├── lib/
│   ├── supabase.ts            ← Client Supabase
│   ├── foncierValidation.ts   ← Schémas Zod (lots, attestations)
│   ├── mediaUtils.ts          ← Gestion média
│   └── foncierOffline.ts      ← Queue IndexedDB (mode hors-ligne)
├── utils/
│   ├── print.ts               ← Templates HTML imprimables
│   └── reference.ts           ← Références, dates, hash SHA-256
└── hooks/
    └── useFoncier.ts          ← Hooks foncier (558 lignes)
```

### Navigation sans router

L'app utilise un système **state-based** (pas de React Router) :

- `AppView` : `'public'` ↔ `'dashboard'`
- `dashPage` : sélection du module via une map statique `dashboardPages`
- Pour ajouter une page : ajouter au type `Page`, à la map `dashboardPages`, et au tableau `navItems` du `Sidebar`

---

## 🗃️ Base de données (Supabase Local — 26 tables)

### Tables Somagro ERP

| Catégorie         | Tables                                                                        |
| ----------------- | ----------------------------------------------------------------------------- |
| **Cultures**      | `fields`, `crop_cycles`, `crop_interventions`, `harvests`                     |
| **Élevage**       | `lots`, `animals`, `health_records`, `species`, `breeds`, `livestock_events`  |
| **Constructions** | `construction_projects`, `buildings`, `building_types`, `cameras`             |
| **Inventaire**    | `inventory_items`, `inventory_categories`, `inventory_movements`, `equipment` |
| **Ventes**        | `sales`, `sale_items`                                                         |
| **Finance**       | `financial_transactions`                                                      |
| **Immobilier**    | `tenants`                                                                     |
| **Général**       | `users`, `tasks`, `customers`, `counting_sessions`                            |

### Tables EGS (Supabase Cloud) — non listables ici mais documentées dans les migrations

---

## 🔒 Sécurité

### Points forts

- ✅ **Hash SHA-256** sur les attestations foncières
- ✅ **Signature RSA** via Edge Function `attestation-sign` (déployée 2026-04-04)
- ✅ **Vérification publique** via `attestation-verify` avec rate limiting (10/min)
- ✅ **RLS** activé sur toutes les tables
- ✅ **Soft delete** (`deleted_at`) sur les attestations
- ✅ **Audit logging** via `log_foncier_audit`
- ✅ **Mode hors-ligne** avec queue IndexedDB
- ✅ **Cloudflare Turnstile** sur les formulaires publics
- ✅ **DOMPurify** sur les entrées utilisateur

### Vulnérabilités actuelles

| Sévérité    | Problème                                                                                             | État                                              |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 🔴 Critique | **Edge Runtime Supabase Local down** (Exited 255, 42h) — Edge Functions locales indisponibles        | ⚠️ Non bloquant pour EGS (utilise Supabase Cloud) |
| 🔴 Critique | **FileBrowser unhealthy** — écoute sur `127.0.0.1:8080` (localhost) au lieu de `0.0.0.0`             | ⚠️ Inaccessible depuis l'extérieur                |
| 🟠 Majeur   | **139 fichiers .md/.sh/.sql** dans la racine du projet — pollution du repo                           | 🧹 Nettoyage recommandé                           |
| 🟠 Majeur   | **Foncier.tsx = 3 662 lignes** — fonction `handleGenerateAttestation` réduite mais encore trop dense | 📦 Refactoring en cours                           |
| 🟡 Moyen    | **RLS policies migration 03** créée mais non exécutée sur Supabase Cloud                             | ⏳ À appliquer                                    |
| 🟡 Moyen    | **`egs-web` s'arrête après chaque redémarrage serveur** — pas de systemd service                     | 🔧 À configurer                                   |

---

## 🐛 Bugs et problèmes actifs

### 1. FileBrowser Unhealthy

- **Cause** : Écoute sur `127.0.0.1:8080` (bind localhost)
- **Impact** : Inaccessible depuis le réseau
- **Fix** : Changer `listen` dans le config FileBrowser vers `0.0.0.0:8080`

### 2. Edge Runtime Supabase Local Down

- **Cause** : Exit code 255 (probablement OOM ou config manquante)
- **Impact** : Edge Functions locales indisponibles (attestation-sign/verify déployées sur Cloud, donc non bloquant)
- **Fix** : `docker start supabase_edge_runtime_somagro-erp`

### 3. egs-web ne redémarre pas automatiquement

- **Cause** : Pas de politique `restart: unless-stopped` ou service systemd
- **Impact** : Après reboot du serveur, egs-web est down
- **Fix** : Ajouter `restart: unless-stopped` au docker-compose OU créer un service systemd

---

## 📦 Dépendances

### EGS (npm)

| Package                 | Version | Usage                  |
| ----------------------- | ------- | ---------------------- |
| `@supabase/supabase-js` | 2.57.4  | Backend                |
| `react` / `react-dom`   | 18.3.1  | UI                     |
| `lucide-react`          | 0.344.0 | Icônes                 |
| `zod`                   | 4.3.6   | Validation formulaires |
| `qrcode`                | 1.5.3   | QR codes attestations  |
| `dompurify`             | 3.3.3   | Sanitization HTML      |
| `react-turnstile`       | 1.0.0   | Captcha Cloudflare     |
| `vite`                  | 8.0.2   | Build tool             |
| `tailwindcss`           | 3.4.1   | CSS                    |
| `typescript`            | 5.5.3   | Typage                 |
| `supabase` (CLI)        | 2.78.1  | CLI de gestion         |

### Qualité code

- ✅ **TypeScript** : 0 erreurs (`tsc --noEmit`)
- ✅ **ESLint** : 0 erreurs, 0 warnings
- ⚠️ **Foncier.tsx** : 3 662 lignes (limite recommandée : 500-1000)
- ⚠️ **App.tsx** : 877 lignes (trop de logique dans un seul fichier)

---

## 🚀 Pipeline de déploiement

### EGS (Production — `:8080`)

```
docker-compose.server.yml → build node:20-alpine → Vite build → nginx:alpine → port 8080
```

### Somagro ERP (Local — `:8082`)

```
docker-compose (local Supabase stack) → Next.js build → port 3000 → mappé 8082
```

### Supabase Cloud

```
Projet: thykrnoqgylrbfupophs.supabase.co
Edge Functions: attestation-sign (v1), attestation-verify (v1)
Secrets: ATTESTATION_PRIVATE_KEY, ATTESTATION_PUBLIC_KEY ✅
```

---

## 📋 Recommandations priorisées

### Immédiat (Semaine 1)

1. 🔴 **Exécuter la migration RLS 03** sur Supabase Cloud (SQL Editor)
2. 🔴 **Redémarrer Edge Runtime** : `docker start supabase_edge_runtime_somagro-erp`
3. 🔴 **Fixer FileBrowser** : bind `0.0.0.0` + healthcheck
4. 🟠 **Nettoyer les 139 fichiers** de la racine → les déplacer dans `_archive/` ou `docs/`

### Court terme (Semaine 2-3)

5. 🟠 **Créer un service systemd** pour `egs-web` (auto-restart au boot)
6. 🟠 **Découper Foncier.tsx** en modules : `FoncierLots.tsx`, `FoncierAttestations.tsx`, `FoncierConfig.tsx`
7. 🟡 **Ajouter des tests** sur `print.ts` (templates HTML) et `foncierValidation.ts` (schémas Zod)

### Moyen terme (Mois 2)

8. 🟡 **Unifier les bases** : EGS utilise Supabase Cloud, Somagro utilise Supabase Local → évaluer la migration d'EGS vers le stack local
9. 🟡 **CI/CD** : GitHub Actions ou GitLab CI pour build + deploy automatique
10. 🟡 **Monitoring** : Ajouter des alertes (container down, DB errors, queue offline pleine)

---

## ✅ Points de vigilance opérationnels

| Point                    | Statut                                             | Note                              |
| ------------------------ | -------------------------------------------------- | --------------------------------- |
| Clés RSA attestations    | ✅ Sauvegardées dans `.secrets/` (chmod 600)       | Ne PAS commiter                   |
| `.env` fichiers          | ⚠️ `.env.backup` et `.env.local.backup.*` existent | Supprimer les backups             |
| Migrations non ordonnées | ⚠️ Mélange de formats : `01_`, `02_`, `20260401_`  | Harmoniser le nommage             |
| Git                      | ✅ Clean (rien à commiter)                         | Bonne discipline                  |
| Dist directory           | ⚠️ Appartient à `root` (build Docker)              | Empêche rebuild local sans `sudo` |
| Docker images            | ⚠️ 5GB+ d'images Supabase                          | `docker image prune` recommandé   |

---

**Fin de l'audit** — 2026-04-04 11:00 UTC
