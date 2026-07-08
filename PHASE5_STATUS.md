# Phase 5 — Bascule Frontend : État d'avancement

## ✅ Accompli

### Modèle Leads

- [x] Créé fonction `normalizeLeadRow()` pour convertir `parties` → format UI
- [x] Basculé `leadsRepository.getAll()` sur `parties` avec jointures `party_roles` + `party_lead_details`
- [x] Basculé `leadsRepository.getById()`, `create()`, `update()`, `delete()` sur le nouveau modèle
- [x] Test ciblé passé : `normalizeLeadRow()` valide

### Modèle Clients

- [x] Créé `clientsRepository.ts` avec `normalizeClientRow()`
- [x] Tests créés et passés (2/2)
- [x] Basculé `src/pages/Clients.tsx` : fetchClients + handleSyncToRemote utilise repository
- [x] Basculé `src/pages/Finances.tsx` : accès clients via repository
- [x] Basculé `src/pages/Statistiques.tsx` : count clients via repository
- [x] Basculé `src/pages/Documents.tsx` : accès clients via repository

### Modèle Locataires

- [x] Créé `tenantsRepository.ts` avec `normalizeTenantRow()`
- [x] Tests créés et passés (2/2)

### Build & Validation

- [x] `npm run build` réussit (✓ built in 4.18s)
- [x] Aucun erreur TypeScript introduite par les changements
- [x] Lint OK sur Clients.tsx, Finances.tsx, Statistiques.tsx, Documents.tsx

### Données de base

- [x] 4 parties créées (2 clients + 2 leads source)
- [x] 4 rôles attribués
- [x] 2 détails lead remplis (`party_lead_details`)

## ⏳ Prochaines étapes

### Phase 5 suite — Bascule Immobilier/Locataires

- [ ] Mettre à jour `src/pages/Immobilier.tsx` pour utiliser `tenantsRepository`
- [ ] Vérifier autres accès à `from('locataires')` dans le codebase
- [ ] Migration des paiements (RentPayment) - peuvent référencer locataires_id

### Phase 6 — Cleanup & Audit

- [ ] Vérifier tous les appels `from('leads')`, `from('clients')`, `from('locataires')` (grep complet)
- [ ] Remplacer accès restants dispersés dans le codebase
- [ ] Valider sync engines (offline/sync\*.ts) toujours compatibles

### Phase 7 — RLS et sécurité

- [ ] Vérifier les politiques RLS sur `parties`, `party_roles`, `party_lead_details`
- [ ] Adapter les grant patterns pour les rôles d'utilisateurs existants

### Phase 8 — Validation globale

- [ ] Tester l'UI Leads/Clients/Locataires en environnement réel
- [ ] Vérifier les statistiques et les rapports
- [ ] Valider les opérations offline (sync)

## 🔍 Points d'attention

### Ancien modèle

- Tables `clients`, `leads`, `locataires` restent intactes (additive migration)
- Bascule graduelle : chaque page migre indépendamment
- Pas de break pour les modules non encore migrés

### TypeScript

- Erreurs préexistantes dans `src/lib/__tests__/adminUserCreation.test.ts` (non bloquantes)
- Compilations OK après changements repositories

### Base de données

- Aucun risque : lecture depuis `parties` qui lit depuis les sources
- Écritures dans `parties` (parties créées à la migration)
- Cascade delete sur `parties` → `party_roles` → `party_lead_details`
