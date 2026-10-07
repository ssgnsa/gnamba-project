# Lot 1 - Cartographie des dependances EGS

Date: 2026-07-06
Statut: audit lecture seule
Portee: Lot 1 uniquement

## Regles appliquees

- Aucune suppression.
- Aucune modification fonctionnelle.
- Aucun lancement de migration.
- Aucun choix definitif de suppression.
- Cartographie limitee aux dependances projet, infrastructure, scripts, documentation et CI/CD.

## Synthese

EGS est dans un etat hybride avance:

- le frontend historique React/Vite consomme encore des compatibilites Supabase;
- un backend FastAPI/PostgreSQL/Alembic existe et pose la cible locale;
- plusieurs piles Docker coexistent;
- PostgreSQL a deux chemins de gouvernance concurrents: migrations SQL Supabase et Alembic;
- l'architecture cible FastAPI/PostgreSQL/MinIO/Redis est actee par l'ADR 0001;
- la source operationnelle officielle n'est pas encore unique.

Le Lot 1 confirme que la priorite d'industrialisation n'est pas d'ajouter des modules, mais de figer les sources de verite techniques.

## Frontend

### Manifests

Fichiers:

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `tsconfig.codex.json`
- `eslint.config.js`
- `tailwind.config.js`
- `postcss.config.js`
- `vitest.config.ts`

Dependances principales declarees:

| Groupe | Dependances |
|---|---|
| UI | `react`, `react-dom`, `lucide-react`, `tailwindcss` |
| Build | `vite`, `@vitejs/plugin-react`, `typescript`, `esbuild` |
| Tests | `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` |
| Qualite | `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` |
| Documents / medias | `docx`, `qrcode`, `dompurify`, `@resvg/resvg-js` |
| Notifications / securite | `react-onesignal`, `react-turnstile` |
| Ops / assistant | `dockerode`, `commander`, `ws`, `puppeteer`, `zod` |
| Supabase CLI | `supabase` |

Signal observe:

- `@supabase/supabase-js` est present dans `package-lock.json` et dans `node_modules` comme dependance extraneous, mais il n'est pas declare dans `package.json`.
- Le code source importe encore `@supabase/supabase-js` via `src/lib/supabase.ts`.
- Ce point appartient au Lot 2 pour l'inventaire Supabase detaille.

### Points d'entree et clients

| Fichier | Role | Etat |
|---|---|---|
| `src/App.tsx` | Shell SPA, navigation state-based | Actif |
| `src/api/client.ts` | Client API locale unifiee | Actif, cible `/api/v1` |
| `src/services/api/client.ts` | Second client API local | Doublon potentiel a consolider plus tard |
| `src/data/client.ts` | Wrapper interdisant le legacy Supabase | Transition |
| `src/lib/supabase.ts` | Client Supabase legacy/proxy self-hosted | Compatibilite transitoire |
| `src/lib/selfHosted.ts` | Resolution mode local/API/stockage | Actif |
| `src/lib/filebrowser.ts` | Client REST Filebrowser | Actif si Filebrowser conserve |
| `src/lib/ollama.ts` | Client Ollama local | Actif si IA locale activee |

### Variables frontend observees

| Variable | Usage |
|---|---|
| `VITE_SUPABASE_MODE` | Mode historique local/cloud/self-hosted |
| `VITE_SUPABASE_LOCAL_URL` | URL API Supabase locale historique |
| `VITE_SUPABASE_LOCAL_ANON_KEY` | Cle publishable historique |
| `VITE_SUPABASE_URL` | URL Supabase cloud legacy |
| `VITE_SUPABASE_ANON_KEY` | Cle Supabase cloud legacy |
| `VITE_SELFHOSTED_MODE` | Activation explicite self-hosted |
| `VITE_LOCAL_API_URL` | Base URL FastAPI locale |
| `VITE_STORAGE_BASE_URL` | Base URL stockage local |
| `VITE_FILEBROWSER_URL` | Base URL Filebrowser |
| `VITE_FILEBROWSER_API_URL` | API Filebrowser |
| `VITE_ENABLE_OLLAMA` | Activation Ollama |
| `VITE_OLLAMA_URL` | URL Ollama |
| `VITE_OLLAMA_MODEL` | Modele Ollama par defaut |
| `VITE_ENABLE_SERVICE_WORKER` | Activation PWA |
| `VITE_ONESIGNAL_APP_ID` | Notifications push |
| `VITE_ENABLE_ONESIGNAL` | Activation OneSignal |
| `VITE_SENTRY_DSN` | Observabilite externe optionnelle |
| `VITE_ENABLE_SENTRY` | Activation Sentry |
| `VITE_CLOUDFLARE_TURNSTILE_SECRET_KEY` | Validation de configuration, sensible si exposee |

