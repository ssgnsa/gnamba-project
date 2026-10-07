# Lot 3 - Cartographie API et realite runtime frontend

Date: 2026-07-06
Statut: audit lecture seule
Portee: Lot 3 uniquement

## Regles appliquees

- Aucune modification de route.
- Aucun renommage.
- Aucune suppression.
- Aucun lancement de serveur.
- Audit statique de la realite runtime frontend/backend.

## Synthese executive

Le frontend EGS ne consomme pas encore une API unique.

Il existe aujourd'hui quatre chemins runtime concurrents:

1. `apiService` dans `src/services/api/client.ts`, utilise surtout par `AuthContext`.
2. `apiClient` dans `src/api/client.ts`, utilise par utilisateurs, settings, site content et media.
3. `legacySupabaseAdapter`, utilise par de nombreuses pages historiques.
4. Appels `fetch()` directs vers services externes ou endpoints Supabase/compatibles.

Constat critique:

- Le backend expose plusieurs routes non versionnees: `/api/auth`, `/api/users`, `/api/settings`, `/api/site-content`, `/api/media`, `/api/attestations/verify`.
- Le frontend appelle plusieurs routes versionnees `/api/v1/*` qui n'existent pas cote backend.
- `legacySupabaseAdapter` ne fournit pas `from()` en mode self-hosted, alors que 23 fichiers appellent encore `supabase.from(...)`.
- `legacySupabaseAdapter` mappe `rpc()` vers `/api/v1/rpc/:name`, `functions.invoke()` vers `/api/v1/functions/:name`, et `storage.remove()` vers `/api/v1/storage/media/:path`, mais ces routes ne sont pas exposees par FastAPI.
- Les routes backend `/api/v1/projects`, `/api/v1/employees`, `/api/v1/suppliers`, `/api/v1/products`, `/api/v1/finance`, `/api/v1/immobilier`, `/api/v1/foncier` sont actuellement des stores memoire simples, non alignes avec les pages frontend historiques qui utilisent toujours `supabase.from(...)`.

Conclusion Lot 3:

La realite runtime actuelle n'est pas "frontend -> API unique". Elle est:

```text
Frontend
  -> apiService -> /api/v1/auth, /api/v1/users
  -> apiClient -> /api/v1/users, /api/v1/settings, /api/v1/site-content, /api/v1/media
  -> legacySupabaseAdapter -> Supabase reel ou routes fantomes /api/v1/rpc, /api/v1/functions, /api/v1/storage
  -> supabase.from(...) historique -> crash probable en self-hosted adapter ou Supabase reel hors self-hosted
  -> fetch direct -> services externes / Supabase Edge / Filebrowser / Ollama
```

## Chiffres observes

| Element | Volume |
|---|---:|
| References directes frontend a `/api/*` | 36 |
| Fichiers frontend avec `supabase.from(...)` | 23 |
| Fichiers frontend avec `apiClient` / `apiService` | 17 |
| Fichiers backend contenant des routes | 15 |
| Fichiers tests backend couvrant routes legacy `/api/auth|users|media` | 2 |
| Fichiers tests backend couvrant `/api/v1` | 3 |

## Routes exposees par FastAPI

### Routes techniques

| Route | Methode | Fichier | Statut |
|---|---|---|---|
| `/health` | GET | `backend/app/main.py` | Actif |
| `/api/attestations/verify` | GET | `backend/app/main.py` | Legacy/non versionne |

### Auth

| Route | Methode | Fichier | Statut |
|---|---|---|---|
| `/api/auth/login` | POST | `backend/app/api/v1/auth/__init__.py` | Legacy |
| `/api/auth/me` | GET | idem | Legacy |
| `/api/auth/refresh` | POST | idem | Legacy |
| `/api/auth/logout` | POST | idem | Legacy |
| `/api/auth/reset-password` | POST | idem | Legacy |
| `/api/v1/auth/login` | POST | `backend/app/api/v1/auth/router.py` | Cible |
| `/api/v1/auth/me` | GET | idem | Cible |
| `/api/v1/auth/refresh` | POST | idem | Cible |
| `/api/v1/auth/logout` | POST | idem | Cible |
| `/api/v1/auth/password/reset` | POST | idem | Cible, mais nom different du frontend |

