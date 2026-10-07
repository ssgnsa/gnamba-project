# GNAMBA ERP - API Contract Audit
Date : 2026-07-30 12:45:31.275693
## Résumé

- Frontend endpoints détectés : **0**
- Backend routes détectées : **72**
- Correspondances : **0**
- Frontend sans backend : **0**
- Fichiers utilisant Supabase : **0**

## Frontend ↔ Backend

| Frontend | Backend | Etat |
|---|---|---|

## Routes Backend inutilisées

| Route | Fichier |
|---|---|
| `/api/auth/login` | `backend/app/api/v1/auth/__init__.py` |
| `/api/auth/logout` | `backend/app/api/v1/auth/__init__.py` |
| `/api/auth/me` | `backend/app/api/v1/auth/__init__.py` |
| `/api/auth/refresh` | `backend/app/api/v1/auth/__init__.py` |
| `/api/auth/reset-password` | `backend/app/api/v1/auth/__init__.py` |
| `/api/media/brand-assets` | `backend/app/api/v1/media/__init__.py` |
| `/api/media/usage` | `backend/app/api/v1/media/__init__.py` |
| `/api/media/usage` | `backend/app/api/v1/media/__init__.py` |
| `/api/media/usage/{usage_id}` | `backend/app/api/v1/media/__init__.py` |
| `/api/media/{media_id}` | `backend/app/api/v1/media/__init__.py` |
| `/api/media/{media_id}` | `backend/app/api/v1/media/__init__.py` |
| `/api/media/{media_id}` | `backend/app/api/v1/media/__init__.py` |
| `/api/media/{media_id}/purge` | `backend/app/api/v1/media/__init__.py` |
| `/api/media/{media_id}/replace` | `backend/app/api/v1/media/__init__.py` |
| `/api/media/{media_id}/restore` | `backend/app/api/v1/media/__init__.py` |
| `/api/users/{user_id}` | `backend/app/api/v1/users/__init__.py` |
| `/api/users/{user_id}` | `backend/app/api/v1/users/__init__.py` |
| `/api/v1/auth/login` | `backend/app/api/v1/auth/router.py` |
| `/api/v1/auth/logout` | `backend/app/api/v1/auth/router.py` |
| `/api/v1/auth/me` | `backend/app/api/v1/auth/router.py` |
| `/api/v1/auth/password/reset` | `backend/app/api/v1/auth/router.py` |
| `/api/v1/auth/refresh` | `backend/app/api/v1/auth/router.py` |
| `/api/v1/auth/reset-password` | `backend/app/api/v1/auth/router.py` |
| `/api/v1/employees/{employee_id}` | `backend/app/api/v1/employees/__init__.py` |
| `/api/v1/employees/{employee_id}` | `backend/app/api/v1/employees/__init__.py` |
| `/api/v1/finance/{finance_id}` | `backend/app/api/v1/finance/__init__.py` |
| `/api/v1/finance/{finance_id}` | `backend/app/api/v1/finance/__init__.py` |
| `/api/v1/foncier/access/me/villages` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/access/{user_id}/villages/{village_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/access/{user_id}/villages/{village_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/attestations` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/attestations/verify/{reference}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/attestations/{attestation_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/attestations/{attestation_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/attestations/{attestation_id}/generate-pdf` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/attestations/{attestation_id}/pdf` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/attestations/{attestation_id}/revoke` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/attestations/{attestation_id}/scan` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/attestations/{attestation_id}/submit` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/attestations/{attestation_id}/validate` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/audit` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/audit/export-csv` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/audit/export-pdf` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/audit/timeline/{entity_type}/{entity_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/dashboard/stats` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/ilots/{ilot_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/ilots/{ilot_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/ilots/{ilot_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/ilots/{ilot_id}/lots` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/ilots/{ilot_id}/lots` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/ilots/{ilot_id}/lots/import` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lotissements/{lotissement_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lotissements/{lotissement_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lotissements/{lotissement_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lotissements/{lotissement_id}/ilots` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lotissements/{lotissement_id}/ilots` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lots` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lots/check-duplicate` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lots/export` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lots/{lot_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lots/{lot_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lots/{lot_id}/archive` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lots/{lot_id}/attestations` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lots/{lot_id}/attestations` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/lots/{lot_id}/restore` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/sync/cleanup` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/sync/queue` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/sync/queue/{queue_item_id}/resolve` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/sync/status` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/sync/trigger` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/villages` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/villages` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/villages/with-stats` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/villages/{village_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/villages/{village_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/villages/{village_id}` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/villages/{village_id}/lotissements` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/villages/{village_id}/lotissements` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/villages/{village_id}/users` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/foncier/villages/{village_id}/with-stats` | `backend/app/api/v1/foncier/routes.py` |
| `/api/v1/immobilier/{item_id}` | `backend/app/api/v1/immobilier/__init__.py` |
| `/api/v1/immobilier/{item_id}` | `backend/app/api/v1/immobilier/__init__.py` |
| `/api/v1/leads/capture` | `backend/app/api/v1/leads.py` |
| `/api/v1/products/{product_id}` | `backend/app/api/v1/products/__init__.py` |
| `/api/v1/products/{product_id}` | `backend/app/api/v1/products/__init__.py` |
| `/api/v1/projects/{project_id}` | `backend/app/api/v1/projects/__init__.py` |
| `/api/v1/projects/{project_id}` | `backend/app/api/v1/projects/__init__.py` |
| `/api/v1/rpc/{name}` | `backend/app/api/v1/rpc.py` |
| `/api/v1/suppliers/{supplier_id}` | `backend/app/api/v1/suppliers/__init__.py` |
| `/api/v1/suppliers/{supplier_id}` | `backend/app/api/v1/suppliers/__init__.py` |
| `/api/v1/tables/{table}` | `backend/app/api/v1/tables.py` |
| `/api/v1/tables/{table}` | `backend/app/api/v1/tables.py` |
| `/api/v1/tables/{table}/{row_id}` | `backend/app/api/v1/tables.py` |
| `/api/v1/tables/{table}/{row_id}` | `backend/app/api/v1/tables.py` |
| `/api/v1/users/{user_id}` | `backend/app/api/v1/users/router.py` |
| `/api/v1/users/{user_id}` | `backend/app/api/v1/users/router.py` |
| `/logs` | `backend/app/api/v1/dashboard/router.py` |
| `/report` | `backend/app/api/v1/dashboard/router.py` |
| `/stats` | `backend/app/api/v1/dashboard/router.py` |

## Supabase restant dans le frontend

✅ Aucun appel Supabase détecté