## Backend FastAPI

### Manifests

Fichiers:

- `backend/requirements.txt`
- `backend/alembic.ini`
- `backend/pytest.ini`
- `backend/Dockerfile`
- `backend/docker-compose.yml`

Dependances Python declarees:

| Dependances | Role |
|---|---|
| `fastapi==0.115.0` | Framework API |
| `uvicorn[standard]==0.30.0` | Serveur ASGI |
| `PyJWT==2.10.0` | JWT local |
| `pydantic[email]==2.6.3` | Validation schemas |
| `sqlalchemy==2.0.23` | ORM PostgreSQL |
| `alembic==1.13.1` | Migrations cible |
| `psycopg2-binary==2.9.9` | Driver PostgreSQL |

### Structure backend observee

| Zone | Role |
|---|---|
| `backend/app/main.py` | Point d'entree FastAPI |
| `backend/app/api/v1` | Routers API actuels |
| `backend/app/api/deps` | Dependances FastAPI |
| `backend/app/core` | Config, securite, database, bootstrap |
| `backend/app/services` | Services applicatifs |
| `backend/app/application` | Couche applicative supplementaire |
| `backend/app/repositories` | Interfaces repositories |
| `backend/app/infrastructure` | Implementations SQLAlchemy |
| `backend/app/models` | Modeles persistants |
| `backend/app/schemas` | Schemas Pydantic |
| `backend/tests` | Tests backend |

### Routes backend observees

Note: cartographie detaillee des routes et consommateurs = Lot 3. Ici, seul le constat de dependance est conserve.

| Prefixe | Etat |
|---|---|
| `/health` | Endpoint technique actif |
| `/api/auth` | Legacy backend |
| `/api/users` | Legacy backend |
| `/api/settings` | Legacy/backend non versionne |
| `/api/site-content` | Legacy/backend non versionne |
| `/api/media` | Legacy/backend non versionne |
| `/api/attestations/verify` | Route directe dans `main.py` |
| `/api/v1/auth` | Cible versionnee |
| `/api/v1/users` | Cible versionnee |
| `/api/v1/projects` | Cible versionnee |
| `/api/v1/employees` | Cible versionnee |
| `/api/v1/suppliers` | Cible versionnee |
| `/api/v1/products` | Cible versionnee |
| `/api/v1/finance` | Cible versionnee |
| `/api/v1/immobilier` | Cible versionnee |
| `/api/v1/foncier` | Cible versionnee |

### Stockage backend

Fichier principal:

- `backend/app/services/storage_provider.py`

Etat observe:

- provider local fichier actif via `LOCAL_STORAGE_ROOT`;
- URL publique via `LOCAL_STORAGE_BASE_URL`;
- MinIO est present en infrastructure, mais pas encore implemente comme provider applicatif dans les dependances Python observees;
- aucune dependance `boto3` ou client S3 n'est declaree dans `backend/requirements.txt`.

## PostgreSQL et migrations

### Sources observees

| Source | Role actuel | Risque |
|---|---|---|
| `backend/alembic` | Gouvernance cible FastAPI | Couverture schema encore limitee |
| `backend/alembic/versions/001_initial_create_users.py` | Table `users` | Cible auth locale |
| `backend/alembic/versions/002_add_core_domain_tables.py` | Table `audit_logs` | Base audit minimale |
| `supabase/migrations` | Historique schema complet legacy | Concurrence avec Alembic |
| `supabase/manual-migrations` | Migrations manuelles legacy | Source supplementaire |
| `supabase/seed*.sql` | Seeds legacy/local | A qualifier avant migration |

Decision ADR existante:

- PostgreSQL est la source de verite cible.
- Alembic doit devenir la gouvernance de schema cible.
- Les migrations Supabase doivent etre traitees comme source historique/transitoire tant que la migration n'est pas terminee.

## Docker

### Fichiers Dockerfiles

