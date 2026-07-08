# Lot 3 - Matrice routes API

Date: 2026-07-06
Statut: audit lecture seule

## Legende

| Statut | Signification |
|---|---|
| OK cible | Route `/api/v1` exposee et consommee |
| Legacy | Route exposee non versionnee |
| Mismatch | Frontend et backend ne parlent pas le meme chemin |
| Fantome | Frontend/adapter appelle une route non exposee |
| Prototype | Route exposee mais implementation memoire ou incomplete |

## Matrice principale

| Domaine | Frontend appelle | Backend expose | Statut | Action future |
|---|---|---|---|---|
| Auth login | `/api/v1/auth/login` | `/api/v1/auth/login`, `/api/auth/login` | OK cible + legacy | Garder v1, deprecier legacy |
| Auth me | `/api/v1/auth/me` | `/api/v1/auth/me`, `/api/auth/me` | OK cible + legacy | Garder v1 |
| Auth refresh | `/api/v1/auth/refresh` | `/api/v1/auth/refresh`, `/api/auth/refresh` | OK cible + legacy | Garder v1 |
| Auth logout | `/api/v1/auth/logout` | `/api/v1/auth/logout`, `/api/auth/logout` | OK cible + legacy | Garder v1 |
| Reset password | `/api/v1/auth/reset-password` | `/api/v1/auth/password/reset`, `/api/auth/reset-password` | Mismatch | Choisir un seul chemin v1 |
| Users | `/api/v1/users` | `/api/v1/users`, `/api/users` | OK cible + legacy | Garder v1 |
| Settings | `/api/v1/settings` | `/api/settings` | Mismatch | Versionner backend |
| Site content | `/api/v1/site-content` | `/api/site-content` | Mismatch | Versionner backend |
| Media CRUD | `/api/v1/media*` | `/api/media*` | Mismatch | Versionner backend |
| Media usage | `/api/v1/media/usage*` | `/api/media/usage*` | Mismatch | Versionner backend |
| Media brand assets | `/api/v1/media/brand-assets` | `/api/media/brand-assets` | Mismatch | Versionner backend |
| Storage delete | `/api/v1/storage/media/{path}` | aucun | Fantome | Creer endpoint ou retirer mapping |
| RPC bridge | `/api/v1/rpc/{name}` | aucun | Fantome | Remplacer par routes metier explicites |
| Functions bridge | `/api/v1/functions/{name}` | aucun | Fantome | Remplacer par routes metier explicites |
| Projects | pages utilisent surtout `supabase.from("projects")` | `/api/v1/projects` | Prototype non consomme | Migrer frontend + persistance |
| Employees | pages utilisent `supabase.from("employees")` | `/api/v1/employees` | Prototype non consomme | Migrer frontend + persistance |
| Suppliers | pages utilisent `supabase.from("suppliers")` | `/api/v1/suppliers` | Prototype non consomme | Migrer frontend + persistance |
| Products | pages utilisent `supabase.from("products")` | `/api/v1/products` | Prototype non consomme | Migrer frontend + persistance |
| Finance | pages utilisent `supabase.from("finances")` | `/api/v1/finance` | Prototype non consomme | Migrer frontend + persistance |
| Immobilier | page utilise `supabase.from(tableName)` | `/api/v1/immobilier` | Prototype non consomme | Remplacer par sous-routes metier |
| Foncier | page utilise RPC/from/functions | `/api/v1/foncier` simple | Prototype insuffisant | Routes dediees lots/attestations/villages |
| Attestation verify | `attestationVerification` appelle Edge Function selon config | `/api/attestations/verify` | Mismatch legacy | Exposer `/api/v1/attestations/verify` |

## Routes backend a conserver comme cible apres normalisation

Routes cibles a terme:

- `/api/v1/auth/login`
- `/api/v1/auth/me`
- `/api/v1/auth/refresh`
- `/api/v1/auth/logout`
- `/api/v1/auth/password/reset` ou `/api/v1/auth/reset-password` mais pas les deux
- `/api/v1/users`
- `/api/v1/users/{id}`
- `/api/v1/settings`
- `/api/v1/site-content`
- `/api/v1/media`
- `/api/v1/media/usage`
- `/api/v1/media/{id}`
- `/api/v1/projects`
- `/api/v1/employees`
- `/api/v1/suppliers`
- `/api/v1/products`
- `/api/v1/finance`
- `/api/v1/immobilier/*`
- `/api/v1/foncier/*`
- `/api/v1/documents/*`
- `/api/v1/leads/*`
- `/api/v1/attestations/verify`

## Routes legacy exposees actuellement

