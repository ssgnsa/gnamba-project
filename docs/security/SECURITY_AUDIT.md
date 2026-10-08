---
document: SECURITY_AUDIT.md
phase: "0bis"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: historical snapshot superseded by 2026-10-07 reassessment
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

> **Notice (2026-10-07):** the findings below describe a Supabase-based
> runtime observed on 2026-06-17. Current containers and database no longer
> match that topology. Use "Current reassessment" as the latest evidence.

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

## Current reassessment — 2026-10-07

**STATUS: HOLD — security posture not approved for additional sensitive
data.** This is a read-only review from an unprivileged shell. No values from
environment files, secret stores, logs, database rows or credentials were
printed or copied.

### Confirmed findings

| Priority | Finding | Evidence / limitation |
| --- | --- | --- |
| Critical | A valid TLS private key and matching certificate are tracked in Git HEAD. | Key parsing and public-key match were checked without displaying key material. Treat the key as compromised if it is used; replacement/revocation requires an approved operator window. |
| High | The application database connection uses PostgreSQL role `postgres`, confirmed as a superuser. | Read-only role metadata query. A least-privilege application role and separate migration role are required before production sign-off. |
| High | API, PostgreSQL, web and Filebrowser container ports bind to all host interfaces (`0.0.0.0`). | Live Docker inspection. Internet reachability is **not** established; UFW status could not be read without root privileges. |
| High | A tracked n8n SQLite database contains rows in deployment-key and user-API-key tables. | Schema and row counts only; no values inspected. n8n container is absent. Treat the file as credential-bearing and review revocation/rotation under a controlled plan. |
| High | Runtime schema and API image are out of sync: database revision `029_auth_password_lifecycle`, image Alembic head `028_normalize_vitrine_lots_types`; `alembic current` fails on the unknown revision. | Read-only CLI checks. Do not migrate production until a backed-up staging reconciliation passes. |
| High | Public verification endpoint accepted an invented reference and returned `document_authentic: true`. | One non-existent-reference GET probe against `/api/attestations/verify`. A separate v1 foncier route queries PostgreSQL, but the legacy route can falsely assert authenticity. |
| High | Four PostgreSQL tables have RLS enabled, but zero policies are configured; the app's superuser connection bypasses row-level safeguards. | Metadata counts only. App-level RBAC still requires a separate route-by-route authorization review. |
| Medium | Host Nginx config emitted conflicting `server_name` warnings on port 8000. | Syntax could be read, but `nginx -t` failed to complete because this user cannot access `/run/nginx.pid`; verify as an administrator before reload. |
| Medium | The system filesystem is 94% used, with 6.3 GiB available; Docker build cache is 7.48 GiB. | Capacity risk, not a reason to prune blindly. Inventory ownership and backup state first. |
| Medium | Tracked business-named CSV snapshots and one secret-shaped source assignment were detected by path/heuristic checks. | Values and row contents were not read. The source scan produced false positives for schema/test fields and is not a validated secret scan. A dedicated scanner is unavailable. |
| Review | Four PostgreSQL databases beyond the default admin database share the same cluster. | Names indicate local, test, staging and restore purposes; owners/retention and data separation need operator validation. |

### Controls observed

- Cloudflare Tunnel, Nginx, Docker, SSH and fail2ban systemd services report
  active. Public site and API health endpoints return successful responses.
- The API rejects a direct unauthenticated `/api/v1/auth/me` request with 401.
  A forged `X-Forwarded-Proto: https` probe also returned 401; this does not
  prove the whole authentication flow is secure.
- Cloudflare tunnel credential files have restrictive mode 0600 (one copy
  mode 0400). Their contents were not read.
- `backend/storage` is mode 775, owned by the app operator; `/home/soma/partage`
  is mode 755 and mounted read/write into Filebrowser.
- The file-storage API includes authorization checks and private no-store
  responses; full authorization bypass testing is outside this inventory.
- Public DNS/TLS endpoints responded successfully. The certificate at
  `nginx/ssl` is self-issued and valid until 2027-06-03; the public TLS check
  terminates through Cloudflare and is not proof that this origin certificate
  is trusted externally.

### Access limitations and immediate gates

- Root-only UFW and fail2ban status, SSH daemon effective configuration,
  host firewall rules, Cloudflare dashboard token-rotation status, and
  public-port reachability from an independent network remain **unknown**.
- Do not stop `egs-web`, `egs-api`, `egs-postgres`, Nginx or Cloudflare Tunnel
  during these checks.
- Before accepting sensitive records: replace the tracked TLS key; protect and
  review the tracked SQLite credential store; restrict service bindings; add
  least-privilege DB credentials; correct the false-positive public
  verification route; and reconcile the release/schema on staging.
- Do not rotate live credentials, rewrite Git history, remove tracked data, or
  deploy until backups, impact and rollback are reviewed and approved.