| Fichier | Role observe |
|---|---|
| `Dockerfile` | Build frontend Vite + Nginx, mode Supabase local historique obligatoire |
| `Dockerfile.runtime` | Variante frontend runtime avec Nginx standalone |
| `Dockerfile.standalone` | Variante frontend standalone, accepte local/cloud/auto |
| `Dockerfile.simple` | Variante ancienne/simple |
| `Dockerfile.nofb` | Variante sans Filebrowser |
| `Dockerfile.runtime` | Variante runtime |
| `backend/Dockerfile` | Backend FastAPI/Uvicorn |
| `wopi-gateway/Dockerfile` | Gateway WOPI Node/Express |

### Compose observes

| Fichier | Role observe | Commentaire |
|---|---|---|
| `docker-compose.yml` | Frontend dev/prod + Filebrowser | Encore centre frontend/Supabase local |
| `docker-compose.server.yml` | Serveur local frontend | Depend des variables Supabase local |
| `docker-compose.prod.yml` | Production historique avec Nginx, Postgres, Kong, Filebrowser, WOPI, Collabora, n8n, Samba, frontend | Inclut Postgres initialise par migrations Supabase |
| `docker-compose.prod.secure.yml` | Production securisee durcie | Plus complete, mais encore Kong/Supabase variables |
| `docker-compose.selfhosted.yml` | Stack cible locale: Postgres, Redis, backend, MinIO, Ollama, n8n, Watchtower, Uptime Kuma | Candidate pour socle cible, a normaliser |
| `backend/docker-compose.yml` | Stack backend minimale: Postgres, Redis, backend | Utile pour developpement backend |
| `docker-compose.https.yml` | Traefik + frontend + Filebrowser | Variante proxy concurrente |
| `docker-compose.standalone.yml` | Frontend standalone | Non suffisant pour ERP local complet |
| `docker-compose.filebrowser.yml` | Filebrowser seul | Outil documentaire |
| `docker-compose.filebrowser.simple.yml` | Filebrowser seul simplifie | Redondant |
| `docker/cloudflared-compose.yml` | Tunnel Cloudflare | Peripherique reseau |

## Nginx, Traefik, Kong et reseau

| Composant | Fichiers | Etat |
|---|---|---|
| Nginx statique frontend | `nginx.conf`, `nginx-standalone.conf`, `nginx-simple.conf`, `nginx-fixed.conf` | Sert la SPA, parfois bloque `/api/` |
| Nginx reverse proxy | `nginx/nginx.conf`, `nginx/nginx-production.conf` | Proxy domaines, Filebrowser, Kong, WOPI, Collabora |
| Traefik | `docker-compose.https.yml` | Alternative concurrente a Nginx |
| Kong | `kong/kong.yml`, Compose prod | Herite logique Supabase/PostgREST, a qualifier |
| Cloudflared | `cloudflared/**`, `docker/cloudflared-compose.yml` | Tunnel reseau optionnel |

## Services locaux et externes

| Service | Declaration | Consommation code | Etat Lot 1 |
|---|---|---|---|
| PostgreSQL | Compose self-hosted/backend/prod | Backend SQLAlchemy | Coeur cible |
| FastAPI | `backend/Dockerfile`, backend code | Frontend via `/api/v1` | Coeur cible |
| Redis | Compose self-hosted/backend | Peu ou pas consomme dans code observe | Cible support, integration a finaliser |
| MinIO | Compose self-hosted | Pas de client backend S3 declare | Cible stockage, implementation incomplete |
| Filebrowser | Compose principal/prod/filebrowser | `src/lib/filebrowser.ts` | Support documentaire, statut a trancher face a MinIO |
| Ollama | Compose self-hosted | `src/lib/ollama.ts` | IA locale optionnelle |
| Nginx | Dockerfiles/Compose prod | Proxy/static | Coeur de publication |
| Kong | Compose prod | API gateway legacy | A qualifier |
| Traefik | Compose HTTPS | Proxy alternatif | Redondance probable |
| WOPI Gateway | `wopi-gateway/**` | Documents Office | Optionnel documentaire avance |
| Collabora | Compose prod | Via WOPI | Optionnel documentaire avance |
| n8n | Compose prod/self-hosted | Workflows | Optionnel ops/metier |
| Watchtower | Compose self-hosted | Ops Docker | Optionnel |
| Uptime Kuma | Compose self-hosted | Monitoring | Optionnel |
| Samba | Compose prod/prod.secure | Partage fichiers LAN | Optionnel |
| Cloudflare Turnstile | Frontend/env | Login/verifications | Optionnel/securite externe |
| OneSignal | Frontend/functions/env | Notifications | Optionnel externe |
| Sentry | Frontend/env | Observabilite externe | Optionnel externe |

