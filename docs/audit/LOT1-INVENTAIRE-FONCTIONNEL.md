# LOT 1 — Inventaire fonctionnel

> **LECTURE SEULE — NON VALIDATION GLOBALE.** La partie DB du Lot 1 est validée séparément. Le présent inventaire ne valide pas le Lot 1 entier et ne commence pas le Lot 2.

## Méthode et limites de preuve

Chaque constat ci-dessous renvoie à une commande exécutée et à un extrait de sa sortie dans la section « Registre des preuves ». Les routes et imports prouvent une déclaration ou un câblage statique, pas un workflow fonctionnel. `FONCTIONNEL PROUVÉ` est réservé à une preuve de bout en bout; aucun écran n’atteint ce niveau dans les preuves disponibles. En l’absence d’une preuve suffisante, le statut est `NON ÉTABLI`.

Aucun secret, contenu de `.env`, identifiant utilisateur, ni contenu de CSV n’a été lu ou affiché. Les tests n’ont pas été relancés afin de ne pas générer d’autres écritures/cache; leurs résultats sont ceux de la passe précédente citée dans le rapport DB.

## A. Routes backend

### Totaux runtime

| Périmètre | Routes | Couples méthode/chemin uniques | Fichiers source avec routes |
|---|---:|---:|---:|
| API `/api/v1` | 231 | 231 | 27 |
| Application complète, hors docs FastAPI | 238 | 238 | 29 |
| Doublons méthode + chemin | 0 | — | — |

Extrait brut `[A1]` : `TOTAL 238 UNIQUE_METHOD_PATH 238 DUPLICATES 0 SOURCE_FILES 29` puis `V1_ROUTES 231 V1_FILES 27`. Ce décompte est runtime via les routes FastAPI montées, non un simple comptage de décorateurs.

Dans les lignes ci-dessous, les chemins sont donnés avec leur méthode; `auth` décrit la garde trouvée dans le graphe de dépendances FastAPI ou une validation manuelle explicitement vérifiée. `permission` décrit les actions/module transmis au guard, pas une approbation métier.

