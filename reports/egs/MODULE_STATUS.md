# État de santé des Modules

## Foncier
- Date: 2026-08-31
- Statut: Stabilisé (corrections TS appliquées)
- Détails: Correction de `useFoncierState.ts` pour éliminer collisions de noms entre hooks et aligner les signatures exposées (notamment `fetchAudit` et les fonctions de `useLots`/`useFoncierSync`). Re-run `npm run typecheck` passé sans erreurs locales.
- Prochaines étapes: régénérer `src/api/generated/client.ts` depuis OpenAPI (orval) pour corriger ~134 erreurs restantes liées au client généré si elles persistent dans d'autres environnements; ajouter indicateurs de sync en UI une fois la base stable.
