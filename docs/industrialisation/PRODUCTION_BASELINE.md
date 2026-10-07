# Production baseline

Date: 2026-07-07
Statut: baseline courante

## Baseline retenue

La baseline de production courante pour EGS est:

- frontend React/Vite;
- backend FastAPI;
- PostgreSQL comme source de vérité;
- build frontend officiel dans `dist/`;
- publication vers `/var/www/egs/current`.

## État vérifié

- `npm run release:check` bloque les patterns Supabase interdits et les anciens répertoires de build.
- `npm run validate:frontend` vérifie l'artefact buildé et les en-têtes de publication.
- `scripts/deploy-production.sh` est le point de passage officiel pour le déploiement.

## Hypothèses d'exploitation

- Le parc d'exploitation doit servir l'artefact valide, pas un build ancien.
- Les chemins legacy Supabase restent hors du runtime courant.
- Les fichiers d'archive et de transition peuvent rester dans le dépôt tant qu'ils ne sont pas confondus avec la baseline.

## Risques connus

- Des artefacts historiques hors `dist/` peuvent encore exister tant qu'ils n'ont pas été purgés.
- La validation navigateur dépend d'un environnement Chromium fonctionnel.
- Les artefacts historiques de migration peuvent créer de la confusion si aucun repère baseline n'est conservé.
