---
document: USAGE_ANALYSIS_REPORT.md
phase: "3"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: draft
inputs_used:
  - docker ps -a
  - ss -tulpn
  - docs/services/SERVICE_CRITICALITY_MATRIX.md
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# Usage Analysis Report

## Usage confirmé

- `egs-web` sert l’application publique et l’ERP
- `cloudflared` expose le domaine public
- Supabase local fournit l’API, l’authentification, le stockage et PostgreSQL
- `filebrowser` sert les sous-domaines fichiers

## Usage à confirmer

- `egs-kong`: actif, mais son rôle exact doit être confirmé avant conservation durable
- `supabase_realtime_gnamba-project`: utile seulement si les fonctionnalités temps réel sont réellement utilisées
- `supabase_vector_gnamba-project`: utile seulement si les fonctionnalités d’indexation ou d’embeddings sont actives
- `supabase_inbucket_gnamba-project`: utile pour tests mail, pas pour production métier
- `edge_runtime`: configuré côté Supabase, mais les conteneurs associés ne sont pas actifs

## Conclusion

Le socle métier actif est clair. Les services à confirmer ne doivent pas être retirés sans vérification, mais ils ne doivent pas non plus devenir des dépendances implicites.
