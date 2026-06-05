# 🔍 Audit Complet EGS - 15 mai 2026

**Date**: 15 mai 2026  
**Version**: Node.js v20.19.1, npm v11.13.0  
**Statut Général**: ⚠️ **CRITIQUE AVEC PROBLÈMES**

---

## 1. 📊 Vue d'ensemble du projet

| Métrique | Valeur | Statut |
|----------|--------|--------|
| **Type** | SPA React 18 + Vite + Tailwind | ✅ |
| **Backend** | Supabase (PostgreSQL + Auth + Storage) | ✅ |
| **Fichiers TS/TSX** | 125 fichiers | ⚠️ |
| **Taille source** | 2,1 MB | ✅ |
| **Migrations DB** | 49 fichiers (6,707 lignes) | ✅ |
| **Edge Functions** | 6 deployées | ⚠️ |
| **Stack**: React 18.3.1, TypeScript 5.9.3, Vite 8.0.2 | - | ✅ |

---

## 2. 🚨 PROBLÈMES CRITIQUES IDENTIFIÉS

### 🔴 A. Vulnérabilité de Sécurité - DOMPurify
**Sévérité**: MODÉRÉE  
**Dépendance**: `dompurify <= 3.3.3`  
**Vulnérabilités**:
- `GHSA-39q2-94rc-95cp` — ADD_TAGS bypasses FORBID_TAGS
- `GHSA-h7mw-gpvr-xq4m` — FORBID_TAGS bypassed by function-based predicate
- `GHSA-crv5-9vww-q3g8` — SAFE_FOR_TEMPLATES bypass in RETURN_DOM
- `GHSA-v9jr-rg53-9pgp` — Prototype Pollution to XSS via CUSTOM_ELEMENT_HANDLING

**Action requise**: 
```bash
npm audit fix
npm install dompurify@latest
```

---

### 🔴 B. Erreurs ESLint Critiques (3 erreurs bloquantes)

#### 1. **Unexpected lexical declaration in case block** ❌
**Fichier**: `src/lib/foncierOffline.ts:282`  
**Fichier**: `src/pages/immobilier/PaymentReportsTab.tsx:96, 652`  
**Cause**: Déclarations `const`/`let` directement dans des blocs `case` sans accolades

**Fix rapide**:
```typescript
// ❌ Incorrect
case 'action':
  const value = 'something'
  break

// ✅ Correct
case 'action': {
  const value = 'something'
  break
}
```

---

### 🟡 C. Erreurs TypeScript Importantes (20+ erreurs)

#### 1. **Manque de `supabaseService`** (8 occurrences)
**Fichier**: `src/hooks/useFoncierLogic.ts`  
**Lignes**: 79, 83, 109, 193, 236, 321, 384, 431, 757, 914

```typescript
// ❌ Erreur TS2304
const { data } = await supabaseService.getLatestAttestationForLot(...)
```

**Cause**: `supabaseService` n'est pas importé ou n'existe pas  
**Solution**: Vérifier l'import ou créer le service

#### 2. **Type casting dangereux** (4 occurrences)
**Fichier**: `src/pages/Foncier.tsx:1248, 1665, 2195`

```typescript
const records = (data as AttestationHistoryItem[]) || [];
// Convertir d'abord vers 'unknown'
const records = (data as unknown as AttestationHistoryItem[]) || [];
```

#### 3. **Property 'count' doesn't exist** 
**Fichier**: `src/hooks/useFoncierAudit.ts:20`  
**Type**: `PostgrestResponse` n'a pas de `count` en mode non-count

---

### 🟡 D. Avertissements ESLint (37 avertissements)

#### React Hooks Missing Dependencies
- `useFoncierLogic.ts` — 3 violations (useCallback)
- `Dashboard.tsx` — 1 violation (useCallback)
- Cause: Dépendances manquantes dans tableaux de dépendances

#### Imports/Exports inutilisés (18 cas)
- `AuditRecord`, `AuditQueryRow` — imports non utilisés
- Imports Lucide: `Download`, `Users`, `Building`, `DollarSign`, etc.
- Fonctions: `getPropertyAddress`, `formatMontantImmo`, `getScoreLabel`

