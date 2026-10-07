---
document: BUSINESS_CONTINUITY_PLAN.md
phase: "14"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - PROGRESS_STATE.json
  - docs/audit/BASELINE_STATE.md
  - docs/architecture/ARCHITECTURE_TARGET.md
  - docs/migration/MIGRATION_PLAN.md
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# Business Continuity Plan

## Objectif

Maintenir EGS exploitable même si un service critique casse, sans improvisation et sans perdre la donnée.

## Actifs critiques

- `egs-web`
- `cloudflared`
- `supabase_db_gnamba-project`
- `supabase_auth_gnamba-project`
- `supabase_rest_gnamba-project`
- `supabase_storage_gnamba-project`

## Sauvegardes minimales

- `PROGRESS_STATE.json`
- dump PostgreSQL
- inventaire Docker
- configuration Cloudflare
- configuration Supabase

## RTO / comportement

- EGS et la base doivent rester récupérables rapidement
- Si un rollback échoue à répétition, arrêter et basculer `stop_condition_active`
- Ne jamais tenter un nettoyage large pendant une panne

## Procédure de reprise

1. Restaurer les fichiers de sauvegarde
2. Vérifier le tunnel Cloudflare
3. Vérifier l’origine locale EGS
4. Vérifier Supabase local
5. Valider avec `curl`

## Communication

- Prévenir immédiatement l’opérateur unique si la donnée est en jeu
- Documenter chaque action de reprise dans les livrables d’audit

## Principe

La continuité n’est pas d’avoir "plus de redondance", mais de pouvoir revenir vite à un état connu, lisible et sain.
