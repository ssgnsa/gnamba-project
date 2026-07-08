# Plan de deploiement Foncier

Ce plan decrit l'ordre pratique pour livrer le module Foncier sans casser les parcours existants.

## Ordre recommande

1. Appliquer les migrations Foncier dans l'ordre naturel du dossier `supabase/migrations/`.
2. Verifier que la base locale ou cible accepte les vues et policies nouvelles.
3. Executer les tests TypeScript et les tests Foncier relies a la verification publique.
4. Lancer l'audit SQL Foncier.
5. Faire une verification fonctionnelle manuelle sur un lot reel ou de demo.

## Ordre Foncier critique

Pour un deploiement cible Foncier, les jalons importants sont:

- Base et RPC Foncier.
- Tables attestations et temoins.
- Fix RLS et securite RPC.
- Normalisation des villages.
- Durcissement de la verification publique.

Les migrations sont additives-first: on ajoute d'abord, on remplace ensuite, on ne retire qu'apres validation.

## Verification avant release

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test:run -- src/lib/__tests__/attestationVerification.test.ts src/test/PublicVerification.test.tsx`
- `bash scripts/audit-foncier.sh`

## Verification fonctionnelle

- Ouvrir la page publique `verification-attestation` avec une reference valide.
- Confirmer que la page affiche le statut d'authenticite.
- Confirmer que les donnees privees sont masquees quand la reponse publique ne les contient pas.
- Imprimer une attestation Foncier et verifier que le QR code reste fonctionnel.

## Rollback

- Ne jamais modifier une migration deja appliquee en production.
- En cas de regression, creer une nouvelle migration corrective.
- Si le probleme touche le frontend seulement, restaurer le code via un commit inverse et republier.
- Si le probleme touche la verification publique, conserver la vue minimale et corriger l'Edge Function dans une migration ou un patch suivant.

## Points de vigilance

- Ne pas supprimer `user_village_access` sans remplacer le controle de perimetre.
- Ne pas retirer les colonnes d'impression ou d'audit sans verifier leur usage dans `print.ts`.
- Ne pas baser l'autorisation sur `user_metadata`.
- Ne pas exposer les temoins et l'identite complete dans la surface publique.