---

## 3. 🔒 AUDIT DE SÉCURITÉ

### CSP (Content Security Policy) ✅
**Statut**: Bien configuré
- `default-src 'self'` — base sûre
- `script-src` inclut les sources Cloudflare et Supabase
- `img-src` autorise HTTPS seulement + data: + blob:
- Préload headers corrects

### RLS (Row Level Security) ⚠️
**Statut**: Partiellement configuré
- 49 migrations incluent les politiques RLS
- Risk: Nécessite vérification complète que les politiques couvrent toutes les tables
- 6 fichiers de correction RLS depuis avril-mai 2026

### CORS ⚠️
**Statut**: Configuration présente
- Supabase CORS configuré pour connect-src
- Domains: `thykrnoqgylrbfupophs.supabase.co` et localhost:11434 (Ollama)

### Authentication 🟡
**Statut**: Utilise Supabase Auth
- Supabase JWT via ANON_KEY
- Session gérée par `AuthContext`
- Type: Role-based (`admin`, `gestionnaire`, `employe`)

---

## 4. 📦 DÉPENDANCES & VULNÉRABILITÉS

### Production Dependencies
```
@supabase/supabase-js@2.100.0 ✅
react@18.3.1 ✅
react-dom@18.3.1 ✅
react-turnstile@1.1.5 ✅
zod@4.3.6 ✅
dompurify@3.3.3 ❌ (VULNÉRABILITÉ)
qrcode@1.5.4 ✅
lucide-react@0.344.0 ✅
```

### Dev Dependencies
- TypeScript 5.9.3 ✅
- ESLint 9.39.4 avec plugins React ✅
- Vite 8.0.2 ✅
- Vitest 1.6.1 ✅

### Audit npm
```
1 moderate severity vulnerability found
npm audit fix available
```

---

## 5. 🗄️ AUDIT DE LA BASE DE DONNÉES

### Migrations
- **Total**: 49 migrations SQL (6,707 lignes)
- **Statut**: Séquence continues, pas d'écarts
- **Dernière**: `20260515000004_fix_cors_storage.sql` (48 lignes)
- **Trend**: Création intensive mai 8-15 (9 migrations en 1 semaine)

### Problèmes Detectés
1. **Plusieurs corrections RLS** — Indique des itérations/corrections (normal mais à valider)
2. **Renommages de colonnes répétés** — `tenants → locataires` (avril 7-8)
3. **Refactorisation d'schéma** — Migrations 20260508-20260515 massives

### Risques DB
⚠️ **À vérifier**:
- Intégrité des contraintes FK après renommages
- Couverture complète des RLS sur `leads` table (nouvelle, mai 15)
- Performance des index sur `foncier_lots`, `immobilier`, `leads`

---

## 6. ⚙️ CONFIGURATION & INFRASTRUCTURE

### Nginx ✅
- Security headers OWASP complets
- HSTS: max-age=31536000
- X-Frame-Options: SAMEORIGIN
- CSP bien structurée

### Docker 🟢
**Conteneurs actifs**:
```
egs-frontend (8080:80) — healthy ✅
egs-web (pas de port publié)  ⚠️
filebrowser (8081:80) — healthy ✅
somagro-web (8082:3000) — healthy ✅
```

**Problème**: `egs-web` n'expose pas de port (à vérifier)

### Services systemd
- `apache2.service` — running ✅
- `docker.service` — running ✅
- `mariadb.service` — running ✅
- `ssh.service` — running ✅
- `ollama.service` — running ✅
- `cloudflared.service` — running ✅
- `egs-web.service` — exited (wrapper only)

---

## 7. 🛣️ ARCHITECTURE & STRUCTURE

### Pages & Modules (18 modules)
```typescript
Page type inclut:
- dashboard, clients, projets, immobilier, foncier
- fournitures, finances, employes, utilisateurs, fournisseurs
- documents, media, taches, statistiques, parametres
- site-editor, registre, leads
```

