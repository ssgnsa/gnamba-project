---
document: AUTH_CONSOLIDATION_REPORT.md
phase: "5"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - docker ps -a
  - supabase status
  - supabase/config.toml
  - curl https://api.gnambaservices.ci/auth/v1/health
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# Auth Consolidation Report

## État actuel

- Un seul système d’authentification est visible dans le runtime actif: Supabase Auth local
- Aucun conteneur Keycloak n’apparaît dans l’inventaire Docker courant
- L’endpoint de santé Auth répond en `200`
- Les URLs de redirection sont déclarées dans `supabase/config.toml`

## Ce que cela signifie

La consolidation d’authentification est déjà effective au niveau runtime. Il reste surtout à maintenir:

- la cohérence des redirect URLs
- la cohérence des JWT / RLS
- la cohérence entre le domaine public et l’origin local

## Point d’attention

Si un ancien mécanisme d’auth réapparaît dans le dépôt ou dans une unité systemd, il devra être traité comme de la dette à retirer, pas comme une nouvelle cible.

## Conclusion

Le principe "un seul système d’auth" est respecté dans l’état observé. La suite consiste à le préserver et à vérifier les policies d’accès plutôt qu’à le rediscuter.
