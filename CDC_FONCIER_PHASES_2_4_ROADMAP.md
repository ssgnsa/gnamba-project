# CDC Foncier - Roadmap Phases 2 a 4

**Contexte**
- Phase 1 critique a ete durcie via une migration additive.
- Phase 2 est mise en place via la migration `20260609102844_foncier_village_normalization.sql`.
- Objectif global: faire evoluer le module Foncier sans casser les parcours existants.
- Principe de base: chaque changement schema doit rester compatible en lecture, puis en ecriture, avant suppression d'ancien code.

## Phase 2 - Normalisation du schema

**Objectif**
- Sortir le module d'un schema partiellement textuel vers un modele relationnel plus stable.

**Travaux**
- Ajouter une cle de village normalisee (`village_id`) tout en conservant `village` en compatibilite.
- Backfill des villages existants depuis les donnees textuelles.
- Ajouter les index utiles pour les filtres frequents.
- Ajouter un mecanisme de synchro temporaire entre `village` et `village_id` pendant la transition.
- Verifier que les RPC `search_foncier_lots` et `foncier_stats_by_village` continuent de renvoyer les memes resultats fonctionnels.

**Etat**
- Implémentee par la migration de normalisation du 2026-06-09.

**Garde-fous**
- Pas de suppression du champ texte avant la fin de la transition.
- Pas de changement de payload frontend avant validation de la compatibilite.
- Migration additive uniquement.

**Critere d'acceptation**
- Les anciens ecrans continuent a fonctionner.
- Les nouvelles lignes peuvent etre lues par les anciennes et nouvelles requetes.
- La recherche Foncier reste stable pendant la migration.

## Phase 3 - Reduction de l'exposition des donnees sensibles

**Objectif**
- Limiter l'exposition des informations biometrques et documentaires aux seuls parcours qui en ont besoin.

**Etat**
- Surface publique de verification reduite via la vue minimale `v_foncier_attestation_verification` et le rendu public assaini.
- Les projections Foncier sensibles ont ete remplacees par des listes explicites dans le service et les impressions.

**Livrables**
- `src/lib/foncierAttestation.ts`, `src/lib/supabase.service.ts`, `src/hooks/useFoncierLogic.ts`, `src/pages/Foncier.tsx`
- `src/pages/public/PublicVerification.tsx`, `supabase/functions/attestation-verify/index.ts`
- `supabase/migrations/20260609105850_foncier_public_verification_hardening.sql`

**Travaux**
- Remplacer les `select(*)` sensibles par des projections explicites sur les requetes internes.
- Reduire les champs exposes par les parcours publics de verification.
- S'assurer que la verification publique continue via l'Edge Function, pas via acces direct aux tables.
- Revoir les vues `public` pour qu'elles utilisent `security_invoker = true` quand applicable.
- Ajouter des indexes composites sur les requetes les plus frequentes si les temps de reponse degradent.

**Garde-fous**
- Ne pas casser la verification d'attestation publique.
- Ne pas retirer les champs necessaires a l'impression ou a l'audit interne sans remplacement.
- Ne pas utiliser `user_metadata` pour une decision d'autorisation.

**Critere d'acceptation**
- Les utilisateurs publics voient uniquement les donnees necessaires a la verification.
- Les utilisateurs internes gardent l'acces attendu aux formulaires et a l'impression.
- Les tests de verification et d'audit continuent de passer.

## Phase 4 - Documentation, tests et durcissement de livraison

**Objectif**
- Rendre la solution maintenable et verifiable par l'equipe.

**Etat**
- Commencee: documentation d'acces, audit SQL et tests de non-regression ajoutes.

**Travaux**
- Documenter le modele d'acces Foncier: roles, villages, attestations, audit.
- Ajouter ou renforcer les tests de non-regression pour les hooks Foncier, l'impression d'attestation et la verification publique.
- Ajouter un script d'audit SQL reutilisable pour les policies et les vues Foncier.
- Documenter le plan de deploiement: ordre des migrations, verification, rollback.
- Identifier les migrations obsoletees ou redondantes, sans toucher a celles encore necessaires.

**Garde-fous**
- La documentation doit refléter l'etat reel du schema et non une intention.
- Les tests doivent couvrir les parcours qui ont casse historiquement: lecture, ecriture, audit, verification.

**Critere d'acceptation**
- Une personne externe peut comprendre le flux Foncier sans lire tout `src/pages/Foncier.tsx`.
- Un audit SQL peut confirmer rapidement l'etat des policies.
- Le deploiement est reproductible et explicite.

**Livrables**
- `docs/FONCIER_ACCESS_MODEL.md`
- `docs/FONCIER_DEPLOYMENT_PLAN.md`
- `sql/audit-foncier.sql`
- `scripts/audit-foncier.sh`
- `src/lib/__tests__/attestationVerification.test.ts`
- `src/test/PublicVerification.test.tsx`

## Ordre recommande

1. Phase 2: normalisation du schema.
2. Phase 3: reduction de l'exposition sensible.
3. Phase 4: documentation et tests.

## Definition de "sans casser"

- Les anciens parcours restent lisibles pendant la transition.
- Les changements schema sont additive-first.
- La verification publique continue de passer par l'Edge Function.
- Aucun changement d'autorisation ne repose sur `user_metadata`.
- Chaque migration importante est verifiee par un test SQL ou un test d'application pertinent.