Ces routes existent et ne doivent pas etre supprimees sans remplacement/tests:

- `/api/auth/*`
- `/api/users*`
- `/api/settings`
- `/api/site-content`
- `/api/media*`
- `/api/attestations/verify`

## Routes fantomes appelees

Ces routes sont appelees par le frontend ou un adapter mais non exposees par FastAPI:

- `/api/v1/rpc/{name}`
- `/api/v1/functions/{name}`
- `/api/v1/storage/media/{path}`
- `/api/v1/settings`
- `/api/v1/site-content`
- `/api/v1/media*`
- `/api/v1/auth/reset-password`

Nuance:

- `/api/v1/settings`, `/api/v1/site-content`, `/api/v1/media*` ont un equivalent backend non versionne.
- `/api/v1/rpc`, `/api/v1/functions`, `/api/v1/storage` n'ont pas d'equivalent observe.

## Consommateurs frontend par client

### `apiService`

Fichier:

- `src/services/api/client.ts`

Consommateurs:

- `src/context/AuthContext.tsx`

Routes:

- `/api/v1/auth/login`
- `/api/v1/auth/refresh`
- `/api/v1/auth/me`
- `/api/v1/auth/logout`
- `/api/v1/users`

Diagnostic:

- Chemin cible correct, mais doublon avec `src/api/client.ts`.

### `apiClient`

Fichier:

- `src/api/client.ts`

Consommateurs principaux:

- `src/pages/Utilisateurs.tsx`
- `src/context/SettingsContext.tsx`
- `src/context/SiteContentContext.tsx`
- `src/pages/Media.tsx`
- `src/components/media/**`
- `src/lib/mediaUtils.ts`
- `src/pages/Documents.tsx`
- `src/pages/RegistreVisiteur.tsx`
- `src/pages/public/LoginPage.tsx`
- `src/pages/public/ResetPasswordPage.tsx`

Diagnostic:

- C'est le meilleur candidat pour client unique.
- Il appelle deja `/api/v1`, mais plusieurs routes backend correspondantes n'existent pas encore sous `/api/v1`.

### `legacySupabaseAdapter`

Fichier:

- `src/lib/legacySupabaseAdapter.ts`

Consommateurs:

- nombreuses pages metier et publiques.

Ce qu'il mappe en self-hosted:

- `rpc(name)` -> `/api/v1/rpc/{name}`
- `functions.invoke(name)` -> `/api/v1/functions/{name}`
- `storage.from(bucket).upload()` -> `apiClient.media.upload()`
- `storage.from(bucket).remove()` -> `/api/v1/storage/media/{path}`
- `auth.*` -> `apiClient.auth.*`

Ce qu'il ne mappe pas:

- `from()`
- `channel()`
- `removeChannel()`
- chaines Supabase `.select().eq().order().insert().upsert()` en mode self-hosted.

Diagnostic:

- Ce n'est pas un adapter complet.
- Il masque partiellement la migration, mais ne garantit pas le runtime.

## Priorite de consolidation

| Priorite | Travail | Pourquoi |
|---|---|---|
| P0 | Aligner `/api/v1/settings`, `/api/v1/site-content`, `/api/v1/media*` | Ces routes sont deja appelees par le frontend cible |
| P0 | Corriger reset password v1 | Parcours auth utilisateur |
| P0 | Retirer les routes fantomes `rpc/functions/storage` ou les remplacer | Elles donnent une fausse impression de compatibilite |
| P0 | Remplacer `supabase.from` dans les pages critiques | Crash probable en self-hosted |
| P1 | Porter modules v1 de stores memoire vers SQLAlchemy | ERP local doit persister |
| P1 | Normaliser un seul client frontend | Eviter double source API |
| P1 | Adapter proxy Nginx/Compose vers FastAPI | Runtime fiable |
| P2 | Deprecier routes legacy `/api/*` | Apres tests et migration consommateurs |

## Tests de validation future

Tests a ajouter ou ajuster apres implementation:

```bash
# Backend
cd backend && pytest

# Verifier presence routes OpenAPI
curl -s http://localhost:8000/openapi.json

# Frontend static audit
rg "apiService|apiClient|legacySupabaseAdapter|supabase\\.from|/api/v1/rpc|/api/v1/functions|/api/v1/storage" src

# E2E smoke cible
curl http://localhost:8000/api/v1/auth/me
curl http://localhost:8000/api/v1/settings
curl http://localhost:8000/api/v1/media/brand-assets
```

Ne pas executer ces commandes destructivement dans Lot 3; elles sont des criteres pour les lots d'implementation.
