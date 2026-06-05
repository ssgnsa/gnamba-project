# 🔧 PLAN DE REMÉDIATION AUTOMATISÉ - EGS

## Phase 1: Corrections Immédiates (15 min)

### 1.1 Mettre à jour DOMPurify (Sécurité)
```bash
npm audit fix
npm install dompurify@latest
npm run build
```

### 1.2 Corriger les 3 erreurs ESLint bloquantes

#### ✅ Fichier 1: `src/lib/foncierOffline.ts:282`
Ajouter accolades autour de la déclaration case

#### ✅ Fichier 2: `src/pages/immobilier/PaymentReportsTab.tsx:96`
```typescript
// Avant
case 'action':
  const newValue = value
  break

// Après
case 'action': {
  const newValue = value
  break
}
```

#### ✅ Fichier 3: `src/pages/immobilier/PaymentReportsTab.tsx:652`
Même fix que ci-dessus

---

## Phase 2: Corrections TypeScript Majeures (30 min)

### 2.1 Résoudre `supabaseService` undefined
**Fichier**: `src/hooks/useFoncierLogic.ts`

Problem: Import/Service manquant
Solution: Vérifier si le service existe
```typescript
// Ajouter ou corriger import
import { supabaseService } from '../lib/supabase.service'
```

### 2.2 Corriger les type castings dangereux
**Fichier**: `src/pages/Foncier.tsx`

```typescript
// Ligne 1248: Avant
const records = (data as AttestationHistoryItem[]) || [];

// Après
const records = (data as unknown as AttestationHistoryItem[]) || [];
```

Répéter pour lignes 1665 et 2195

### 2.3 Fixer les imports inutilisés (18 cas)
```bash
npm run lint -- --fix
# Suivi de cleanup manuel
```

---

## Phase 3: React Hooks Dependencies (20 min)

### 3.1 `useFoncierLogic.ts`
Ajouter aux dépendances des useCallback:
- Ligne 837: `[attestationHasDeletedAt, setAttestationHasDeletedAt, ...]`
- Ligne 962: `[buildAttestationPrintData, ...]`
- Ligne 1048: `[createAttestationRecord, printAndAuditAttestation, signAndGenerateQr, validateAttestationPrerequisites]`

### 3.2 `Dashboard.tsx`
Ajouter `serviceLinks` aux dépendances ligne 211

---

## Phase 4: Nettoyage & Optimisation (30 min)

### 4.1 Supprimer les imports inutilisés
```typescript
// useFoncierSync.ts: Supprimer
import type { AuditRecord, AuditQueryRow } from "..."

// PaymentReportsTab.tsx: Nettoyer
// - Download, Users, Building, DollarSign, ChevronDown, Filter
// - supabase, Modal, Badge
// - getPropertyAddress, formatMontantImmo, ExportFormat
```

### 4.2 Vérifier les constantes inutilisées
```typescript
// print.ts l.276-278: Supprimer ou utiliser
// registreVolume, registrePage, registreLigne
```

### 4.3 Valider les `reduce` operations
```typescript
// useFoncierAudit.ts:45
// Vérifier que profilesData est bien un array
const namesById = (profilesData || []).reduce((acc, profile) => {
  acc[profile.id] = profile.full_name
  return acc
}, {} as Record<string, string>)
```

---

## Phase 5: Validation (15 min)

```bash
# Tester lint
npm run lint

# Tester TypeScript
npm run typecheck

# Tester build
npm run build

# Tester linter strictement
npm run lint -- --fix
```

---

## Phase 6: Sécurité DB & RLS (Audit)

### À Vérifier
- [ ] Toutes les tables ont des RLS policies
- [ ] Les leads_module tables ont RLS (nouveau mai 15)
- [ ] Les FK après renommages (tenants→locataires)
- [ ] Index performance sur grandes tables

### Commande de Vérification
```bash
# Vérifier RLS
supabase db pull  # ou équivalent

# Vérifier contraintes
psql -h localhost -U postgres -c "\dt+ public.*"
```

---

## Phase 7: Tests & Déploiement

### Tests
```bash
npm run test:run
npm run test:coverage
```

### Build Production
```bash
npm run build:verify
docker compose --profile prod --profile server build --no-cache
docker compose up -d
```

---

## Checklist Finale

- [ ] DOMPurify mis à jour
- [ ] 3 erreurs ESLint corrigées
- [ ] supabaseService importé correctement
- [ ] Type castings sécurisés
- [ ] Tous les imports utilisés
- [ ] React Hooks dependencies complètes
- [ ] npm run lint : 0 erreurs
- [ ] npm run typecheck : ✅ (autres erreurs acceptées pour l'instant)
- [ ] Docker build : ✅
- [ ] RLS validées : ✅
- [ ] Tests : ✅
- [ ] Production build : ✅

---

**Temps estimé total**: 2-3 heures  
**Priorité**: 🔴 IMMÉDIATE

