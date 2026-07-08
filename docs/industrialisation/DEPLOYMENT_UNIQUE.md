# Deployment unique

Date: 2026-07-07
Statut: reference de deploiement

## Cible

Le chemin officiel est:

- `npm run build`
- `npm run release:check`
- synchronisation vers `/var/www/egs/current`
- rechargement de Nginx

## Artefacts

- artefact frontend officiel: `dist/`
- manifeste de preuve: `dist/VERSION.json`
- configuration Nginx officielle: `nginx/nginx-release.conf`

## Procédure de haut niveau

1. Valider le commit Git courant.
2. Installer les dépendances avec `npm ci`.
3. Nettoyer les artefacts historiques locaux.
4. Construire `dist/` avec `npm run build`.
5. Générer et publier `VERSION.json`.
6. Vérifier la release avec `npm run release:check`.
7. Synchroniser `dist/` vers `/var/www/egs/current`.
8. Recharger Nginx.

## Points de contrôle

- vérifier que l'artefact ne contient aucune référence `supabase.co`, `supabase.in`, `/functions/v1`, `/rest/v1`, `capture-lead`, `@supabase` ou `supabase-vendor`;
- vérifier que `/var/www/egs/current/VERSION.json` contient le commit Git courant;
- vérifier que Nginx ne sert qu'à partir de `/var/www/egs/current`.
