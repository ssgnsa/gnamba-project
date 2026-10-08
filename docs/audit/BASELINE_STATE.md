---
document: BASELINE_STATE.md
phase: "0ter"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: historical snapshot superseded by 2026-10-07 reassessment
inputs_used:
  - docker ps -a
  - docker images
  - docker volume ls
  - docker network ls
  - supabase status
  - systemctl --user status cloudflared
  - systemctl status egs-web
  - curl http://localhost
  - curl https://gnambaservices.ci
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# Baseline State

> **Notice (2026-10-07):** the values and service names below describe the
> 2026-06-17 snapshot only. They do not describe the current server. See
> "Current reassessment" at the end of this file. No critical service was
> stopped or modified while refreshing the baseline.

## Résumé

L’état courant est maintenant exploitable. La page principale répond, le tunnel Cloudflare est sain et le socle Supabase local fonctionne. Le problème de page blanche n’est plus reproductible sur les endpoints testés.

## État runtime observé

| Élément | État | Détail |
| --- | --- | --- |
| `egs-web` | Running healthy | Exposé sur `0.0.0.0:80->80/tcp` |
| `cloudflared.service` | Running | Tunnel unique `gnamba-web` |
| Supabase DB | Running healthy | `supabase_db_gnamba-project` sur `54322` |
| Supabase Auth | Running healthy | `supabase_auth_gnamba-project` |
| Supabase REST | Running | `supabase_rest_gnamba-project` sur `54321` |
| Supabase Storage | Running healthy | `supabase_storage_gnamba-project` |
| Supabase Realtime | Running healthy | `supabase_realtime_gnamba-project` |
| Filebrowser | Running healthy | `0.0.0.0:8081->80/tcp` |
| `egs-kong` | Running healthy | `0.0.0.0:8000->8000/tcp`, `0.0.0.0:8443->8443/tcp` |
| Supabase Studio / Pooler / ImgProxy / Analytics | Stopped | Désactivés |

## Ports observés

- `80` pour EGS Studio
- `54321` pour Supabase API via Kong
- `54322` pour PostgreSQL local
- `54324` pour Inbucket
- `8081` pour Filebrowser
- `8000` et `8443` pour `egs-kong`

## DNS et tunnel

- `cloudflared tunnel list` ne montre qu’un seul tunnel actif: `gnamba-web`
- `~/.cloudflared/config.yml` mappe:
  - `gnambaservices.ci` vers `http://localhost:80`
  - `api.gnambaservices.ci` vers `http://localhost:54321`
  - `files.gnambaservices.ci` vers `http://localhost:8081`
- Les requêtes HTTPS externes testées répondent en `200`

## Diagnostic de la page blanche

Cause probable historique, classée par probabilité:

1. Ancien tunnel Cloudflare ou credential file manquant
2. Ingress Cloudflare pointant vers un ancien port ou un service arrêté
3. DNS Cloudflare encore associé à un ancien tunnel
4. Build ou rendu frontend incorrect, masqué par un proxy valide

Aujourd’hui, le symptôme n’est plus présent sur les tests exécutés.

## Ce qui doit être conservé

- Le dépôt EGS
- Le tunnel `gnamba-web`
- La base PostgreSQL locale
- Les services Supabase nécessaires au socle local
- Les sauvegardes de référence

## Ce qui doit rester hors cible

- Les artefacts `SOMAGRO` archivés
- Les services Supabase morts déjà désactivés
- Toute suppression générique non filtrée

## Current reassessment — 2026-10-07 17:00 UTC

**STATUS: PARTIAL PASS — live baseline captured; 24-hour memory and disk
history unavailable.** A single local snapshot and HTTP GET checks were used.
Public requests were also sampled once, so response timings are indicative,
not a service-level objective. No database row values, documents, logs,
environment values, or tunnel credentials were read.

### Host resources

| Metric | Observation |
| --- | --- |
| Host / OS | `gnamba-server`, Ubuntu 24.04.4 LTS, x86-64 |
| Uptime | 7 h 28 min at capture |
| CPU | Approx. 7.0% busy, weighted from sysstat 2026-10-06 17:00–23:50 and 2026-10-07 00:00–17:00; not a rolling interval because of the 10-minute sampling gap |
| RAM | 7.7 GiB total; 3.1 GiB used; 4.5 GiB available |
| Swap | 4.0 GiB total; 9.6 MiB used |
| Root filesystem | 98 GiB total; 87 GiB used; 6.3 GiB available; 94% |
| Data filesystem `/mnt/data` | 916 GiB total; 2.8 GiB used; 867 GiB available; 1% |
| Load average | 1.25 / 0.89 / 0.95 |