### Users

| Route | Methode | Fichier | Statut |
|---|---|---|---|
| `/api/users` | POST/GET | `backend/app/api/v1/users/__init__.py` | Legacy |
| `/api/users/{user_id}` | PATCH/DELETE | idem | Legacy |
| `/api/v1/users` | POST/GET | `backend/app/api/v1/users/router.py` | Cible |
| `/api/v1/users/{user_id}` | PATCH/DELETE | idem | Cible |

### Settings, site content et media

| Route | Methode | Fichier | Statut |
|---|---|---|---|
| `/api/settings` | GET/POST | `backend/app/api/v1/settings/__init__.py` | Exposee, non versionnee |
| `/api/site-content` | GET | idem | Exposee, non versionnee |
| `/api/media` | GET/POST | `backend/app/api/v1/media/__init__.py` | Exposee, non versionnee |
| `/api/media/brand-assets` | GET | idem | Exposee, non versionnee |
| `/api/media/usage` | GET/POST | idem | Exposee, non versionnee |
| `/api/media/usage/{usage_id}` | DELETE | idem | Exposee, non versionnee |
| `/api/media/{media_id}` | GET/PATCH/DELETE | idem | Exposee, non versionnee |
| `/api/media/{media_id}/restore` | POST | idem | Exposee, non versionnee |
| `/api/media/{media_id}/purge` | DELETE | idem | Exposee, non versionnee |
| `/api/media/{media_id}/replace` | POST | idem | Exposee, non versionnee |

### Modules metier versionnes

| Route | Methode | Fichier | Implementation observee |
|---|---|---|---|
| `/api/v1/projects` | GET/POST | `backend/app/api/v1/projects/__init__.py` | Store memoire `_projects_store` |
| `/api/v1/employees` | GET/POST | `backend/app/api/v1/employees/__init__.py` | Store memoire `_employees_store` |
| `/api/v1/suppliers` | GET/POST | `backend/app/api/v1/suppliers/__init__.py` | Store memoire `_suppliers_store` |
| `/api/v1/products` | GET/POST | `backend/app/api/v1/products/__init__.py` | Store memoire `_products_store` |
| `/api/v1/finance` | GET/POST | `backend/app/api/v1/finance/__init__.py` | Store memoire `_finance_store` |
| `/api/v1/immobilier` | GET/POST | `backend/app/api/v1/immobilier/__init__.py` | Store memoire `_immobilier_store` |
| `/api/v1/foncier` | GET/POST | `backend/app/api/v1/foncier/__init__.py` | Store memoire `_foncier_store` |

## Routes appelees par le frontend

### Appels API explicites

| Route appelee | Consommateur | Backend expose ? | Diagnostic |
|---|---|---:|---|
| `/api/v1/auth/login` | `apiClient`, `apiService`, `AuthContext` | Oui | OK cible |
| `/api/v1/auth/me` | `apiClient`, `apiService`, `AuthContext` | Oui | OK cible |
| `/api/v1/auth/refresh` | `apiClient`, `apiService`, `AuthContext` | Oui | OK cible |
| `/api/v1/auth/logout` | `apiClient`, `apiService` | Oui | OK cible |
| `/api/v1/auth/reset-password` | `ResetPasswordPage` | Non | Frontend appelle mauvais chemin |
| `/api/v1/auth/password/reset` | Aucun consommateur direct observe | Oui | Backend expose cette variante |
| `/api/v1/users` | `apiClient`, `apiService`, `Utilisateurs` | Oui | OK cible |
| `/api/v1/users/{id}` | `apiClient.users.update/delete` | Oui | OK cible |
| `/api/v1/settings` | `apiClient.settings`, `SettingsContext` | Non | Backend expose `/api/settings` |
| `/api/v1/site-content` | `apiClient.siteContent`, `SiteContentContext` | Non | Backend expose `/api/site-content` |
| `/api/v1/media` | `apiClient.media`, `Media`, `MediaUploader`, `Documents` | Non | Backend expose `/api/media` |
| `/api/v1/media/{id}` | `apiClient.media` | Non | Backend expose `/api/media/{id}` |
| `/api/v1/media/brand-assets` | `apiClient.media`, `mediaUtils` | Non | Backend expose `/api/media/brand-assets` |
| `/api/v1/media/usage` | `mediaUtils` | Non | Backend expose `/api/media/usage` |
| `/api/v1/media/{id}/restore` | `apiClient.media` | Non | Backend expose `/api/media/{id}/restore` |
| `/api/v1/media/{id}/purge` | `apiClient.media` | Non | Backend expose `/api/media/{id}/purge` |
| `/api/v1/media/{id}/replace` | `apiClient.media` | Non | Backend expose `/api/media/{id}/replace` |
| `/api/v1/storage/media/{path}` | `legacySupabaseAdapter.storage.remove` | Non | Route fantome |
| `/api/v1/rpc/{name}` | `legacySupabaseAdapter.rpc` | Non | Route fantome |
| `/api/v1/functions/{name}` | `legacySupabaseAdapter.functions.invoke` | Non | Route fantome |

