---
document: ARCHITECTURE_TARGET.md
phase: "5"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - docs/architecture/DEPENDENCY_GRAPH.md
  - supabase/config.toml
  - ~/.cloudflared/config.yml
  - docker ps -a
  - ss -tulpn
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# Architecture Target

## Cible finale

```text
Internet
  ↓
Cloudflare DNS
  ↓
Cloudflare Tunnel
  ↓
cloudflared
  ↓
EGS Studio
  ↓
Supabase local
  ↓
PostgreSQL
```

## Contraintes non négociables

- Aucun port public ouvert sur Internet
- Internet uniquement via Cloudflare Tunnel
- Accès LAN autorisé via `REDACTED_LEGACY_HOST`
- Accès local autorisé via `localhost`
- Une seule application de production visible: EGS Studio
- Aucune dépendance cloud Supabase pour l’exécution normale

## Réglages Supabase à conserver

- PostgreSQL
- Auth
- REST
- Storage

## Réglages à désactiver quand ils ne servent pas

- Studio
- ImgProxy
- Pooler
- Analytics

## Réglages conditionnels

- `edge_runtime` seulement si des fonctions locales sont réellement utilisées
- `realtime` seulement si le besoin fonctionnel reste confirmé
- `filebrowser` seulement si l’exposition fichiers reste utile au métier

## Lecture opérationnelle

L’architecture cible n’est pas "plus de services", mais "moins de chemins possibles". Le bon état est celui où l’opérateur n’a qu’une seule chaîne de responsabilité à relire en cas d’incident.
