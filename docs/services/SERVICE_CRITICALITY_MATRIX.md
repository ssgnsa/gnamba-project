---
document: SERVICE_CRITICALITY_MATRIX.md
phase: "0"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - docker ps -a
  - systemctl status egs-web
  - systemctl --user status cloudflared
  - supabase status
  - ~/.cloudflared/config.yml
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# Service Criticality Matrix

## Lecture rapide

- `Critique`: un arrêt casse la prod, l’accès internet ou la donnée
- `Important`: un arrêt dégrade fortement l’exploitation, mais reste récupérable
- `Secondaire`: utile pour l’ergonomie ou les outils internes
- `À retirer`: composant mort, redondant ou hors cible

## Matrice actuelle

| Service | Rôle | Criticité | État | Action |
| --- | --- | --- | --- | --- |
| `egs-web` | Application EGS Studio servie sur `:80` | Critique | Running | Conserver |
| `cloudflared.service` | Tunnel Internet unique | Critique | Running | Conserver |
| `supabase_db_gnamba-project` | PostgreSQL local | Critique | Running | Conserver |
| `supabase_kong_gnamba-project` | Gateway Supabase local | Critique | Running | Conserver |
| `supabase_auth_gnamba-project` | Auth Supabase locale | Critique | Running | Conserver |
| `supabase_rest_gnamba-project` | API REST Supabase | Critique | Running | Conserver |
| `supabase_storage_gnamba-project` | Fichiers Supabase | Critique | Running | Conserver |
| `supabase_realtime_gnamba-project` | Temps réel Supabase | Important | Running | Conserver |
| `egs-kong` | Gateway historique EGS | Important | Running | Garder sous revue |
| `filebrowser` | Accès fichiers via `files.*` | Important | Running | Conserver si utile |
| `supabase_vector_gnamba-project` | Support embeddings / vecteur | Secondaire | Running | Conserver si utilisé |
| `supabase_inbucket_gnamba-project` | Boîte mail locale | Secondaire | Running | Conserver pour tests |
| `supabase_studio_gnamba-project` | Studio local Supabase | À retirer | Stopped | Désactivé |
| `supabase_pg_meta_gnamba-project` | Métadonnées Supabase | À retirer | Stopped | Désactivé |
| `supabase_pooler_gnamba-project` | Pooler local | À retirer | Stopped | Désactivé |
| `supabase_imgproxy_gnamba-project` | Proxy image local | À retirer | Stopped | Désactivé |
| `supabase_analytics_gnamba-project` | Analytics local | À retirer | Stopped | Désactivé |
| `supabase_edge_runtime_gnamba-project` | Edge runtime local | À revoir | Stopped | Garder seulement si fonctions utilisées |

## Contraintes de conservation

- Ne jamais supprimer `egs-web`, `cloudflared`, `supabase_db_gnamba-project`, `supabase_auth_gnamba-project`, `supabase_rest_gnamba-project`, `supabase_storage_gnamba-project`
- Ne pas toucher à Docker, PostgreSQL, Cloudflare ou aux volumes utiles sans backup
- Tout retrait doit être limité aux composants morts ou explicitement hors cible

## Lecture opérationnelle

Le socle actuel est déjà plus simple que l’ancien pseudo-stack, mais il reste encore plusieurs services historiques à surveiller. La cible de stabilité est atteinte quand seuls les services réellement nécessaires à EGS Studio et au Supabase local restent actifs.