### Appels Supabase-like encore directs

23 fichiers appellent encore `supabase.from(...)`.

Fichiers concernes:

- `src/components/page-builder/PageBuilder.tsx`
- `src/lib/bot-engine.ts`
- `src/lib/foncierOffline.ts`
- `src/lib/mediaUtils.ts`
- `src/lib/social-publish.ts`
- `src/pages/Documents.tsx`
- `src/pages/Employes.tsx`
- `src/pages/Finances.tsx`
- `src/pages/Foncier.tsx`
- `src/pages/Fournisseurs.tsx`
- `src/pages/Fournitures.tsx`
- `src/pages/Immobilier.tsx`
- `src/pages/Leads.tsx`
- `src/pages/Projets.tsx`
- `src/pages/RegistreVisiteur.tsx`
- `src/pages/Statistiques.tsx`
- `src/pages/Taches.tsx`
- `src/pages/admin/SiteEditor.tsx`
- `src/pages/public/PublicHome.tsx`
- `src/pages/public/PublicLots.tsx`
- tests et wrappers associes.

Diagnostic:

- En mode non self-hosted, `legacySupabaseAdapter` reexporte le vrai client Supabase.
- En mode self-hosted, `legacySupabaseAdapter` expose `rpc`, `functions`, `storage`, `auth`, mais pas `from`.
- Donc les appels `supabase.from(...)` restants ne sont pas réellement routables vers FastAPI par cet adapter.
- Ils sont la preuve que le runtime frontend n'est pas encore industrialise.

## Backend vs frontend: mismatches critiques

| Mismatch | Impact | Criticite |
|---|---|---:|
| Frontend `/api/v1/settings` vs backend `/api/settings` | SettingsContext ne peut pas charger/sauver via FastAPI versionne | Eleve |
| Frontend `/api/v1/site-content` vs backend `/api/site-content` | SiteContentContext incompatible avec backend actuel | Eleve |
| Frontend `/api/v1/media*` vs backend `/api/media*` | MediaPicker/MediaUploader/Documents peuvent echouer en self-hosted | Critique |
| Frontend `/api/v1/auth/reset-password` vs backend `/api/v1/auth/password/reset` | Reset password casse | Eleve |
| Adapter `/api/v1/rpc/:name` absent backend | Foncier/offline/leads via RPC cassent | Critique |
| Adapter `/api/v1/functions/:name` absent backend | Attestation-sign/realtime hooks cassent | Critique |
| Adapter `/api/v1/storage/media/:path` absent backend | Rollback/suppression storage casse | Eleve |
| `supabase.from` absent en adapter self-hosted | 23 fichiers peuvent crasher | Critique |
| Modules backend metier en store memoire | Routes v1 existent mais ne persistent pas | Critique |
| `nginx.conf` frontend standalone `location /api/ { try_files $uri =404; }` | Les appels same-origin `/api/*` seraient 404 si `VITE_LOCAL_API_URL` pointe vers frontend | Eleve |