## Scripts

Environ 85 scripts ont ete observes dans `scripts/`.

Categories:

| Categorie | Exemples |
|---|---|
| Validation | `validate-env.sh`, `validate-frontend-release.sh`, `validate-prod-deployment.sh`, `validate-selfhosted.sh` |
| Stack locale | `workspace-stack.sh`, `workspace-doctor.sh`, `database/postgres-local.sh`, `selfhosted-check.sh` |
| Supabase legacy | `backup-supabase.sh`, `sync-supabase-migrations.sh`, `recover-supabase-cloud.sh`, `refresh-egs-schema.sh`, `deploy-via-api.sh` |
| Backup | `backup.sh`, `backup/backup-manager.sh`, `backup/backup-scheduler.sh`, `verify-backup.sh` |
| Monitoring | `monitor.sh`, `gnamba-monitor.sh`, `gnamba-health.sh`, `install-monitoring.sh` |
| Sync | `sync-workflow.sh`, `sync-schema-and-data.sh`, `sync-simple.sh`, `sync-via-api.sh` |
| Foncier | `audit-foncier.sh`, `egs-schema-audit.sh` |
| Docs / migration | `migrate-docs.sh`, `analyze-repo.mjs` |
| Archives | `scripts/_archive/**` |

Lot 1 ne classe pas encore les scripts comme supprimables. Le nettoyage securise appartient au Lot 6.

## CI/CD

Workflows observes:

| Workflow | Role | Etat |
|---|---|---|
| `.github/workflows/deploy.yml` | Build, lint, typecheck, Docker image frontend, deploy SSH | Encore construit avec variables Supabase local |
| `.github/workflows/deploy-prod.yml` | Build/push GHCR frontend, deploy prod | Pointe `docker-compose.prod.yml` |
| `.github/workflows/deploy-supabase-functions.yml` | Deploy Edge Function Supabase | Legacy cloud, a traiter au Lot 2 |

Constat:

- La CI/CD n'est pas encore alignee sur l'architecture 100 % locale.
- Le backend FastAPI n'est pas encore la cible principale du pipeline de production observe.
- Les Edge Functions Supabase ont encore un workflow dedie.

## Documentation

Fichiers structurants:

| Fichier | Role |
|---|---|
| `docs/adr/0001-source-of-truth-fastapi.md` | Decision source de verite FastAPI/PostgreSQL |
| `docs/adr/0002-backend-architecture-target.md` | Architecture cible backend |
| `docs/ARCHITECTURE_UNIFICATION_REPORT.md` | Audit/rapport d'unification |
| `docs/API_ROUTES.md` | Documentation routes API |
| `docs/DEPENDENCY_MATRIX.md` | Matrice existante a comparer |
| `docs/SELF_HOSTED_AUDIT.md` | Audit self-hosted |
| `docs/START_HERE.md` | Etat de reprise ancien |
| `README.md`, `backend/README.md` | Documentation operationnelle |

Constat:

- Documentation abondante mais dispersee.
- Certaines dates et statuts divergent.
- Les ADR recentes doivent devenir la reference d'architecture.

## Risques Lot 1

| Risque | Impact | Mitigation |
|---|---|---|
| Deux gouvernances DB | Migration incoherente ou pertes schema | Ne rien appliquer avant Lot 2/5 |
| Plusieurs Compose concurrents | Production non reproductible | Designer une source officielle au Lot 5 |
| Routes `/api` et `/api/v1` coexistantes | Doublons consommateurs | Cartographie detaillee au Lot 3 |
| Supabase encore present | Couplage cloud/local ambigu | Inventaire complet au Lot 2 |
| Filebrowser et MinIO en parallele | Double modele documentaire | Decision d'architecture au Lot 5 |
| CI/CD frontend seulement | Backend non industrialise | Plan CI cible au Lot 5 |

## Criteres de validation Lot 1

- Les dependances applicatives sont cartographiees.
- Les services Docker sont cartographies.
- Les sources de verite concurrentes sont identifiees.
- Les scripts et workflows sont classes par famille.
- Aucune suppression n'a ete effectuee.
- Aucune migration n'a ete executee.
- Les Lots 2 a 6 peuvent demarrer sur une base factuelle.
