# Lot 5 - Architecture cible auto-hebergee EGS

Date: 2026-07-06
Statut: decision d'architecture
Portee: final state, reference systeme

## Decision centrale

EGS adopte une architecture unique, locale, stable et deployable:

```text
Navigateur
  -> Nginx
  -> React/Vite SPA
  -> FastAPI /api/v1
  -> PostgreSQL
  -> MinIO
  -> Redis
  -> Ollama optionnel
```

FastAPI devient la seule couche applicative. PostgreSQL devient la seule base de verite. Alembic devient la seule gouvernance schema. MinIO devient le stockage objet cible. Redis devient le support technique cache/session/queue. Nginx devient le point d'entree HTTP/TLS.

## Ce qui survit

| Composant | Statut cible | Role |
|---|---|---|
| React/Vite | Survivant coeur | Interface ERP et vitrine |
| FastAPI | Survivant coeur | API, metier, securite applicative |
| `/api/v1` | Survivant exclusif | Surface API unique |
| PostgreSQL | Survivant coeur | Donnees metier persistantes |
| Alembic | Survivant coeur | Versioning schema PostgreSQL |
| MinIO | Survivant coeur stockage | Documents, medias, assets |
| Redis | Survivant support | Cache, sessions, queues, jobs |
| Nginx | Survivant publication | Reverse proxy, TLS, SPA fallback |
| Docker Compose cible | Survivant ops | Deploiement local reproductible |
| Ollama | Survivant optionnel | IA locale |
| n8n | Survivant optionnel | Workflows non critiques |
| Uptime Kuma | Survivant optionnel | Monitoring local |

## Ce qui ne survit pas comme source de verite

| Composant | Statut final | Remplacement |
|---|---|---|
| Supabase Auth | Retire | JWT FastAPI + RBAC |
| Supabase Storage | Retire | MinIO via FastAPI |
| Supabase RPC | Retire | Services FastAPI explicites |
| Supabase Edge Functions | Retire | Endpoints FastAPI ou workers |
| Supabase Realtime | Retire | API polling, WebSocket FastAPI ou Redis pub/sub si necessaire |
| Supabase migrations actives | Archivees | Alembic |
| Kong | Retire sauf justification future | Nginx -> FastAPI direct |
| Traefik | Retire | Nginx unique |
| Filebrowser | Optionnel documentaire | Ne remplace pas MinIO |
| Dockerfiles historiques | Retires | Dockerfile frontend cible unique |
| Compose historiques | Retires | Compose cible unique + compose dev backend |

## Architecture runtime cible

### Frontend

- Le frontend ne parle jamais directement a PostgreSQL, MinIO, Redis, Ollama ou Supabase.
- Le frontend consomme uniquement `/api/v1/*`, plus les assets publics servis par Nginx.
- Les pages appellent des services metier frontend (`projectsService`, `foncierService`, `mediaService`) qui encapsulent `apiClient`.
- `apiClient` est le seul client HTTP bas niveau.
- `legacySupabaseAdapter` est interdit en final state.

### Backend

Structure cible:

```text
backend/app
  api/v1
  core
  auth
  services
  repositories
  models
  schemas
  workers
```

Regles:

- `main.py` reste un point d'entree, pas le coeur metier.
- Les routes ne contiennent pas de logique metier lourde.
- Les routes appellent des services.
- Les services appellent des repositories.
- Les repositories parlent a PostgreSQL, MinIO ou Redis.
- Aucun store memoire n'est accepte pour un module metier de production.

### Donnees

- Une seule base PostgreSQL: `egs`.
- Une seule politique schema: Alembic.
- Les migrations Supabase deviennent une archive historique non executee.
- Les seeds deviennent explicites, idempotents et separes des migrations structurelles.

### Stockage

- MinIO est le stockage objet cible.
- FastAPI genere les operations upload/download/delete.
- Les URLs publiques/presignees sont emises par FastAPI.
- Filebrowser peut rester seulement comme outil humain optionnel, pas comme storage applicatif.

### API

Regle absolue:

```text
Une fonctionnalite = une route ou un groupe de routes /api/v1 explicite.
```

Exemples cible:

| Domaine | Route cible |
|---|---|
| Auth | `/api/v1/auth/*` |
| Users | `/api/v1/users/*` |
| Settings | `/api/v1/settings` |
| Site content | `/api/v1/site-content` |
| Media | `/api/v1/media/*` |
| Foncier | `/api/v1/foncier/*` |
| Attestations | `/api/v1/attestations/*` |
| Leads | `/api/v1/leads/*` |
| Projects | `/api/v1/projects/*` |
| Finance | `/api/v1/finance/*` |
| Employees | `/api/v1/employees/*` |
| Suppliers | `/api/v1/suppliers/*` |
| Products | `/api/v1/products/*` |
| Immobilier | `/api/v1/immobilier/*` |

## Compose cible

`docker-compose.selfhosted.yml` est la base cible a consolider.

Il doit contenir a terme:

- `frontend`
- `nginx`
- `backend`
- `postgres`
- `redis`
- `minio`
- `ollama` optionnel
- `n8n` optionnel
- `uptime-kuma` optionnel

Il ne doit pas contenir:

- Supabase services;
- Kong;
- Traefik;
- Postgres initialise par `supabase/migrations`;
- Watchtower actif par defaut en production.

## Decisions survivants/non-survivants

| Sujet | Decision |
|---|---|
| Nginx vs Traefik | Nginx survit, Traefik sort |
| Kong vs FastAPI direct | FastAPI direct survit, Kong sort |
| MinIO vs Filebrowser | MinIO survit comme storage applicatif, Filebrowser reste optionnel humain |
| Alembic vs Supabase migrations | Alembic survit, Supabase migrations archivees |
| `apiClient` vs `apiService` | `apiClient` survit, `apiService` fusionne |
| `legacySupabaseAdapter` | Ne survit pas |
| Stores memoire backend | Ne survivent pas |
| Edge Functions | Ne survivent pas |
| `/api` legacy | Ne survit pas |

## Ordre de convergence

1. Stabiliser `/api/v1` sans casser les routes legacy.
2. Remplacer les appels frontend directs par services metier.
3. Remplacer les stores memoire par repositories PostgreSQL.
4. Remplacer Storage/RPC/Functions Supabase.
5. Basculer la gouvernance schema vers Alembic.
6. Consolider Compose/Nginx/Dockerfile.
7. Archiver Supabase et supprimer les adapters legacy.
8. Nettoyer docs/scripts/dependances.

## Criteres d'acceptation

- `rg "supabase.from|legacySupabaseAdapter|supabase.rpc|functions.invoke" src` ne retourne plus de runtime actif.
- `rg '"/api/' src` ne retourne que `/api/v1`.
- `backend/app/api/v1` couvre toutes les fonctionnalites runtime.
- Aucun module metier backend n'utilise de store memoire.
- `docker compose -f docker-compose.selfhosted.yml config` est valide.
- `npm run typecheck`, `npm run build`, tests backend et frontend passent.
- La documentation de deploiement ne presente plus plusieurs chemins concurrents.