## Tests backend et realite couverte

| Suite | Routes testees | Diagnostic |
|---|---|---|
| `backend/tests/test_auth_api.py` | `/api/auth/*`, `/api/users` | Couvre legacy non versionne |
| `backend/tests/test_v1_api.py` | `/api/v1/auth/*`, `/api/v1/users` | Couvre cible auth/users |
| `backend/tests/test_media_api.py` | `/api/media*` | Couvre media legacy non versionne |
| `backend/tests/test_business_modules.py` | `/api/v1/projects`, `/api/v1/employees` | Couvre stores memoire |
| `backend/tests/test_extended_modules.py` | `/api/v1/suppliers`, products, finance, immobilier, foncier | Couvre stores memoire |

Constat:

- Les tests valident la coexistence legacy + v1.
- Ils ne prouvent pas que le frontend runtime consomme les routes exposees.
- Ils ne prouvent pas la persistance metier pour les modules en store memoire.

## Realite proxy/runtime

### Frontend Docker statique

`nginx.conf` contient:

```nginx
location /api/ {
    try_files $uri =404;
}
```

Impact:

- si le frontend appelle une URL relative `/api/v1/...` sur le meme domaine frontend, Nginx renvoie 404;
- le frontend depend donc fortement de `VITE_LOCAL_API_URL` pour appeler FastAPI directement;
- la configuration runtime doit etre verifiee avant de conclure qu'une route "marche".

### Production historique

`nginx/nginx-production.conf` expose `api.gnambaservices.ci` vers `egs_api`, defini historiquement comme Kong.

Impact:

- `api.gnambaservices.ci` n'est pas necessairement FastAPI;
- il peut encore representer l'ancienne gateway Supabase/Kong;
- le runtime production peut diverger du runtime backend FastAPI local.

## Strategie de consolidation vers `/api/v1`

### Principe

Une route est consideree cible uniquement si:

- elle est sous `/api/v1`;
- elle est exposee par FastAPI;
- elle est consommee par le frontend via `apiClient` unique;
- elle a un test backend;
- elle persiste dans PostgreSQL ou appelle un service/repository persistant;
- elle ne depend pas de `legacySupabaseAdapter`.

### Lots techniques internes proposes

| Sous-lot | Objectif | Validation |
|---|---|---|
| 3A | Aligner routes settings/site/media vers `/api/v1` | Frontend et backend utilisent les memes chemins |
| 3B | Supprimer le second client API ou le declarer obsolete | `AuthContext` utilise un client unique |
| 3C | Creer routes explicites remplaçant `rpc/functions/storage` ou retirer les mappings fantomes | Plus aucune route appelee inexistante |
| 3D | Remplacer `supabase.from` par repositories API module par module | Nombre de fichiers `supabase.from` descend sans regression |
| 3E | Remplacer stores memoire backend par repositories SQLAlchemy | Tests prouvent persistance |
| 3F | Adapter Nginx/Compose pour proxy `/api/v1` vers FastAPI | Appels runtime passent sans CORS fragile |

## Criteres de validation Lot 3

- Toutes les routes `/api/*` et `/api/v1/*` exposees sont identifiees.
- Les routes appelees par le frontend sont comparees aux routes exposees.
- Les routes fantomes sont identifiees.
- Les doublons legacy/cible sont identifies.
- La realite `supabase.from` runtime est explicitee.
- Aucun changement fonctionnel n'a ete effectue.

## Recommandation avant Lot 4

Avant de chercher le code mort, il faut accepter ce diagnostic:

- `/api/v1` n'est pas encore la seule API effective;
- l'adapter Supabase ne sauve pas les appels `from()`;
- plusieurs appels frontend versionnes ne correspondent pas au backend;
- plusieurs routes backend versionnees sont des prototypes memoire;
- le proxy peut envoyer `/api` vers 404, Kong ou FastAPI selon le contexte.

Le Lot 4 pourra ensuite distinguer code mort, code legacy encore consommé, code prototype, et code fantome.
