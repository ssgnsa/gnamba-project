# Lot 1 - Matrice des services EGS

Date: 2026-07-06
Statut: audit lecture seule

## Classification

| Niveau | Definition |
|---|---|
| Coeur cible | Necessaire a l'ERP local selon ADR 0001 |
| Support cible | Necessaire ou utile, mais integration a finaliser |
| Compatibilite legacy | Present pour transition, non cible a long terme |
| Optionnel | Fonction utile mais non indispensable au coeur ERP |
| Redondant probable | Alternative concurrente a arbitrer plus tard |

## Matrice globale

| Service | Niveau | Fichiers principaux | Ports observes | Donnees/volumes | Dependances | Commentaire |
|---|---|---|---|---|---|---|
| React/Vite frontend | Coeur cible | `src/**`, `package.json`, `Dockerfile` | 5173 dev, 80/8080 Docker | `dist/` | FastAPI cible, legacy Supabase encore present | Interface ERP et vitrine |
| FastAPI backend | Coeur cible | `backend/app/**`, `backend/Dockerfile` | 8000 | Aucun volume applicatif standard sauf storage local | PostgreSQL, JWT, SQLAlchemy | Source metier cible |
| PostgreSQL | Coeur cible | `backend/docker-compose.yml`, `docker-compose.selfhosted.yml`, `docker-compose.prod*.yml` | 5432 | `postgres_data`, `./data/postgres`, `/home/soma/data/postgres` | FastAPI, Alembic, n8n selon compose | Base de verite cible |
| Alembic | Coeur cible | `backend/alembic/**`, `backend/alembic.ini` | N/A | Versioning schema | PostgreSQL, SQLAlchemy | Gouvernance cible encore partielle |
| Redis | Support cible | `backend/docker-compose.yml`, `docker-compose.selfhosted.yml` | 6379 | Pas de volume observe | Backend futur | Present infra, peu consomme par code |
| MinIO | Support cible | `docker-compose.selfhosted.yml` | 9000, 9001 | `./data/minio:/data` | Backend stockage futur | Cible ADR, provider non implemente observe |
| Filebrowser | Optionnel / support documentaire | `docker-compose.yml`, `docker-compose.filebrowser*.yml`, `docker-compose.prod*.yml`, `src/lib/filebrowser.ts` | 8081 ou proxy `/filebrowser` | `/home/soma/partage`, `/home/soma/filebrowser/database`, `/home/soma/filebrowser/config` | Frontend, Nginx/Traefik | A arbitrer face a MinIO |
| Ollama | Optionnel local | `docker-compose.selfhosted.yml`, `src/lib/ollama.ts` | 11434 | `./data/ollama:/root/.ollama` | Frontend AICopilot | IA locale activee par env |
| Nginx statique | Coeur publication | `Dockerfile`, `nginx.conf`, `nginx-standalone.conf` | 80 | `/usr/share/nginx/html` | Frontend build | Sert SPA |
| Nginx reverse proxy | Coeur publication si retenu | `nginx/nginx.conf`, `nginx/nginx-production.conf`, `docker-compose.prod*.yml` | 80, 443 | `nginx/ssl`, `nginx/logs` | Frontend, Filebrowser, Kong, WOPI, Collabora | Proxy principal historique |
| Traefik | Redondant probable | `docker-compose.https.yml` | 80, 443 | `./letsencrypt` | Frontend, Filebrowser | Alternative a Nginx |
| Kong | Compatibilite legacy probable | `docker-compose.prod*.yml`, `kong/kong.yml` | 8000, 8443 | `kong/logs` | PostgreSQL, Nginx | Lie a logique Supabase/PostgREST historique |
| Supabase CLI | Compatibilite legacy | `package.json`, scripts, `supabase/**` | N/A | `supabase/.temp`, migrations | Supabase cloud/local historique | A inventorier au Lot 2 |
| Supabase Edge Functions | Compatibilite legacy | `supabase/functions/**`, workflow dedie | N/A | N/A | Supabase cloud | A remplacer par FastAPI/workers |
| WOPI Gateway | Optionnel documentaire avance | `wopi-gateway/**`, `docker-compose.prod*.yml` | 3000 | `/home/soma/partage/egs-docs` | Collabora, Filebrowser/docs | Edition Office |
| Collabora | Optionnel documentaire avance | `docker-compose.prod*.yml` | 9980 | N/A | WOPI Gateway | Office en ligne |
| n8n | Optionnel workflows | `docker-compose.prod*.yml`, `docker-compose.selfhosted.yml`, `n8n/database.sqlite3` | 5678 | `./n8n`, `./data/n8n` | PostgreSQL selon prod.secure | Automatisation |
| Samba | Optionnel LAN | `docker-compose.prod*.yml` | 139, 445 | `/home/soma/partage/egs-docs` | Filebrowser/docs | Partage reseau |
| Watchtower | Optionnel ops | `docker-compose.selfhosted.yml` | N/A | Docker socket | Docker daemon | Auto-update, risque prod a encadrer |
| Uptime Kuma | Optionnel monitoring | `docker-compose.selfhosted.yml` | 3001 | `./data/uptime-kuma` | Reseau Docker | Monitoring |
| Cloudflared | Optionnel reseau | `cloudflared/**`, `docker/cloudflared-compose.yml` | N/A | config tunnel | Cloudflare | Tunnel externe |