| Fichier de route | N | Auth / permission observées | Méthodes + chemins observés |
|---|---:|---|---|
| `backend/app/api/v1/auth/router.py` | 9 | Pas de dépendance `get_current_user` déclarative; validation interne par `AuthService` pour `me`, MFA, logout/change selon handler. Login, refresh et reset sont des parcours publics/tokenisés. | POST `/api/v1/auth/login`; POST `/api/v1/auth/mfa/verify`; GET `/api/v1/auth/me`; POST `/api/v1/auth/refresh`; POST `/api/v1/auth/logout`; POST `/api/v1/auth/password/forgot`; POST `/api/v1/auth/password/reset`; POST `/api/v1/auth/reset-password`; POST `/api/v1/auth/change-password` |
| `backend/app/api/v1/clients/router.py` | 7 | `get_current_user`; `require_permission` avec `clients/read_private`, `create`, `update`, `delete` selon route. | GET `/api/v1/clients`; GET `/api/v1/clients/{client_id}`; POST `/api/v1/clients`; PATCH `/api/v1/clients/{client_id}`; DELETE `/api/v1/clients/{client_id}`; POST `/api/v1/clients/{client_id}/activate`; GET `/api/v1/clients/search/suggest` |
| `backend/app/api/v1/dashboard/router.py` | 4 | `require_admin_user`. | GET `/api/v1/dashboard`; GET `/api/v1/dashboard/stats`; GET `/api/v1/dashboard/logs`; GET `/api/v1/dashboard/report` |
| `backend/app/api/v1/employees/router.py` | 6 | `require_admin_user`. | POST `/api/v1/employees`; GET `/api/v1/employees`; GET `/api/v1/employees/{employee_id}`; PATCH `/api/v1/employees/{employee_id}`; DELETE `/api/v1/employees/{employee_id}`; GET `/api/v1/employees/search/suggest` |
| `backend/app/api/v1/entities/router.py` | 12 | `require_admin_user`. | GET `/api/v1/entities`; GET `/api/v1/entities/types/stats`; GET `/api/v1/entities/search/suggest`; GET `/api/v1/entities/check-duplicate`; GET `/api/v1/entities/resolve/{entity_id}`; GET `/api/v1/entities/{entity_id}`; POST `/api/v1/entities`; POST `/api/v1/entities/bulk`; PATCH `/api/v1/entities/{entity_id}`; DELETE `/api/v1/entities/{entity_id}`; POST `/api/v1/entities/{entity_id}/restore`; POST `/api/v1/entities/migrate/party` |
| `backend/app/api/v1/finance/router.py` | 5 | `require_admin_user` sur les routes observées; une dépendance utilisateur optionnelle est également présente dans le graphe. | POST `/api/v1/finance`; GET `/api/v1/finance`; GET `/api/v1/finance/{finance_id}`; PATCH `/api/v1/finance/{finance_id}`; DELETE `/api/v1/finance/{finance_id}` |
| `backend/app/api/v1/foncier/router.py` | 59 | `get_current_user` + permission route-level `foncier/read` (`resource=None`) sur les 59 routes; règles objet/ACL additionnelles à vérifier dans les handlers. | POST `/api/v1/foncier/villages`; GET `/api/v1/foncier/villages`; GET `/api/v1/foncier/villages/with-stats`; GET `/api/v1/foncier/villages/{village_id}`; GET `/api/v1/foncier/villages/{village_id}/with-stats`; PATCH `/api/v1/foncier/villages/{village_id}`; DELETE `/api/v1/foncier/villages/{village_id}`; POST `/api/v1/foncier/villages/{village_id}/lotissements`; GET `/api/v1/foncier/villages/{village_id}/lotissements`; GET `/api/v1/foncier/lotissements/{lotissement_id}`; PATCH `/api/v1/foncier/lotissements/{lotissement_id}`; DELETE `/api/v1/foncier/lotissements/{lotissement_id}`; POST `/api/v1/foncier/lotissements/{lotissement_id}/ilots`; GET `/api/v1/foncier/lotissements/{lotissement_id}/ilots`; GET `/api/v1/foncier/ilots/{ilot_id}`; PATCH `/api/v1/foncier/ilots/{ilot_id}`; DELETE `/api/v1/foncier/ilots/{ilot_id}`; POST `/api/v1/foncier/ilots/{ilot_id}/lots`; GET `/api/v1/foncier/ilots/{ilot_id}/lots`; GET `/api/v1/foncier/lots`; GET `/api/v1/foncier/lots/{lot_id}`; PATCH `/api/v1/foncier/lots/{lot_id}`; POST `/api/v1/foncier/lots/{lot_id}/archive`; POST `/api/v1/foncier/lots/{lot_id}/restore`; POST `/api/v1/foncier/lots/check-duplicate`; GET `/api/v1/foncier/lots/exists`; POST `/api/v1/foncier/ilots/{ilot_id}/lots/import`; POST `/api/v1/foncier/lots/export`; POST `/api/v1/foncier/lots/{lot_id}/attestations`; GET `/api/v1/foncier/lots/{lot_id}/attestations`; GET `/api/v1/foncier/attestations`; GET `/api/v1/foncier/attestations/{attestation_id}`; PATCH `/api/v1/foncier/attestations/{attestation_id}`; POST `/api/v1/foncier/attestations/{attestation_id}/submit`; POST `/api/v1/foncier/attestations/{attestation_id}/validate`; POST `/api/v1/foncier/attestations/{attestation_id}/scan`; POST `/api/v1/foncier/attestations/{attestation_id}/revoke`; POST `/api/v1/foncier/attestations/{attestation_id}/generate-pdf`; GET `/api/v1/foncier/attestations/{attestation_id}/pdf`; GET `/api/v1/foncier/attestations/verify/{reference}`; GET `/api/v1/foncier/audit/timeline/{entity_type}/{entity_id}`; GET `/api/v1/foncier/audit`; POST `/api/v1/foncier/audit/export-pdf`; POST `/api/v1/foncier/audit/export-csv`; POST `/api/v1/foncier/access/{user_id}/villages/{village_id}`; DELETE `/api/v1/foncier/access/{user_id}/villages/{village_id}`; GET `/api/v1/foncier/access/me/villages`; GET `/api/v1/foncier/villages/{village_id}/users`; GET `/api/v1/foncier/sync/status`; POST `/api/v1/foncier/sync/trigger`; GET `/api/v1/foncier/sync/queue`; POST `/api/v1/foncier/sync/queue/{queue_item_id}/resolve`; POST `/api/v1/foncier/sync/cleanup`; GET `/api/v1/foncier/dashboard/stats`; GET `/api/v1/foncier/lotissements`; GET `/api/v1/foncier/ilots`; GET `/api/v1/foncier/assembly`; GET `/api/v1/foncier/villages/names`; POST `/api/v1/foncier/attestations/{attestation_id}/sign` |
| `backend/app/api/v1/immobilier/contracts_router.py` | 9 | `require_admin_user`. | POST `/api/v1/immobilier/contracts`; GET `/api/v1/immobilier/contracts`; GET `/api/v1/immobilier/contracts/stats`; GET `/api/v1/immobilier/contracts/{contract_id}`; PATCH `/api/v1/immobilier/contracts/{contract_id}`; DELETE `/api/v1/immobilier/contracts/{contract_id}`; POST `/api/v1/immobilier/contracts/{contract_id}/restore`; POST `/api/v1/immobilier/contracts/{contract_id}/terminate`; GET `/api/v1/immobilier/contracts/health` |
| `backend/app/api/v1/immobilier/payments_router.py` | 8 | `require_admin_user`. | POST `/api/v1/immobilier/payments`; GET `/api/v1/immobilier/payments`; GET `/api/v1/immobilier/payments/stats`; GET `/api/v1/immobilier/payments/{payment_id}`; PATCH `/api/v1/immobilier/payments/{payment_id}`; DELETE `/api/v1/immobilier/payments/{payment_id}`; POST `/api/v1/immobilier/payments/{payment_id}/restore`; GET `/api/v1/immobilier/payments/health` |
| `backend/app/api/v1/immobilier/properties_router.py` | 12 | `require_admin_user`. | POST `/api/v1/immobilier/properties`; POST `/api/v1/immobilier/properties/{property_id}/localite/verification`; GET `/api/v1/immobilier/properties`; GET `/api/v1/immobilier/properties/stats`; GET `/api/v1/immobilier/properties/{property_id}`; PATCH `/api/v1/immobilier/properties/{property_id}`; POST `/api/v1/immobilier/properties/{property_id}/transition`; DELETE `/api/v1/immobilier/properties/{property_id}`; POST `/api/v1/immobilier/properties/{property_id}/publish`; POST `/api/v1/immobilier/properties/{property_id}/unpublish`; POST `/api/v1/immobilier/properties/{property_id}/restore`; GET `/api/v1/immobilier/properties/health` |
| `backend/app/api/v1/leads/automation_routes.py` | 3 | `require_admin_user`. | POST `/api/v1/leads/{lead_id}/evaluate-automation`; GET `/api/v1/leads/automation/rules`; POST `/api/v1/leads/automation/rules/{rule_id}/toggle` |
| `backend/app/api/v1/leads/campaign_routes.py` | 8 | Routeur entier dépend de `require_admin_user`. | POST `/api/v1/leads/campaigns`; GET `/api/v1/leads/campaigns`; GET `/api/v1/leads/campaigns/{campaign_id}`; PATCH `/api/v1/leads/campaigns/{campaign_id}`; DELETE `/api/v1/leads/campaigns/{campaign_id}`; POST `/api/v1/leads/campaigns/{campaign_id}/process`; GET `/api/v1/leads/campaigns/{campaign_id}/stats`; POST `/api/v1/leads/campaigns/{campaign_id}/preview` |
| `backend/app/api/v1/leads/router.py` | 7 | `require_admin_user`; capture/public behavior à distinguer du CRUD protégé. | GET `/api/v1/leads`; GET `/api/v1/leads/{lead_id}`; POST `/api/v1/leads/capture`; POST `/api/v1/leads`; PATCH `/api/v1/leads/{lead_id}`; DELETE `/api/v1/leads/{lead_id}`; GET `/api/v1/leads/search/suggest` |
| `backend/app/api/v1/media/router.py` | 15 | `media/create`, `read_private`, `read_audit`, `write_audit`, `create_usage`, `delete_usage`, `update`, `delete`, `restore`, `purge`, `replace`; GET brand assets sans permission déclarative. | GET `/api/v1/media/brand-assets`; POST `/api/v1/media`; GET `/api/v1/media`; GET `/api/v1/media/usage`; GET `/api/v1/media/audit`; POST `/api/v1/media/audit`; POST `/api/v1/media/usage`; DELETE `/api/v1/media/usage/{usage_id}`; GET `/api/v1/media/{media_id}`; PATCH `/api/v1/media/{media_id}`; DELETE `/api/v1/media/{media_id}`; POST `/api/v1/media/{media_id}/restore`; DELETE `/api/v1/media/{media_id}/purge`; POST `/api/v1/media/{media_id}/replace`; GET `/api/v1/media/{media_id}/versions` |
| `backend/app/api/v1/notifications/router.py` | 1 | `require_admin_user`. | POST `/api/v1/notifications/whatsapp/send` |
| `backend/app/api/v1/page_layouts/router.py` | 4 | GET liste `site_vitrine/read_draft`; GET détail optional auth/public published; POST `site_vitrine/create`; PATCH publish `site_vitrine/publish`. | GET `/api/v1/page-layouts`; GET `/api/v1/page-layouts/{page_slug}`; POST `/api/v1/page-layouts`; PATCH `/api/v1/page-layouts/{page_slug}/publish` |
| `backend/app/api/v1/products/router.py` | 4 | `require_admin_user`. | POST `/api/v1/products`; GET `/api/v1/products`; PATCH `/api/v1/products/{product_id}`; DELETE `/api/v1/products/{product_id}` |
| `backend/app/api/v1/projects/router.py` | 4 | `require_admin_user`. | POST `/api/v1/projects`; GET `/api/v1/projects`; PATCH `/api/v1/projects/{project_id}`; DELETE `/api/v1/projects/{project_id}` |
| `backend/app/api/v1/rpc/router.py` | 1 | `require_admin_user`; nom RPC distribué dynamiquement. | POST `/api/v1/rpc/{name}` |
| `backend/app/api/v1/settings/router.py` | 9 | 7 routes `require_admin_user`; `/public` et `/frontend` sans garde déclarative. | GET `/api/v1/settings`; GET `/api/v1/settings/public`; GET `/api/v1/settings/category/{category}`; GET `/api/v1/settings/frontend`; GET `/api/v1/settings/whitelist`; GET `/api/v1/settings/audit`; GET `/api/v1/settings/{key}`; POST `/api/v1/settings`; DELETE `/api/v1/settings/{key}` |
| `backend/app/api/v1/site/router.py` | 13 | 8 routes `site_vitrine` (read_private/create/update/delete); 5 routes publiques sans guard déclaratif. | GET `/api/v1/site/realisations`; GET `/api/v1/site/properties`; GET `/api/v1/site/realisations/{item_id}`; POST `/api/v1/site/realisations`; PATCH `/api/v1/site/realisations/{item_id}`; DELETE `/api/v1/site/realisations/{item_id}`; GET `/api/v1/site/vitrine-lots`; GET `/api/v1/site/vitrine-lots/{item_id}`; POST `/api/v1/site/vitrine-lot-inquiries`; POST `/api/v1/site/lead-capture`; POST `/api/v1/site/vitrine-lots`; PATCH `/api/v1/site/vitrine-lots/{item_id}`; DELETE `/api/v1/site/vitrine-lots/{item_id}` |
| `backend/app/api/v1/site_content/router.py` | 6 | GET ×3 public; POST/PATCH/DELETE ×3 `require_admin_user`. | GET `/api/v1/site-content`; GET `/api/v1/site-content/{section}`; GET `/api/v1/site-content/{section}/{key}`; POST `/api/v1/site-content`; PATCH `/api/v1/site-content/{content_id}`; DELETE `/api/v1/site-content/{content_id}` |
| `backend/app/api/v1/suppliers/router.py` | 6 | `require_admin_user`. | POST `/api/v1/suppliers`; GET `/api/v1/suppliers`; GET `/api/v1/suppliers/{supplier_id}`; PATCH `/api/v1/suppliers/{supplier_id}`; DELETE `/api/v1/suppliers/{supplier_id}`; GET `/api/v1/suppliers/search/suggest` |
| `backend/app/api/v1/tables/router.py` | 4 | GET/PATCH/DELETE `get_current_user` + `enforce_permission`; POST optional identity then explicitly limits public `contact_messages`; other writes call `enforce_permission`. `module=erp_table`, `resource=table` dynamique. | GET `/api/v1/tables/{table}`; POST `/api/v1/tables/{table}`; PATCH `/api/v1/tables/{table}/{row_id}`; DELETE `/api/v1/tables/{table}/{row_id}` |
| `backend/app/api/v1/tasks/router.py` | 5 | `require_admin_user`. | GET `/api/v1/tasks`; GET `/api/v1/tasks/{task_id}`; POST `/api/v1/tasks`; PATCH `/api/v1/tasks/{task_id}`; DELETE `/api/v1/tasks/{task_id}` |
| `backend/app/api/v1/tenants/router.py` | 6 | `require_admin_user`. | GET `/api/v1/tenants`; GET `/api/v1/tenants/{tenant_id}`; POST `/api/v1/tenants`; PATCH `/api/v1/tenants/{tenant_id}`; DELETE `/api/v1/tenants/{tenant_id}`; GET `/api/v1/tenants/search/suggest` |
| `backend/app/api/v1/users/router.py` | 4 | Pas de `Depends` d’auth; chaque handler appelle `auth_service.get_current_user(authorization)` puis exige `role=admin` et `mfa_verified is True`. | POST `/api/v1/users`; GET `/api/v1/users`; PATCH `/api/v1/users/{user_id}`; DELETE `/api/v1/users/{user_id}` |

