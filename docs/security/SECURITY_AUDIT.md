---
document: SECURITY_AUDIT.md
phase: "0bis"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - docker ps -a
  - ss -tulpn
  - supabase status
  - ~/.cloudflared/config.yml
  - curl https://gnambaservices.ci
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# Security Audit

## Portée

Audit opérationnel du runtime local EGS + Supabase local + Cloudflare Tunnel. L’objectif est de réduire la surface d’attaque sans casser l’accès local ni l’accès Internet via tunnel.

## Points vérifiés

- `cloudflared.service` est actif et ne dépend que d’un seul tunnel: `gnamba-web`
- `gnambaservices.ci` répond en `200`
- `https://api.gnambaservices.ci/auth/v1/health` répond en `200`
- `https://api.gnambaservices.ci/rest/v1/` répond en `200`
- `http://localhost:3000` et `http://localhost:8080` ne répondent pas
- `supabase/config.toml` a bien `studio.enabled = false`
- `supabase/config.toml` a bien `db.pooler.enabled = false`
- `supabase/config.toml` a bien `analytics.enabled = false`

## Ce qui est sain

- Exposition Internet unique via Cloudflare Tunnel
- Un seul tunnel actif et documenté
- Supabase local présent sur le serveur, sans dépendance cloud pour la couche API locale
- Les services Supabase à forte surface graphique sont déjà désactivés

## Points à surveiller

1. Les ports origin écoutent sur `0.0.0.0` pour `80`, `54321`, `54322`, `54324`, `8081`, `8000`, `8443`
2. Le wrapper systemd `egs-web.service` est très minimal et peut masquer les erreurs de démarrage si on ne lit pas les logs
3. Le tunnel Cloudflare affiche des warnings de reconnexion, sans impact immédiat observé
4. L’API REST répond publiquement via tunnel, donc les politiques RLS doivent rester strictes

## Supabase checklist

- Ne jamais utiliser `user_metadata` pour décider d’une autorisation
- Garder `service_role` hors de tout client public
- Vérifier les vues et fonctions exposées
- Vérifier les politiques RLS sur les tables publiques
- Vérifier que les uploads Storage ont bien les permissions nécessaires

## Conclusion

Aucune faille critique n’a été confirmée dans cette phase d’audit, mais la surface d’exposition reste trop large tant que les bindings réseau ne sont pas durcis et que les composants morts n’ont pas été purgés. Le socle est exploitable, mais il doit encore être rationalisé.
