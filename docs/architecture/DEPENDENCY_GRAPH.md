---
document: DEPENDENCY_GRAPH.md
phase: "2"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - docker ps -a
  - supabase status
  - ~/.cloudflared/config.yml
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

# Dependency Graph

## Graphe cible

```text
Internet
  -> Cloudflare DNS
    -> Cloudflare Tunnel
      -> cloudflared.service
        -> egs-web (port 80)
          -> Supabase local API (Kong on 54321)
            -> Auth
            -> REST
            -> Storage
            -> Realtime
            -> PostgreSQL (54322)

LAN / local
  -> http://REDACTED_LEGACY_HOST
  -> http://localhost
  -> same origin as egs-web / Supabase local

Optional internal tools
  -> filebrowser (files.gnambaservices.ci -> 8081)
  -> egs-kong (internal gateway, under review)
  -> inbucket (mail test only)
```

## Lecture des dépendances

- Le tunnel est la seule porte Internet voulue
- `egs-web` est le point d’entrée applicatif
- Supabase local dépend du noyau PostgreSQL
- Les services graphiques Supabase inutiles restent désactivés
- Les outils annexes ne doivent jamais devenir des dépendances de production

## Risque structurel

La plus grande source de casse aujourd’hui n’est pas la donnée, mais la confusion entre chemins d’entrée. Le graphe doit rester lisible à une seule personne, sans doubles routes durables.
