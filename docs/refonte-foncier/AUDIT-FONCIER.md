# Audit Module Foncier

## Inventaire
- 3 792 lignes frontend, 3 997 lignes backend
- 11 composants, 3 pages, 6 modaux
- 56 routes API, 6 tables DB

## Problèmes critiques
1. **Doublon Villages** : onglet Foncier + page `/villages` autonome
2. **Lotissements/Îlots sans page** : backend prêt, frontend absent
3. **LotFormModal.tsx** : 673 lignes, 25 champs, monstre
4. **UX confirm natifs** : 11 occurrences de `confirm()`/`alert()`
5. **Incohérences DB** : superficie `real` vs `numeric`, CASCADE vs RESTRICT, TEXT+CHECK vs ENUM

## Décisions validées
- Fusion Villages → onglet unique
- Page hiérarchique Lotissements + Îlots
- Wizard 3 étapes pour LotFormModal
- Patterns communs avant refonte