The root filesystem is near capacity. Do not run image/volume pruning as a
quick fix: 16 volumes and 24 local images exist, some volumes are unattached,
and their ownership has not yet been reconciled. Docker reports 7.48 GiB of
build cache.

### Runtime and database

| Metric | Observation |
| --- | --- |
| Docker containers | 7 total: 5 running, 2 exited |
| Running application services | `egs-web`, `egs-api`, `egs-postgres`, `egs-redis`, `filebrowser` |
| Critical historical names absent | No `supabase_db` or `somagro-erp` container; do not assume these names map to current services without operator confirmation |
| Docker images / volumes / networks | 24 / 16 / 5 |
| PostgreSQL cluster | 5 connectable databases; `egs_local` is 12.9 MB; all five total about 55.8 MB |
| `egs_local` schema | 69 public base tables, 0 views, 0 triggers, 18 public stored functions; four relations have RLS enabled and zero public policies are defined |
| Selected row counts (metadata only) | `users` 4; `properties` 27; `parties` 1; `media_files` 34; `documents` 0; `foncier_attestations` 0; `foncier_lots` 0; `leads` 0 |
| Files | 122 files under `backend/storage` (about 2.9 MiB); 618 under `/var/www/egs` (deployed web assets); 0 under `/home/soma/partage` |
| Backup inventory | Six files, about 223 MB, under `/home/soma/backups`; no restore test was performed and their data was not read |

The non-zero account, property, party and media counts mean that the absence
of sensitive data cannot be inferred from the user's earlier statement.
Their contents were deliberately not inspected; treat them as potentially
sensitive until an authorized data classification confirms otherwise.

### Response baseline

| Endpoint | Result | Observed timing |
| --- | --- | --- |
| `http://127.0.0.1:8080/` | 200 | 1.3 ms total |
| `http://127.0.0.1:8000/health` | 200 | 15.8 ms total |
| `http://127.0.0.1:8000/api/v1/health` | 200 | 6.1 ms total |
| `http://127.0.0.1:8000/ready` | 404 | 5.7 ms total |
| `https://gnambaservices.ci/` | 200 | 3.85 s total |
| `https://www.gnambaservices.ci/` | 200 | 4.49 s total |
| `https://api.gnambaservices.ci/health` | 200 | 0.53 s TTFB |
| `https://api.gnambaservices.ci/api/v1/health` | 200 | 0.67 s TTFB |
| `https://api.gnambaservices.ci/ready` | 404 | 0.75 s TTFB |

These are single GET samples, not repeated percentile measurements. The
public site path is behind Cloudflare; DNS and TLS performance are therefore
included in those timings.

### Services and exposure

- `cloudflared`, host Nginx, Docker, SSH and fail2ban systemd services report
  active. Cloudflare ingress points the public site names to host port 80 and
  the API name to host port 8000.
- `egs-web`, `egs-api`, `egs-postgres` and `filebrowser` are mapped to
  `0.0.0.0` on host ports 8080, 8000, 5433 and 8081 respectively. This means
  all host interfaces, not proof of Internet reachability. UFW and fail2ban
  details could not be queried without administrator privileges.
- `nginx -t` could read and parse configuration but did not complete because
  the current user cannot access `/run/nginx.pid`. It emitted conflicting
  `server_name` warnings for port 8000; root-context validation is pending.
- Public website and API health endpoints were reachable through HTTPS.

### Reproducibility and limits

Commands used included `uptime`, `free`, `df`, `sar`, `docker ps`,
`docker system df`, `docker stats --no-stream`, `docker inspect`, metadata-only
PostgreSQL queries, local/public HTTP GETs, and service state checks. Historical
CPU coverage is near 24 hours but has a 10-minute gap. No service was stopped,
no cleanup was run, and no migrations, tests, or restoration were performed.
This baseline must be re-captured after an approved migration.