## Matrice par fichier Compose

| Compose | Services | Evaluation Lot 1 |
|---|---|---|
| `docker-compose.yml` | `egs-frontend`, `egs-web`, `filebrowser` | Compose frontend/Filebrowser, pas ERP local complet |
| `backend/docker-compose.yml` | `postgres`, `redis`, `backend` | Stack dev backend minimale et coherente |
| `docker-compose.selfhosted.yml` | `postgres`, `redis`, `backend`, `minio`, `ollama`, `n8n`, `watchtower`, `uptime-kuma` | Candidate socle local, mais frontend/Nginx et variables DB backend a renforcer |
| `docker-compose.prod.yml` | `nginx-proxy`, `postgres`, `kong`, `filebrowser`, `wopi-gateway`, `collabora`, `n8n`, `samba`, `egs-frontend` | Production historique riche, encore non FastAPI-first |
| `docker-compose.prod.secure.yml` | Nginx durci, Postgres, Kong, Filebrowser, WOPI, Collabora, n8n, Samba, frontend | Plus securise, mais conserve Kong/Supabase et pas backend FastAPI comme coeur |
| `docker-compose.server.yml` | `egs-web` | Frontend serveur local seulement |
| `docker-compose.https.yml` | `traefik`, `egs-web`, `filebrowser` | Alternative proxy HTTPS |
| `docker-compose.standalone.yml` | `egs-frontend-standalone` | Frontend seul |
| `docker-compose.filebrowser.yml` | `filebrowser` | Service documentaire isole |
| `docker-compose.filebrowser.simple.yml` | `filebrowser` | Redondant avec precedent |
| `docker/cloudflared-compose.yml` | `cloudflared` | Tunnel optionnel |

## Ports observes

| Port | Service |
|---|---|
| 80 | Nginx/frontend/Filebrowser proxy |
| 443 | Nginx/Traefik TLS |
| 139, 445 | Samba |
| 3000 | WOPI Gateway |
| 3001 | Uptime Kuma |
| 5173 | Vite dev |
| 5432 | PostgreSQL local/self-hosted |
| 5678 | n8n |
| 6379 | Redis |
| 8000 | FastAPI ou Kong selon Compose |
| 8443 | Kong HTTPS |
| 8080 | Frontend standalone/prod alias |
| 8081 | Filebrowser |
| 9000 | MinIO API |
| 9001 | MinIO console |
| 9980 | Collabora |
| 11434 | Ollama |

## Volumes et donnees

| Chemin/volume | Service | Risque |
|---|---|---|
| `postgres_data` | PostgreSQL | Plusieurs definitions selon Compose |
| `./data/postgres` | PostgreSQL self-hosted | Local au repo, a confirmer pour prod |
| `/home/soma/data/postgres` | PostgreSQL prod secure | Donnees serveur |
| `./supabase/migrations:/docker-entrypoint-initdb.d` | PostgreSQL prod secure | Gouvernance schema legacy |
| `./data/minio:/data` | MinIO | Cible stockage objet |
| `/home/soma/partage` | Filebrowser | Racine documentaire large |
| `/home/soma/partage/egs-docs` | Filebrowser/WOPI/Samba | Racine documentaire cible possible |
| `/home/soma/filebrowser/database` | Filebrowser | DB Filebrowser |
| `/home/soma/filebrowser/config` | Filebrowser | Config Filebrowser |
| `./data/ollama:/root/.ollama` | Ollama | Modeles IA locaux |
| `./n8n` ou `./data/n8n` | n8n | Divergence SQLite/Postgres possible |
| `nginx/ssl` | Nginx | Certificats sensibles |
| `nginx/logs` | Nginx | Logs |
| `kong/logs` | Kong | Logs |

## Dependances critiques a trancher plus tard

| Sujet | Pourquoi |
|---|---|
| Nginx vs Traefik | Deux reverse proxies concurrents |
| Kong vs FastAPI direct | Kong semble herite d'un modele Supabase/PostgREST |
| MinIO vs Filebrowser | Deux modeles de gestion documentaire |
| Alembic vs migrations Supabase | Deux gouvernances schema |
| Compose self-hosted vs prod secure | Aucun ne correspond encore parfaitement a la cible ADR 0001 |
| `/api` vs `/api/v1` | Surface API double, Lot 3 |

## Validation recommandee pour ce lot

Commandes non destructives a utiliser avant validation finale:

```bash
npm ls --depth=0 --omit=optional
docker compose -f docker-compose.selfhosted.yml config
docker compose -f backend/docker-compose.yml config
docker compose -f docker-compose.prod.secure.yml config
python -m compileall backend/app
cd backend && alembic history
```

Ne pas executer `up`, `down`, `db push`, `upgrade`, `reset` ou toute commande destructive dans le cadre du Lot 1.
