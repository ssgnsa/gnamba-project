# Architecture de release unique

Date: 2026-07-07
Statut: reference

## Principe

EGS a une seule chaîne de release officielle:

- source unique: repository Git;
- build unique: `npm run build`;
- artefact unique: `dist/`;
- déploiement unique: `scripts/deploy-production.sh`;
- publication unique: `/var/www/egs/current`.
- runtime conteneur unique: `docker-compose.yml`;
- configuration Nginx unique: `nginx/nginx-release.conf`;
- API unique: backend FastAPI local exposé par `egs-api`.

Toute autre variante de build ou de publication est désormais legacy et ne doit plus être utilisée comme chemin de référence.

## Frontend

- L'application reste une SPA sans routeur.
- La navigation est pilotée par l'état React dans `App.tsx`.
- Les écrans admin et publics sont importés directement.
- Les appels métier passent par `src/api/client.ts`.
- Les accès table historiques passent uniquement par `src/data/tableClient.ts` pendant leur remplacement par des repositories métier.
- Le frontend publié ne doit pas contenir de routes directes vers l'ancienne plateforme de données.

## Backend

- Le backend officiel est l'application FastAPI dans `backend/`.
- Le service conteneur officiel est `egs-api` dans `docker-compose.yml`.
- La configuration runtime passe par `DATABASE_URL` et `LOCAL_AUTH_SECRET`.
- Les checks de connectivité frontend interrogent `/health` sur l'API locale.

## Déploiement

- `Dockerfile` construit `dist/` puis copie l'artefact vers `/var/www/egs/current`.
- L'image frontend utilise `nginx/nginx-release.conf`.
- `docker-entrypoint.sh` ne substitue que `VITE_API_MODE` et `VITE_LOCAL_API_URL`.
- Aucun autre fichier Compose racine ne doit être exécutable.

## Contrôles de release

- `npm run release:check` bloque les références interdites dans `src/`, `dist/`, `index.html`, `Dockerfile`, `docker-compose.yml` et `package.json`.
- `npm run validate:frontend` vérifie l'artefact buildé et les en-têtes de publication.
- `scripts/deploy-production.sh` nettoie les anciens artefacts, construit `dist/`, génère `VERSION.json` et publie vers le répertoire officiel.

## Règles

- Ne pas réintroduire `dist-local/` ou `dist_old/` comme artefacts actifs.
- Ne pas rétablir les routes ou bundles de plateforme données héritée dans le frontend publié.
- Ne pas multiplier les scripts de déploiement actifs.

## Rapport d'unification 2026-07-07

| Élément supprimé | Pourquoi il existait | Remplacement officiel | Preuve de non-usage | Impact |
| --- | --- | --- | --- | --- |
| `src/lib/legacySupabaseAdapter.ts` | Transition entre appels table historiques et API locale | `src/data/tableClient.ts` + `src/api/client.ts` | `npm run typecheck` OK, scan global actif sans référence | Supprime le fallback legacy côté bundle |
| `src/lib/supabase.ts` | Proxy désactivé de compatibilité | `src/data/tableClient.ts` | `npm run typecheck` OK | Retire une deuxième manière d'importer le client données |
| `Dockerfile.runtime`, `Dockerfile.simple`, `Dockerfile.standalone`, `Dockerfile.nofb` | Variantes de build frontend | `Dockerfile` | `find` ne liste plus qu'un Dockerfile frontend racine | Un seul build conteneur frontend |
| `docker-compose.*.yml` racine alternatifs | Déploiements historiques prod/server/standalone/https/selfhosted | `docker-compose.yml` | `find` ne liste plus qu'un compose racine | Un seul runtime conteneur officiel |
| `nginx-fixed.conf`, `nginx-simple.conf`, `nginx-standalone.conf`, `nginx.conf`, `nginx/nginx-production.conf`, `nginx/nginx.conf` | Configurations Nginx concurrentes | `nginx/nginx-release.conf` | `Dockerfile` copie la config officielle | Un seul dossier servi: `/var/www/egs/current` |
| `scripts/deploy.sh`, `scripts/deploy_server.sh`, `scripts/deploy-via-api.sh`, `scripts/deploy-and-verify.sh` | Déploiements anciens et wrappers | `scripts/deploy-production.sh` | `package.json` ne référence plus que `deploy:server` et `deploy:prod` | Une seule commande de déploiement |
| `src/hooks/useRealtimePayments.ts` | Stub non utilisé | Aucun, fonctionnalité absente du flux officiel | `rg useRealtimePayments src` sans référence | Supprime un faux point d'extension |
| Dépendance CLI legacy dans `package.json` | Commandes historiques de base managée | API locale + scripts DB locaux | `package-lock.json` sans dépendance associée | Le frontend n'embarque plus cette dépendance |
