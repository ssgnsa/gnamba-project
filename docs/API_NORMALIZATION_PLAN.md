# Plan de Normalisation Architecture API

## État avant normalisation

### Problèmes identifiés

1. **Routers dupliqués** : 4 modules exposent des préfixes `/api/` (legacy) ET `/api/v1/` :
   - `auth` : `/api/auth` + `/api/v1/auth`
   - `users` : `/api/users` + `/api/v1/users`
   - `media` : `/api/media` + `/api/v1/media`
   - `settings` : `/api/settings` + `/api/v1/settings` (+ site-content)

2. **Modules plats** : 6 fichiers `.py` racines au lieu de dossiers `module/router.py` :
   - `leads.py`, `rpc.py`, `tables.py`, `clients.py`, `tasks.py`, `tenants.py`

3. **Routes mortes** : Les vieux routers (`/api/auth`, `/api/users`, `/api/media`, `/api/settings`, `/api/site-content`) ne sont PAS inclus dans `v1_router` mais restent dans le code.

4. **Module foncier** : Utilise `routes.py` au lieu de `router.py` (incohérence de nommage).

5. **Modules manquants dans v1_router** (corrigé en Phase 0) :
   - `rpc`, `dashboard`, `clients`, `tasks`, `tenants` n'étaient pas inclus.

### Architecture cible

```
backend/app/api/v1/
├── __init__.py              (assembleur central)
├── auth/        → __init__.py + router.py   prefix="/api/v1/auth"
├── users/       → __init__.py + router.py   prefix="/api/v1/users"
├── media/       → __init__.py + router.py   prefix="/api/v1/media"
├── settings/    → __init__.py + router.py   prefix="/api/v1/settings"
├── site_content/→ __init__.py + router.py   prefix="/api/v1/site-content"
├── dashboard/   → __init__.py + router.py   prefix="/api/v1/dashboard"
├── foncier/     → __init__.py + router.py   prefix="/api/v1/foncier"
├── employees/   → __init__.py               prefix="/api/v1/employees"
├── finance/     → __init__.py               prefix="/api/v1/finance"
├── immobilier/  → __init__.py               prefix="/api/v1/immobilier"
├── products/    → __init__.py               prefix="/api/v1/products"
├── projects/    → __init__.py               prefix="/api/v1/projects"
├── suppliers/   → __init__.py               prefix="/api/v1/suppliers"
├── leads/       → __init__.py + router.py   prefix="/api/v1/leads"
├── rpc/         → __init__.py + router.py   prefix="/api/v1/rpc"
├── tables/      → __init__.py + router.py   prefix="/api/v1/tables"
├── clients/     → __init__.py + router.py   prefix="/api/v1/clients"
├── tasks/       → __init__.py + router.py   prefix="/api/v1/tasks"
└── tenants/     → __init__.py + router.py   prefix="/api/v1/tenants"
```

## Phases d'exécution

1. **Auth** — déjà conforme, vérification uniquement
2. **Users** — nettoyage `__init__.py` (73→3 lignes)
3. **Media** — split `__init__.py` (305 lignes) en `__init__.py` + `router.py`
4. **Settings + Site Content** — split en 2 modules indépendants
5. **Dashboard** — déjà conforme, vérification uniquement
6. **Modules racines** — 6 fichiers → 6 dossiers
7. **Foncier** — renommage `routes.py` → `router.py`

## Risques

- Phase 3 (Media) : Migration des `add_api_route()` vers décorateurs `@router`
- Phase 4 (Settings) : Le helper `_fetch_settings_rows()` est utilisé par settings ET site_content
- Phase 6 : Les imports absolus dans les fichiers `.py` doivent rester valides après déplacement

## Stratégie rollback

```bash
git log --oneline -5
git reset --hard HEAD~1   # Revenir avant la dernière phase
```