Les 27 fichiers source de routes `/api/v1` sont listés ci-dessus; les routes supplémentaires viennent de `backend/app/api/storage_files.py` (2) et `backend/app/main.py` (5). Le répertoire `backend/app/api/v1/documents/` n’a pas de fichier route trouvé par `rg --files`; **endpoint métier Documents dédié : NON ÉTABLI**.

### Contrôle d’accès sans dépendance déclarative

`A1` a recensé **24 routes v1** sans garde dans le graphe `Depends`. Cette liste signale l’absence de garde déclarative, pas automatiquement une vulnérabilité : Auth et Users ont des contrôles manuels; plusieurs routes sont publiques par conception.

Extrait brut : `UNGUARDED_DECLARATIVE_V1 24`; parmi les chemins: `GET /api/v1/settings/public`, `GET /api/v1/site-content`, `GET /api/v1/site/realisations`, `POST /api/v1/site/lead-capture`, `GET /api/v1/media/brand-assets`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/users`.

Les 24 sont : settings public/frontend (2); site-content GET (3); site GET/POST public (5); media brand assets (1); auth (9); users (4). `auth/me`, `logout`, `change-password` et les quatre routes Users doivent être examinées via leur contrôle manuel; les autres parcours Auth sont des entrées login/MFA/reset/refresh. Les lectures site/CMS/settings et formulaires vitrine sont publiques selon les handlers, mais les champs réellement exposés restent à vérifier par contrat. **Routes sensibles sans protection effective : NON ÉTABLI**; une route non guardée déclarativement n’est pas, à elle seule, une preuve d’absence de contrôle dans son handler.

### Compatibilité legacy

`backend/app/main.py` définit `LegacyAPIPrefixMiddleware` : réécriture des chemins `/api/...` en `/api/v1/...`, sauf ceux commençant déjà par `/api/v1/` et `/api/attestations`. Extrait brut `[A2]` : `if path.startswith("/api/") and not path.startswith("/api/v1/") and not path.startswith("/api/attestations")`. `apiClient` continue d’envoyer ses endpoints relatifs et s’appuie sur ce middleware pour certains chemins legacy. Les routes de compatibilité réellement utilisées par l’ensemble du frontend : NON ÉTABLI au-delà des références statiques recensées en C.

## B. Rôles et permissions (RBAC)

### 1. Backend — politique centralisée codée

`backend/app/core/authorization.py` donne les résultats suivants. `require_admin_user` et les checks locaux de route s’ajoutent à cette fonction; cette matrice ne prétend donc pas décrire seule tous les handlers.

| Principal | Module/action | Résultat codé par `has_permission` |
|---|---|---|
| absent | tout | DENY |
| `admin` | MFA non vérifiée | DENY |
| `admin` | `erp_table/read/stats_journalieres` | ALLOW si MFA vérifiée |
| `admin` | `erp_table` autres ressources/actions | DENY |
| `admin` | autre module, action export | DENY |
| `admin` | autre module/action | ALLOW si MFA vérifiée |
| `gestionnaire` | `erp_table/read/stats_journalieres` | ALLOW |
| `gestionnaire` | autres ressources/actions/table | DENY |
| `employe`, `guest`, rôle inconnu | toute permission privée | DENY |

La politique déclare `_GENERIC_TABLE_ACTIONS = {"read"}`, `_EXPORT_ACTIONS = {"export", "EXPORT"}` et `MANAGER_READ_TABLES = {"stats_journalieres"}`. Elle ne définit pas une grille explicite exhaustive `module × action` : la plupart des modules sont « Admin si MFA vérifiée », sauf exports et `/tables`. Les permissions particulières Clients, Foncier, Media, Site Vitrine et Layout sont fournies par les routes via `require_permission`, détaillées en A.

Extrait brut `[B1]` : `MANAGER_READ_TABLES = frozenset({"stats_journalieres"})`; `if action in _EXPORT_ACTIONS: return False`; `if role != "admin": return False`; puis `return True`. Source : `backend/app/core/authorization.py`, inspection `nl -ba`/`sed`.

### 2. Frontend — visibilité d’écran (pas autorité serveur)

`src/context/AuthContext.tsx` expose ces niveaux UI et listes (`hasAccess` filtre la Sidebar). Décompte des modules par niveau issu des tableaux codés :

| Niveau UI | Modules autorisés dans `ACCESS_LEVEL_MODULES` |
|---|---|
| `admin` | `*` (tous) |
| `gerant` | 16 : dashboard, clients, projets, immobilier, foncier, catalogue-lots, fournitures, finances, employes, fournisseurs, documents, taches, statistiques, parametres, media, registre |
| `gestionnaire` | Les mêmes 16 que `gerant` |
| `secretaire` | 11 : dashboard, clients, documents, fournisseurs, fournitures, taches, media, registre, immobilier, foncier, catalogue-lots |
| `ouvrier` | 6 : dashboard, projets, taches, documents, media, registre |
| `visiteur` | 2 : dashboard, registre |
| `employe` | 6 : dashboard, projets, taches, documents, media, registre |

`resolveAccessLevel` priorise les rôles `admin` et `gestionnaire`; sinon un `access_level` reconnu peut déterminer l’affichage, puis fallback sur `employe`. `hasAccess` ne vérifie que cette liste de visibilité. Extrait brut `[B2]` : `admin: ["*"]`, `gestionnaire: [...]`, `employe: ["dashboard", "projets", "taches", "documents", "media", "registre"]`; `visibleItems` utilise `hasAccess(...)` dans `src/components/Sidebar.tsx`.

### 3. Rôles en base — agrégats sans identifiants

Commande exécutée : `SELECT role, count(*) AS accounts FROM public.users GROUP BY role ORDER BY role;`.

```text
source  role           accounts
users   admin          1
users   employe        2
gestionnaire           1
(3 rows)
```

Total observé : **4 comptes**, **3 valeurs de rôle**. Aucun compte `guest` n’est ressorti dans ce résultat. Aucune identité ou autre colonne n’a été sélectionnée.

Agrégation séparée demandée pour `access_level` (comptes seulement) :

```sql
SELECT access_level, count(*) FROM public.users GROUP BY access_level;
```

Extrait brut exécuté :

```text
access_level    count
admin           2
employe         1
gestionnaire    1
(3 rows)
```

Total : **4 comptes**, **3 valeurs**. Les distributions `role` (admin 1, employe 2, gestionnaire 1) et `access_level` (admin 2, employe 1, gestionnaire 1) ne sont pas identiques. Le rapprochement compte par compte, toute relation entre les deux colonnes et toute explication de cet écart : **NON ÉTABLI**; aucune jointure ou donnée identifiante n’a été consultée.

### 4. Écarts observables

| Comparaison | Écart prouvé |
|---|---|
| Backend vs frontend | Backend accorde au `gestionnaire` une permission générique limitée à `stats_journalieres`; le frontend lui affiche 16 modules. C’est une différence d’autorité vs visibilité UI, pas une preuve de contournement backend. |
| Backend vs base | Le backend `RoleEnum` déclare `admin`, `gestionnaire`, `employe`, `guest`; le relevé DB n’observe que les trois premiers, 4 comptes. `guest` en base : absent du SELECT observé. |
| Frontend type vs backend | `UserRole` TypeScript contient `admin | gestionnaire | employe`, sans `guest`; `AccessLevel` ajoute `gerant`, `secretaire`, `ouvrier`, `visiteur`. Le modèle SQLAlchemy `AccessLevelEnum` ne déclare que `admin`, `gestionnaire`, `employe`, `guest`. Persistance effective des autres niveaux UI : NON ÉTABLI. |
| Mapping en DB | `users.role` observé; mapping `access_level` pour les 4 comptes et compatibilité de chaque valeur : NON ÉTABLI (aucun SELECT d’access_level demandé/exécuté). |

### 5. Documents de décision et application dans le code

| Document | Contenu/statut prouvé | Concordance code |
|---|---|---|
| `SITE-VITRINE-RBAC-DECISION-FINALE.md` | Malgré son nom, en-tête : « document prêt à la validation du responsable métier »; des valeurs métier restent `UNKNOWN`, notamment allowlist Admin. | Sa description de 34 tables en lecture Gestionnaire / Admin CRUD ne correspond pas au `MANAGER_READ_TABLES` actuel limité à `stats_journalieres`; document de travail, pas décision finale complète appliquée. |
| `SITE-VITRINE-RBAC-MATRIX.md` | Daté Phase 3.3; annonce un mapping temporaire « admin écrit; gestionnaire lit; employé limité jusqu’à validation ». | La partie générique 34 tables en lecture ne correspond plus au code actuel. Son statut technique ne vaut pas validation métier détaillée. |
| `RBAC_PHASE_B_DECISIONS_METIER.md` | DECISION-001 (4 mappings de rôle) et principe DECISION-004 marqués VALIDÉ; DECISION-003 périmètre Agent/Gestionnaire reste EN ATTENTE. | Les noms de rôles sont dans le modèle et les trois rôles observés existent en DB; scopes métiers cumulables et périmètres par table ne sont pas implémentés/démontrés. |
| `RBAC_PHASE_B4_DECISION_003_A_VALIDER.md` | Fiche explicitement EN ATTENTE; propositions non validées. | Aucune matrice de scope ligne métier ne peut être déduite du code. |
| `RBAC_PHASE_B6_VALIDATION_METIER.md` | Document à remplir/contrôler/valider avant B.7; des principes sont validés, plusieurs détails restent UNKNOWN. | N’est pas une autorisation exhaustive de chaque route/action. |
| `SITE-VITRINE-PHASE3.3.2-RBAC-DECISION.md`, `SITE-VITRINE-PHASE3.3.3-RBAC-REVIEW.md` | Reconnaissent approbation finale et allowlist encore ouvertes; Phase 3.3.3 conclut NO-GO. | Cohérents avec le constat que les décisions globales ne sont pas toutes finalisées/appliquées. |

Extraits bruts `[B3]` : `État : document prêt à la validation du responsable métier`; `DECISION-003 = EN ATTENTE`; `MANAGER_READ_TABLES` ne contient que `stats_journalieres`. Conclusion bornée : mappings techniques DECISION-001 et principe DECISION-004 sont documentés comme validés; matrice métier complète par table/action : **NON ÉTABLI / EN ATTENTE**.

## C. Écrans frontend

### Navigation et clients

`src/App.tsx` est une SPA à état `view`, `dashPage`, `publicPage`; la commande `rg -n 'react-router|BrowserRouter|createBrowserRouter|<Routes' package.json src` ne retourne aucune ligne. Les sorties de parsing `[C1]` donnent **20 entrées `dashboardPages`**, **15 `publicPages`**, **54 fichiers source `.ts/.tsx` non-test sous `src/pages`**, **5 fichiers de test sous ce répertoire**. Les écrans Login/Forgot/Reset, accueil employé et vérification attestation ont des branches/imports spéciaux hors des deux maps.

`src/api/client.ts` contient un `ApiClient` local avec `fetch`; `src/api/generated/client.ts` utilise aussi directement `fetch` pour ses opérations générées (227 occurrences `const res = await fetch(`); `src/lib/llm/nvidia-client.ts` est l’unique fichier Axios repéré. Ainsi, **3 mécanismes HTTP source identifiés** (ApiClient/fetch, client Orval/fetch, Axios) et **17 fichiers TS/TSX** contiennent des appels `fetch`/Axios; les appels externes ne sont pas tous des clients locaux EGS. `tableClient` et `dbClient.service` sont deux façades de compatibilité, pas deux transports réseau indépendants : le code legacy délègue à la couche API/table.

Le scan statique établit **17 composants sur les 35 maps principales** qui référencent directement `dbClient.service` ou `tableClient`. Un scan plus large trouve 20 fichiers `.tsx` sous `src/pages`, enfants/onglets inclus. L’usage indirect via hooks/contexte peut augmenter le nombre; nombre transitif complet : **NON ÉTABLI**.

### Pages mappées

L’état ne prouve pas le parcours complet en production. `PARTIEL` signifie mapping et/ou client/route/test de tranche observé; `NON ÉTABLI` signifie qu’aucune preuve de workflow propre à cette page n’a été relevée. `FONCTIONNEL PROUVÉ` : **0** page avec preuve E2E complète.

| Page / entrée SPA | Module | API/client déclaré ou repéré | État et preuve |
|---|---|---|---|
| dashboard | Tableau de bord | `dbClient.service` / repositories; routes `/api/v1/dashboard*` | PARTIEL — mapping + client; test E2E page NON ÉTABLI |
| clients | Clients | `clientsRepository`; backend `/api/v1/clients` | PARTIEL — test `src/pages/Clients.test.ts` (7 tests du run antérieur); E2E NON ÉTABLI |
| projets | Projets | `dbClient.service` | PARTIEL — mapping/repository; workflow E2E NON ÉTABLI |
| immobilier | Immobilier | `apiClient` + `dbClient.service`; contrats, paiements, propriétés | PARTIEL — code lié; test E2E NON ÉTABLI |
| foncier | Foncier | page → composants/hooks, dont `FoncierContainer` et couche legacy indirecte | PARTIEL — test `Foncier.test.tsx` (3) et test villages (3); E2E DB/API NON ÉTABLI |
| catalogue-lots | Catalogue | `dbClient.service` / `tableClient` | PARTIEL — mapping; E2E NON ÉTABLI |
| fournitures | Fournitures | `dbClient.service` / repositories | PARTIEL — mapping; E2E NON ÉTABLI |
| finances | Finances | `dbClient.service`; backend `/api/v1/finance` | PARTIEL — code route; parcours authentifié finance skippé faute fixture TOTP isolé |
| employes | Employés | `dbClient.service` | PARTIEL — mapping; E2E NON ÉTABLI |
| utilisateurs | Utilisateurs | `apiClient` + `dbClient.service` | PARTIEL — mapping; E2E NON ÉTABLI |
| fournisseurs | Fournisseurs | `dbClient.service` | PARTIEL — test `Fournisseurs.test.ts` (6); E2E NON ÉTABLI |
| documents | Documents | client/route exacts NON ÉTABLIS; dossier route v1 Documents absent | NON ÉTABLI — page mappée ne prouve pas le contrat API |
| taches | Tâches | `apiClient`, `/api/v1/tasks` | PARTIEL — mapping et route; E2E NON ÉTABLI |
| statistiques | Statistiques | `dbClient.service` / repositories | PARTIEL — mapping; correspondance table/API NON ÉTABLIE |
| parametres | Paramètres | `apiClient`, appel observé `/settings/audit` | PARTIEL — mapping; scénario complet NON ÉTABLI |
| codex-assistant | Assistant Codex | client direct de page NON ÉTABLI; TODO log viewing dans `src/lib/assistant-egs/agents.ts:661` | NON ÉTABLI pour la fonctionnalité de log indiquée par TODO |
| site-editor | Site Vitrine | `apiClient` et consommateurs `/tables` repérés dans le code associé | PARTIEL — code câblé; toutes les actions API E2E NON ÉTABLIES |
| media | Médias | `apiClient` + `dbClient.service` | PARTIEL — routes et helpers; E2E UI complet NON ÉTABLI |
| registre | Registre visiteurs | `apiClient` + `dbClient.service` | PARTIEL — mapping/code; E2E NON ÉTABLI |
| leads | Leads | `dbClient.service` / repositories | PARTIEL — route/scoring code; workflow E2E NON ÉTABLI |
| home | Vitrine | `tableClient` | PARTIEL — map + appel; rendu/data réel NON ÉTABLI |
| about | Vitrine | client direct NON ÉTABLI | PARTIEL — composant/mapping seulement |
| services | Vitrine | client direct NON ÉTABLI | PARTIEL — composant/mapping seulement |
| immobilier public | Vitrine | `apiClient` | PARTIEL — appel déclaré; rendu/data NON ÉTABLI |
| foncier public | Vitrine | client direct NON ÉTABLI | PARTIEL — composant/mapping seulement |
| lotissement | Vitrine | composant via wrapper App | PARTIEL — map; endpoint/rendu E2E NON ÉTABLI |
| btp-construction | Vitrine | composant via wrapper App | PARTIEL — map; endpoint/rendu E2E NON ÉTABLI |
| realisations | Vitrine | wrapper composant; héritage API NON ÉTABLI | PARTIEL — mapping uniquement |
| temoignages | Vitrine | wrapper composant | PARTIEL — mapping; source réelle NON ÉTABLIE |
| blog | Vitrine | client direct NON ÉTABLI | PARTIEL — composant/mapping seulement |
| contact | Formulaire public | `tableClient` | PARTIEL — appel; soumission réelle E2E NON ÉTABLIE |
| faq | Vitrine | client direct NON ÉTABLI | PARTIEL — composant/mapping seulement |
| mentions-legales | Vitrine | client direct NON ÉTABLI | PARTIEL — composant/mapping seulement |
| verification | Vérification publique | `PublicVerification` mappée; transport métier NON ÉTABLI | PARTIEL — mapping seulement |
| lots | Lots publics | `apiClient` + `tableClient`; inquiry `/site/vitrine-lot-inquiries` | PARTIEL — appel existant; workflow E2E NON ÉTABLI |

Écrans spéciaux repérés hors maps principales : accueil employé (`AccueilEmploye` conditionnel), Login, ForgotPassword, ResetPassword, et `VerificationAttestation` via branche hash. ResetPassword a un fichier de test (2 tests du run précédent); les autres workflows E2E de ces écrans : **NON ÉTABLIS**. Les cinq fichiers de test page observés sont Clients, Foncier, FoncierVillages, Fournisseurs et ResetPassword; dans le run Vitest antérieur ils font partie des **37 fichiers / 131 tests passés**. Ce sont des preuves de tranches de tests, pas des parcours complets navigateur→API→PostgreSQL.

## D. Règles métier dans le code

Les classifications `DB`, `code`, `les deux` portent uniquement sur la règle citée, pas sur un workflow complet.

| Domaine / règle constatée | Preuve code (commande `rg -n`, fichier:ligne) | Couche DB déjà inventoriée | Conclusion bornée |
|---|---|---|---|
| Finance — direction entrée/sortie, montant strictement positif, date opération, devise ISO, conversion vers XOF; `INCONNU` verrouillé | `backend/alembic/versions/031_contract_v2_products_finance.py:167-226`; trigger cité à `:235`; API `backend/app/api/v1/finance/router.py` | Trigger `trg_finances_contract_guard`; CHECK `ck_finance_type_operation_v2`, `ck_finance_montant_positive_v2`, `ck_finance_devise_v2` (tous NOT VALID pour anciennes lignes, appliqués aux écritures) | **Les deux** pour invariants financiers; valeurs exactes/cas complets E2E NON ÉTABLIS |
| Immobilier V2 — type canonique, compteur année/séquence, titre généré, règles statut/localité et audit des changements/refus | `backend/alembic/versions/032_immobilier_v2_contract.py:84-111, 201-251, 291-410`; handler transitions `backend/app/api/v1/immobilier/properties_router.py` (route `/transition`) | FK `properties.type_bien → immobilier_types_bien.code`; 18 transitions référentielles; CHECK localité/statut; trigger propriété guard/audit; triggers immutabilité audit | **Les deux**; autorisation d’écriture API Admin et règles SQL attestées; workflow utilisateur complet NON ÉTABLI |
| Foncier — références lot/attestation et hiérarchie village→lotissement→îlot→lot | `backend/app/services/foncier.py:31,45,111-228,245-335`; routes `backend/app/api/v1/foncier/router.py` | Contraintes CHECK statut/types attestations/lots dans l’inventaire DB du rapport `LOT1-RAPPORT.md`; pas de trigger dédié Foncier parmi les 6 vérifiés | **Les deux** pour valeurs statut vérifiées; détails métier et toutes les routes NON ÉTABLIS |
| Attestation — routes submit/validate/scan/revoke/sign; update brouillon et génération/téléchargement PDF | `backend/app/api/v1/foncier/router.py:469-529, 608-620`; fonctions service/types comme ci-dessus | CHECK statut/type attestations; règles de transition procédurale SQL trigger : NON ÉTABLI | **Code + CHECK** sur valeurs, transition DB spécifique NON ÉTABLIE; PDF/update sont déclarés mais certains renvoient 501 |
| Leads — conversion payload vers Entity, mapping `nouveau`→`pending`, score calculé/recalculé, suppression soft | `backend/app/api/v1/leads/router.py:102-190, 225-251, 282-334, 391-457`; score `backend/app/services/lead/scoring.py` | Parmi les 18 CHECK inventoriés, aucun CHECK de statut/score Leads recensé; règle DB complémentaire : NON ÉTABLIE | **Code observé**; persistance/règles DB end-to-end NON ÉTABLIES |
| Documents / Médias — normalisation catégorie/tags, contrôle permission par action, soft delete/restore/purge, hash et usages | `backend/app/api/v1/media/router.py:16-38, 128-156, 175-310`; `backend/app/services/media_service.py`; `backend/app/api/storage_files.py` | `media_files` comporte les champs de tombstone/hash; contrainte historique `ck_media_storage` sur `storage_type`; triggers métier dédiés Media parmi les 6 : NON ÉTABLI | **Les deux** sur stockage/états disponibles; logique cycle de vie exécutée par code. Table/route Documents dédiée : NON ÉTABLIE |
| Auth — password hashing, refresh, MFA/TOTP, reset token/expiry/révoquer sessions, limites de tentatives | `backend/app/core/security.py:29-58`; `backend/app/application/user_service.py:65-77,95-204,230-292`; routes `backend/app/api/v1/auth/router.py:62-201` | Tables auth/session/reset/rate-limit présentes dans les modèles; trigger/CHECK métier auth parmi les 6/18 observés : NON ÉTABLI | **Code** pour les algorithmes et flux; schéma stocke états/tokens. Fonctionnement réel complet de reset/MFA en session : NON ÉTABLI |
| Antispam formulaires site | `backend/app/core/antispam.py:8-28`; `backend/app/api/v1/site/router.py:502-566` | Aucun trigger/CHECK correspondant inventorié | **Code seulement**; limite observée 5 soumissions/IP/heure, en mémoire processus; comportement multi-instance/persistant NON ÉTABLI |

Preuves brutes `[D1]` : `raise HTTPException(status_code=501, detail="Import CSV non implémenté")`; `...Export CSV non implémenté`; `...Génération PDF non implémentée`; `...Téléchargement PDF non implémenté`; audit CSV/PDF et résolution conflit ont également des réponses 501. Pour finance : extraits migration `IF NEW.montant IS NULL OR NEW.montant <= 0`, `IF NEW.date_operation IS NULL`, et `ck_finance_montant_positive_v2 CHECK (montant > 0)`. Pour antispam : sortie `maximum=5`, `window_seconds=60 * 60`.

## E. Fonctionnalités partielles ou abandonnées

Aucune conclusion « code mort » n’est tirée. Une référence absente dans un scan statique ne prouve pas une absence d’usage dynamique.

| Élément | Preuve exécutée et sortie brute | Statut prudent |
|---|---|---|
| Foncier import/export CSV | `backend/app/api/v1/foncier/router.py:452-463`; handlers répondent `HTTP 501` | Fonctionnalité déclarée mais non implémentée pour ces opérations |
| Update attestation, PDF attestation, export PDF/CSV audit, résolution de conflit sync | Lignes `:528-529`, `:610-620`, `:715-728`, `:834-835`; réponses `HTTP 501` | Déclarée, non opérationnelle selon handlers observés |
| Sync Foncier status/trigger/queue/cleanup | Lignes `:800-845` marquées TODO; réponses `pending=0`, `synced=0`, `[]`, `deleted=0` | Route renvoie une réponse, mais synchronisation réelle NON ÉTABLIE |
| Modules UI sans API route dédiée | `rg --files backend/app/api/v1` ne trouve aucun routeur Documents; mapping API client contient des endpoints legacy génériques | Contrat dédié NON ÉTABLI; route générique peut être utilisée, succès fonctionnel NON ÉTABLI |
| Routes backend dynamiques | 1 endpoint `/api/v1/rpc/{name}` et 4 routes `/api/v1/tables/{table}[/{row_id}]` | Les noms/actions résolus à l’exécution dépendent d’allowlists/dispatch; inventaire statique seul insuffisant |
| Pages source non importées dans les maps lazy App | Le scan trouve 13 fichiers TSX enfants (sections Paramètres, tabs Immobilier, formulaire registre) hors imports lazy directs | Ce sont probablement des composants enfants; usage dynamique/route propre NON ÉTABLI, aucun statut « mort » |
| `current_user_role` et options historiques | Rapport DB précédent : fonction `SECURITY DEFINER` en base, mentions dans des rapports, pas d’appel runtime/RLS trouvé | Fonction historique à décision de sécurité; suppression/révocation NON AUTORISÉE par cet inventaire |
| TODOs | `rg -l -i 'TODO|FIXME|NotImplemented|XXX|à implémenter' backend/app src ...` touche 12 fichiers, dont 12 TODOs Foncier listés dans la sortie; pattern contient aussi faux positifs comme un placeholder `xxxxxxxx...` | Marqueurs à examiner; nombre de fonctionnalités réellement abandonnées NON ÉTABLI |
| Tests backend conditionnels | `test_finance_api.py` : skipif si fixture TOTP absente; `test_foncier_village_crud.py`: opt-in `EGS_ALLOW_FONCIER_INTEGRATION=1`, DB doit finir `_test`; `test_immobilier_v2_postgres.py`: opt-in `EGS_IMMO_V2_DB_TEST=1`, guard exigé | Raisons documentées par code. Nombre PASS/SKIP par suite dans la sortie conservée : NON ÉTABLI ici; résultat antérieur global `pytest` exit 0 |
| Routes non montées | `backend/app/api/v1/__init__.py` contient 23 `include_router`; l’introspection recense 27 fichiers source de route `/api/v1` (sous-routeurs Immobilier/Leads inclus). Fichier Documents route dédié absent. | Autres fichiers sans route déclarée : usage d’import dynamique NON ÉTABLI, pas classés morts |

`backend/app/main.py` monte aussi `storage_files_router` hors `/api/v1`; l’introspection y trouve deux routes. Le scan de routes/documents n’a pas exécuté les workflows et ne conclut pas qu’une route distante ou frontend fonctionne.

## F. Questions pour le commanditaire

1. `DECISION-003` est encore EN ATTENTE : quel périmètre objet/lignes pour Agent (`employe`) et Gestionnaire, table par table, et quelles preuves d’approbation doivent faire foi ?
2. Confirmez-vous que les niveaux UI `gerant`, `secretaire`, `ouvrier`, `visiteur` sont des rôles métier voulus, ou des valeurs historiques d’`access_level` ? Où leur attribution est-elle gouvernée ?
3. La politique centrale `/tables` ne permet qu’une lecture de `stats_journalieres` au Gestionnaire/Admin; certains documents décrivent 34 lectures Gestionnaire et CRUD Admin. Quelle décision et quel artefact sont la référence, sachant que la matrice `SITE-VITRINE-RBAC-DECISION-FINALE.md` se dit elle-même « prête à validation » ?
4. `admin` doit-il rester bloqué sans `mfa_verified=True` pour les routes qui utilisent `require_admin_user`, et quelle règle métier définit les actions qui utilisent ce guard versus un `require_permission` module/action ?
5. Les GET `/api/v1/site-content`, `/api/v1/settings/frontend`, `/api/v1/site/properties` et `/api/v1/media/brand-assets` sont publics sans guard déclaratif : quels champs/données doivent être publiés ?
6. Quel contrat doit remplacer `/api/v1/documents` ou les endpoints UI `/documents`, `/messages`, `/users/profiles`, `/visites/*`, `/social/posts` quand aucun routeur dédié correspondant n’est monté ?
7. Les routes Foncier TODO qui renvoient 501 ou des valeurs vides/zéro sont-elles des fonctionnalités à conserver/finir, ou des routes de compatibilité à retirer ultérieurement ? Aucune décision n’est prise ici.
8. Quel comportement attendu pour la fonction DB `current_user_role()` et les limites antispam en mémoire en environnement multi-instance ?
9. Quel niveau de preuve utilisateur final est attendu pour qu’une page passe de PARTIEL à FONCTIONNEL PROUVÉ (test UI isolé, API intégrée, PostgreSQL, ou parcours E2E complet) ?
10. Le client généré Orval (227 appels fetch) doit-il être maintenu comme client HTTP local concurrent de `ApiClient`, ou régénéré/configuré pour partager son transport/authentification ?
11. Les tests financiers et intégrations PostgreSQL Foncier/Immobilier doivent-ils être exécutés dans un environnement de test isolé avec les fixtures TOTP/DB explicitement requises ?

## Registre des preuves brutes

Les identifiants entre crochets dans le rapport renvoient aux commandes réellement exécutées; les extraits sont copiés sans secret ni identifiant personnel.

### [A1] Routes FastAPI

```text
docker exec -i -w /app egs-api python - <<'PY'
# app.main.app; APIRoute; méthode, chemin, source endpoint, graph dependant
PY
TOTAL 238 UNIQUE_METHOD_PATH 238 DUPLICATES 0 SOURCE_FILES 29
V1_ROUTES 231 V1_FILES 27
MOD app/api/v1/foncier/router.py count 59 ...
MOD app/api/v1/media/router.py count 15 ...
UNGUARDED_DECLARATIVE_V1 24
```

### [A2] Compatibilité

Commande : `rg -n -C 3 'LegacyAPIPrefixMiddleware|path.startswith|new_path' backend/app/main.py`.

```text
if path.startswith("/api/") and not path.startswith("/api/v1/") and not path.startswith("/api/attestations"):
    new_path = "/api/v1" + path[4:]
```

### [B1] Backend RBAC et [B2] frontend

Commandes : `nl -ba backend/app/core/authorization.py`; `rg -n 'MANAGER_READ_TABLES|_GENERIC_TABLE_ACTIONS|_EXPORT_ACTIONS|role != "admin"|return True' backend/app/core/authorization.py`.

```text
MANAGER_READ_TABLES = frozenset({"stats_journalieres"})
_GENERIC_TABLE_ACTIONS = frozenset({"read"})
_EXPORT_ACTIONS = frozenset({"export", "EXPORT"})
if role != "admin": return False
return True
```

Commandes : `sed -n '30,90p' src/context/AuthContext.tsx`; `rg -n 'ACCESS_LEVEL_MODULES|resolveAccessLevel|hasAccess' src/context/AuthContext.tsx src/components/Sidebar.tsx`.

```text
admin: ["*"]
ouvrier: ["dashboard", "projets", "taches", "documents", "media", "registre"]
visiteur: ["dashboard", "registre"]
```

### [B3] Rôles base

```text
docker exec -i -u postgres egs-postgres psql -X -U postgres -d egs_local
SELECT role,count(*) FROM public.users GROUP BY role ORDER BY role;
admin           1
employe         2
gestionnaire    1
(3 rows)
```

### [B4] Documents décisions

Commandes : `sed -n '1,5p' SITE-VITRINE-RBAC-DECISION-FINALE.md`; `sed -n '7,13p' RBAC_PHASE_B_DECISIONS_METIER.md`; `sed -n '1,12p' RBAC_PHASE_B4_DECISION_003_A_VALIDER.md`; `rg -n 'GLOBAL PROJECT STATUS|MANAGER_READ_TABLES|stats_journalieres|34 tables' ...`.

```text
État : document prêt à la validation du responsable métier.
DECISION-001 = VALIDÉ
DECISION-003 = EN ATTENTE
MANAGER_READ_TABLES = {"stats_journalieres"}
```

### [C1] Navigation/pages

Commande : script Python en mémoire lisant uniquement `src/App.tsx` et l’arbre `src/pages`.

```text
DASHBOARD_COUNT 20
PUBLIC_COUNT 15
PAGE_SOURCE_FILES 54
PAGE_TEST_FILES 5
```

Commandes : `rg -n 'react-router|BrowserRouter|createBrowserRouter|<Routes' package.json src`; aucune ligne retournée.

### [C2] Clients HTTP / legacy

Commandes :

```text
rg -c 'const res = await fetch\(' src/api/generated/client.ts
rg -l 'fetch\(|axios\.(get|post|put|patch|delete)|axios\(' src --glob '*.{ts,tsx}' --glob '!**/*.test.*' | wc -l
rg -l '\baxios\b' src --glob '*.{ts,tsx}' --glob '!**/*.test.*' | wc -l
```

```text
GENERATED_FETCH_CALLS=227
DIRECT_FETCH_OR_AXIOS_FILES=17
AXIOS_IMPLEMENTATION_FILES=1
PRIMARY_MAP_COMPONENTS=35 DIRECT_LEGACY=17 SOURCE_RESOLVED=35
```

### [C3] Tests pages

Commande : `find src/pages -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | sort`.

```text
5 fichiers : Clients.test.ts, Foncier.test.tsx, FoncierVillages.test.ts, Fournisseurs.test.ts, public/ResetPasswordPage.test.tsx
```

Résultat d’exécution conservé de la passe précédente : `npx vitest run --reporter=basic` → `Test Files 37 passed (37)`; `Tests 131 passed (131)`; `VITEST_EXIT=0`. Backend : commande `pytest -q -rA` → `PYTEST_EXIT=0`; détails PASS/SKIP total : **NON ÉTABLI dans la sortie conservée**.

### [D1] Règles et stubs

Commandes : `rg -n 'type_operation|montant doit|date_operation|devise|taux_change|ck_finance' backend/alembic/versions/031_contract_v2_products_finance.py`; `rg -n 'TODO:|status_code=501|pending=0|synced=0' backend/app/api/v1/foncier/router.py`.

```text
IF NEW.montant IS NULL OR NEW.montant <= 0 THEN ...
IF NEW.date_operation IS NULL THEN ...
ck_finance_montant_positive_v2 CHECK (montant > 0) NOT VALID
raise HTTPException(status_code=501, detail="Import CSV non implémenté")
pending=0
return []
```

### [E1] Skips et TODO

Commandes : `sed -n '15,27p' backend/tests/test_finance_api.py`; `sed -n '18,43p' backend/tests/test_foncier_village_crud.py`; `sed -n '18,28p' backend/tests/test_immobilier_v2_postgres.py`; `rg -n -i 'TODO|FIXME|NotImplemented|XXX|à implémenter' backend/app src ...`.

```text
Finance authenticated-flow tests require the explicit isolated TOTP fixture
Set EGS_ALLOW_FONCIER_INTEGRATION=1 to opt in to PostgreSQL integration tests
set EGS_IMMO_V2_DB_TEST=1 for explicit egs_test checks
```

Les tests, sorties et extraits sont des preuves de ce qui a été lancé/inspecté, pas des permissions de relancer ces suites ou d’accéder à un environnement de production.

## Conclusion et questions restantes

**LOT 1 (inventaire fonctionnel) — TERMINÉ :** routes, rôles, pages, règles, partials, commandes et limites consignés. Le Lot 1 complet reste **NON VALIDÉ**; les questions F doivent être arbitrées avant toute suite. Aucun travail Lot 2 n’a commencé.
