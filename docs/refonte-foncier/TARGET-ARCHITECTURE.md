# Architecture cible

## Navigation
Sidebar → Foncier (une seule entrée)
Onglets :
1. Vue d'ensemble (NEW dashboard)
2. Villages (CRUD unifié)
3. Lotissements & Îlots (NEW hiérarchique)
4. Lots (existant)
5. Attestations (existant)
6. Validation (refonte)
7. Configuration (existant)
8. Audit (existant)

## Patterns communs (Phase 1)
- ConfirmDialog.tsx (remplace confirm())
- FormModal.tsx (template modal)
- DataTable.tsx (tableau générique)
- StatusBadge.tsx (badge statut)
- PageHeader.tsx (en-tête page)
- useCRUD.ts (hook générique)

## Migrations DB
- 041 : superficie real → numeric(10,2)
- 042 : attestations→lots CASCADE → RESTRICT
- 043 : ENUM statuts lots
- 044 : ENUM statuts attestations
