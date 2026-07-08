---
document: BASELINE_STATE.md
phase: "0ter"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
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
