# Roadmap de migration industrielle EGS

Date: 2026-07-06
Statut: reference execution post Lots 1-6A

## Principe

EGS ne doit plus evoluer par grands nettoyages massifs. La migration doit etre conduite par Epics, chacun decoupe en Pull Requests atomiques.

Chaque PR doit contenir:

- perimetre limite;
- plan de rollback;
- criteres d'acceptation;
- tests obligatoires;
- impact runtime explicite.

## Epic A - Architecture cible

Objectif: maintenir une reference stable.

Livrables:

- ADR FastAPI/PostgreSQL;
- Lot 5 architecture cible;
- diagramme runtime;
- matrice survivants/non-survivants.

Validation:

- aucune decision d'architecture contradictoire dans la doc active;
- un Compose cible identifie;
- une API cible `/api/v1`.

## Epic B - API unique

Objectif: une seule surface API `/api/v1`.

PR candidates:

1. Alias `/api/v1/settings`, `/api/v1/site-content`, `/api/v1/media`.
2. Alias `/api/v1/auth/reset-password`.
3. Contrats OpenAPI documentes.
4. Tests route par route.
5. Deprecation documentee des routes `/api/*` legacy.

Validation:

```bash
npm run typecheck
.venv/bin/python -m pytest backend/tests -q
python -m compileall backend/app
```

## Epic C - Persistance PostgreSQL

Objectif: supprimer les stores memoire metier.

PR candidates:

1. Repositories Projects.
2. Repositories Employees.
3. Repositories Suppliers.
4. Repositories Products.
5. Repositories Finance.
6. Repositories Immobilier.
7. Repositories Foncier.

Validation:

- migrations Alembic;
- tests repositories;
- seed idempotent;
- aucun store memoire en production.

## Epic D - Frontend React

Objectif: frontend sans acces direct Supabase.

PR candidates:

1. Unifier `apiClient` et `apiService`.
2. AuthContext sur API locale.
3. Settings/SiteContent sur `/api/v1`.
4. MediaUploader/MediaPicker sur `/api/v1/media`.
5. CRUD ERP via services frontend.
6. Foncier via `foncierService`.
7. Immobilier via `immobilierService`.
8. Leads via `leadsService`.

Validation:

- `npm run typecheck`;
- `npm run build`;
- tests module;
- aucun nouveau `supabase.from`.

## Epic E - Infrastructure

Objectif: stack locale deployable.

PR candidates:

1. Compose cible self-hosted avec frontend + Nginx + backend.
2. Variables `.env.server` cible.
3. Nginx reverse proxy `/api/v1`.
4. MinIO configure via FastAPI.
5. Redis configure pour sessions/jobs.
6. CI/CD vers Compose cible.

Validation:

```bash
docker compose -f docker-compose.selfhosted.yml config
npm run build
.venv/bin/python -m pytest backend/tests -q
```

## Epic F - Nettoyage controle

Objectif: supprimer seulement apres validation complete.

PR candidates:

1. Retirer routes legacy `/api/*`.
2. Retirer `legacySupabaseAdapter`.
3. Retirer Supabase frontend.
4. Archiver migrations Supabase.
5. Retirer Edge Functions.
6. Retirer Compose historiques.
7. Retirer scripts obsoletes.
8. Retirer dependances npm inutiles.

Validation:

- E2E OK;
- sauvegarde OK;
- rollback OK;
- recherche `rg "supabase|legacySupabaseAdapter"` analysee.

## Epic G - Mise en production

Objectif: deploiement local stable et maintenable.

PR candidates:

1. Runbook production.
2. Backup/restore PostgreSQL.
3. Monitoring.
4. Rotation secrets.
5. Smoke tests post-deploy.
6. Procedure rollback.

Validation:

- deploiement reproductible;
- restauration testee;
- logs exploitables;
- documentation unique.