### Componentes Clés
- `src/lib/lead-capture.ts` — Capture formulaires (auto-init) ✅
- `src/lib/supabase.service.ts` — Service de données (définis mal)
- `src/pages/Foncier.tsx` — 2,195 lignes complexe ⚠️
- `src/utils/print.ts` — Génération PDF Attestation ✅

### Contextes
- `AuthContext` — Authentification Supabase
- `SettingsContext` — Paramètres app (couleurs, branding)
- `SiteContentContext` — Contenu CMS public

---

## 8. 🚀 EDGE FUNCTIONS

### Déployées (6)
1. ✅ `attestation-sign` — Signature numérique
2. ✅ `attestation-verify` — Vérification
3. ✅ `auto-assign-agent` — Assignment auto
4. ✅ `calculate-lead-score` — Scoring leads
5. ✅ `capture-lead` — Capturer leads (nouvelles)
6. ✅ `send-welcome-message` — Messages bienvenus

### Problèmes Detectés
- `calculate-lead-score/index.ts:95` — Function `getScoreLabel` unused ⚠️
- Edge Functions nécessitent déploiement explicite après modifs

---

## 9. 🎯 RÉSUMÉ DES ACTIONS IMMÉDIATES

| Priorité | Problème | Fichiers | Action |
|----------|---------|----------|--------|
| 🔴 CRITIQUE | DOMPurify vulnérabilité | package.json | `npm audit fix && npm install dompurify@latest` |
| 🔴 CRITIQUE | Case block declarations | 3 fichiers | Ajouter accolades `{}` autour des déclarations |
| 🔴 CRITIQUE | supabaseService undefined | useFoncierLogic.ts | Vérifier import/export du service |
| 🟡 MAJEUR | Type casting dangereux | Foncier.tsx | Ajouter `as unknown` intermédiaire |
| 🟡 MAJEUR | Missing Hook dependencies | 2 fichiers | Ajouter dépendances aux tableaux |
| 🟡 MAJEUR | Unused imports | 18 cases | Nettoyer imports inutilisés |
| 🟢 MINEUR | Preload warning logo | App.tsx | Vérifier/remplacer rel="preload" |

---

## 10. 📈 SCORES D'AUDIT

| Catégorie | Score | Détail |
|-----------|-------|--------|
| **Sécurité** | 7/10 | CSP OK, RLS incomplet, dompurify vulnérable |
| **Performance** | 7/10 | TypeScript strict, build optimisé, lazy loading partiel |
| **Qualité Code** | 6/10 | ESLint 40 violations, TypeScript 20+ erreurs |
| **Infrastructure** | 8/10 | Docker OK, systemd OK, logs à vérifier |
| **Couverture DB** | 7/10 | 49 migrations OK, RLS à valider complètement |
| **Testabilité** | 5/10 | Vitest présent, aucun test vu |
| **Maintenance** | 6/10 | Beaucoup de fichiers complexes (2K+ lignes) |
| **GLOBAL** | **6.7/10** | ⚠️ **À CORRIGER EN PRIORITÉ** |

---

## 11. 🎬 PROCHAINES ÉTAPES

1. ✅ Corriger les 3 erreurs ESLint bloquantes → `npm run lint --fix` + manuels
2. ✅ Mettre à jour `dompurify` → `npm audit fix`
3. ✅ Résoudre les erreurs TypeScript → Review useFoncierLogic, type castings
4. ✅ Ajouter les Hook dependencies manquantes
5. ✅ Nettoyer les imports inutilisés
6. ✅ Valider RLS complètement sur toutes les tables
7. ✅ Vérifier configuration egs-web (port)
8. ✅ Ajouter tests unitaires (vitest)
9. ✅ Performance audit (Lighthouse/WebPageTest)
10. ✅ Audit de sécurité complet (OWASP Top 10, pentesting)

---

## 📌 RESSOURCES

- **AGENTS.md**: Configuration du projet
- **LEAD_CAPTURE_FIX.md**: Historique capture leads (réparé)
- **CORS_FIX_SUMMARY.md**: Historique CORS
- **README.md**: Mode déploiement

---

**Fin du rapport — 15 mai 2026 14:35 UTC**
