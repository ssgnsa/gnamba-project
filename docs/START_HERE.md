# START HERE — Session suivante

**Dernière mise à jour** : 2026-06-16
**Phase actuelle** : Phase 1 - Stabilisation EGS
**Statut** : en cours
**Programme Health Score** : 78/100

## Objectif

Stabiliser EGS, nettoyer le workspace/serveur des artefacts inutiles, puis garder une documentation courte et exploitable pour la reprise.

## État vérifié

- Les artefacts manifestement accidentels `-`, `ubprocess`, `ubprocess.run(...)` et `.tmp/` ont été retirés du workspace.
- `bash scripts/workspace-stack.sh status` signale EGS en mode cloud avec le frontend offline; le Supabase local est arrêté.
- `bash scripts/workspace-doctor.sh` signale un drift de schéma EGS tant que le snapshot cloud reste absent.
- La validation `npm run typecheck`, `npm run lint` et `npm run build` n’a pas pu être exécutée ici car `node` et `npm` ne sont pas disponibles dans ce shell.
- Le répertoire `node_modules.corrupt.1780927163/` reste présent, mais sa suppression locale est bloquée par les permissions du système; il faut le traiter depuis la machine qui en est propriétaire.

## Prochaines actions

0. Lire le cahier des charges final de l’assistant: [docs/governance/CODEX_ASSISTANT_CAHIER_DES_CHARGES.md](/home/soma/gnamba-project/docs/governance/CODEX_ASSISTANT_CAHIER_DES_CHARGES.md).
1. Lire le gel serveur: [docs/SERVER_FREEZE_2026-06-16.md](/home/soma/gnamba-project/docs/SERVER_FREEZE_2026-06-16.md).
2. Lire l’inventaire serveur: [docs/SERVER_INVENTORY_2026-06-16.md](/home/soma/gnamba-project/docs/SERVER_INVENTORY_2026-06-16.md).
3. Préparer ensuite le dossier séparé `supabase-core` pour la stack officielle.
4. Rendre l’outillage Node disponible puis relancer `npm run typecheck`, `npm run lint` et `npm run build`.
5. Nettoyer ou régénérer `node_modules.corrupt.1780927163/` sur le serveur avec les bons droits.

## Rappel

- Ne pas toucher aux fichiers `.env*`.
- Ne pas mélanger les environnements.
- Documenter tout écart d’environnement avant d’automatiser une correction.
