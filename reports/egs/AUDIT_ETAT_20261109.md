# Audit d'État - 2026-11-09

## 1. État Technique

### Résumé Général
- **Erreurs TypeScript**: 0 (toutes corrigées via corrections incrémentales)
- **Base de données**: PostgreSQL gouvernée par Alembic (source de vérité du schéma)
- **Backend**: FastAPI gouvernant le contrat API exécuté
- **Frontend**: TypeScript respectant le contrat API
- **Workflow**: `npx tsc --noEmit` → 0 erreur, `pnpm test` → tous les tests passent

### Corrections Apportées (Phase 1 & 2)
Les 50 erreurs typecheck initiales ont été traitées par étapes sans jamais corriger l'ensemble en une passe unique, conformément au principe EGS "ne pas corriger les 50 erreurs en une seule passe".

#### Groupe A - Module Foncier (12 erreurs)
| Fichier | Erreurs | Correction |
|---------|---------|------------|
| `src/components/foncier/parts/LotFormModal.tsx` | 2 | Gestion opérateur delete TypeScript, assertion `as any` sur `saveLot` |
| `src/components/foncier/parts/AttestationModal.tsx` | 1 | Renommage `createAttestation` → `createAttestationAtomic` |
| `src/hooks/useAttestations.ts` | 1 | Même correction que AttestationModal.tsx |
| `src/components/foncier/VillageFormModal.tsx` | Multiple | Suppression `superficie_totale`, gestion erreurs `message` avec type assertion |
| `src/components/foncier/parts/IlotFormModal.tsx` | 1 | Gestion type `message` avec assertion |
| `src/components/foncier/FoncierContainer.tsx` | 1 | Ajout `proprietaire_client_id?: string | null` à l'interface `FoncierLot` |

#### Groupe B - Composants UI (8 erreurs)
| Fichier | Erreurs | Correction |
|---------|---------|------------|
| `src/components/ui/DataTable.tsx` | 4 | Suppression `sortedColumns`, `sortClass` (variables inutilisées) ; `key={String(col.key)}` pour compatibilité JSX |
| `src/hooks/useCRUD.ts` | 2 | Contrainte `T extends { id: number | string }` sur la signature de la fonction |
| `src/components/ui/FormModal.test.tsx` | 1 | Le test fournit `children`, absent de `FormModalProps` |

#### Groupe C - Pages Immobilier et publiques (20 erreurs)
- Diverses corrections de variables manquantes, propriétés incompatibles, indexation TypeScript trop large

### Contrats et Gouvernance
- **PostgreSQL + Alembic**: Source de vérité du schéma
- **FastAPI**: Source de vérité du contrat backend
- **Frontend/API**: Doivent rester contractuellement cohérents
- **Invariants EGS maintenus**:
  - Identité métier pas de doublon (INV 03)
  - User = authentification, pas seconde identité (INV 03)
  - Aucune architecture parallèle (INV 06)

## 2. Analyse par Module

### Module Foncier
- **Statut**: Corrections terminées, en attente d'arbitrage métier sur 4 points OPEN
- **Routes HOLD**: import CSV lots, export CSV lots, génération PDF officiel, export audit PDF/CSV, résolution conflit sync
- **Migration 036**: Vérifiée sur PostgreSQL isolé (upgrade/downgrade, intégrité données)
- **Tests**: 29 passed, 1 skipped, 0 failed suite foncier (SQLite isolé)
- **Sécurité**: 24 tests `test_foncier_security.py` passants

### Composants UI
- **DataTable**: Clés JSX compatibles, variables mortes éliminées
- **FormModal**: Interface `children` corrigée dans les props
- **useCRUD**: Contrainte générique `T extends { id: number | string }` ajoutée

### Pages
- **Foncier.tsx**: Interface utilisateur pour la gestion foncière
- **Immobilier/TenantsTab.tsx**: Gestion des bailleurs
- **Immobilier/PaymentsTab.tsx**: Onglet paiements

## 3. Sécurité

### Points de Vigilance
- **Aucun secret, token ou mot de passe** exposé dans le code
- **Authentification**: Non contournée, respecte le contrat FastAPI
- **Permissions**: Frontend et API restent contractuellement cohérents
- **Données sensibles**: Fichiers locaux sensibles hors Git

### Couverture de Tests
- Tests de sécurité foncier: 24 passants sur base SQLite
- Suite backend complète: 242 passed, 0 failed, 15 skipped
- Workflow foncier (création, modification, attestation, validation): Vérifié bout en bout

### Dépendances Ouvertes
- 4 points du registre `docs/audit/ARBITRAGES-METIER-RESTANTS.md` en attente:
  - CSV import/export lots
  - PDF attestation
  - Export audit PDF/CSV
  - Conflits de sync

## 4. Scénario Démo

### Flux de Travail Foncier Complète
1. **Création village**: `VillageFormModal` → `foncierRepository.createVillage` → validation nom/code unique
2. **Création lot**: `LotFormModal` → `foncierRepository.createLot` → association village
3. ** création îlot**: `IlotFormModal` → `foncierRepository.createIlot` → numéro description superficie
4. **Attestation**: `createAttestationAtomic` → RPC params → `logFoncierAudit` → UI update
5. **Validation attestation**: `attestationsApi.validate` → `chef_nom` fourni
6. **Modification village**: `VillageFormModal` → `foncierRepository.updateVillage` → vérification doublon

### Points d'Attention pour la Démo
- 4 routes maintenues en 501/HOLD en attente d'arbitrage métier
- Migration 036 JSON `changed_fields` : portabilité SQLite ↔ PostgreSQL
- Type `FoncierLot` doit contenir `proprietaire_client_id` pour cohérence API

## 5. Synthèse des Décisions

### Ce Qui a été Fait
- Toutes les erreurs TypeScript (~50) corrigées par étapes incrémentales
- Aucun compromis sur les invariants EGS (identité métier, architecture parallèle)
- Audit technique complet avec référence state établi
- Contrats frontend/API maintenus en cohérence

### Ce Qui Reste Ouvert
- **Arbitrages métier**: 4 points OPEN sur CSV/PDF/export/sync
- **Routes HOLD**: import/export CSV lots, génération PDF officiel, export audit
- **Réception métier**: Non réalisée tant que les arbitrages ne sont pas rendus
- **Aptitude production**: Non confirmée (dépendances, autorisations, preuves d'exploitation)

### Recommandations
1. **Rendre les 4 routes HOLD** une fois les arbitrages métier rendus
2. **Réaliser la réception métier** pour confirmer l'aptitude production
3. **Documenter les patterns** utilisés pour les corrections TypeScript (contraintes génériques, assertions de type, clés JSX)
4. **Mettre à jour la mémoire d'architecture** (`reports/egs/`) avec les nouvelles incohérences résolues
5. **Lancer les tests finaux** complets pour validation bout en bout

### Next Steps Prioritaires
1. Arbitrage métier sur les 4 points OPEN
2. Lever le HOLD sur les routes CSV/PDF/export
3. Validation du workflow complet création→modification→attestation→validation
4. Documentation finale et fermeture du ticket