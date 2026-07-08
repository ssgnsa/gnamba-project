# Lot 2 - Inventaire Supabase EGS

Date: 2026-07-06
Statut: audit lecture seule
Portee: Lot 2 uniquement

## Regles appliquees

- Aucune suppression.
- Aucune migration executee.
- Aucun remplacement applique.
- Aucun changement fonctionnel.
- Inventaire des references Supabase avec criticite et strategie de remplacement.

## Synthese executive

Supabase reste present dans toutes les couches historiques du projet:

- frontend React;
- wrappers et adapters de compatibilite;
- migrations SQL et RLS;
- RPC PostgreSQL;
- Storage;
- Realtime;
- Edge Functions;
- Docker/Kong;
- variables d'environnement;
- scripts de backup, sync, monitoring et validation;
- documentation et CI/CD.

Chiffres observes:

| Surface | Volume observe |
|---|---:|
| Fichiers TS/TSX referencant Supabase ou compatibilite | 56 |
| Fichiers TS/TSX avec operations Supabase-like | 37 |
| Migrations SQL dans `supabase/migrations` | 75 |
| Dossiers Edge Functions dans `supabase/functions` | 10 |
| Scripts avec references Supabase | 59 |
| Docs/root docs avec references Supabase | 225 |
| Migrations avec `auth.uid()` / `auth.jwt()` | 25 |
| Migrations avec Storage/buckets | 9 |
| Migrations avec Realtime/publication | 4 |
| Migrations avec fonctions/RPC/security definer | 29 |
| Migrations avec RLS/policies | 40 |

Conclusion Lot 2:

Supabase ne peut pas etre retire par suppression directe. Il doit etre decommissionne par couches, apres remplacement par FastAPI, PostgreSQL/Alembic, JWT/RBAC, MinIO et eventuellement Redis/workers.

## Niveaux de criticite

| Niveau | Definition |
|---|---|
| Critique | Bloque des parcours metier ou l'authentification si retire sans remplacement |
| Eleve | Impacte donnees, fichiers, workflow public ou production |
| Moyen | Impacte outillage, tests, CI/CD ou modules secondaires |
| Faible | Documentation, commentaires, anciens rapports ou references non runtime |

## Inventaire frontend

### Fichiers centraux

| Fichier | Type de reference | Criticite | Strategie |
|---|---|---:|---|
| `src/lib/supabase.ts` | SDK `@supabase/supabase-js`, proxy self-hosted, auth/storage/rpc/functions/channel | Critique | Remplacer par clients FastAPI/MinIO/Realtime local, puis supprimer en Lot 6 |
| `src/lib/legacySupabaseAdapter.ts` | Adapter `from/rpc/functions/storage` vers API locale partielle | Critique | Remplacer par repositories/services dedies, garder pendant transition |
| `src/lib/supabase.service.ts` | Service metier Foncier/RPC/Edge Function | Critique | Migrer vers endpoints FastAPI `/api/v1/foncier`, `/api/v1/attestations` |
| `src/lib/supabaseConfig.ts` | Resolution env Supabase | Eleve | Remplacer par `localApiConfig` / `storageConfig` |
| `src/data/client.ts` | Wrapper interdisant legacy mais expose `dbClient` | Eleve | Remplacer les usages `dbClient.from/rpc` par repositories API |
| `src/api/client.ts` | Client cible `/api/v1`, contient encore compat media/settings | Eleve | Le conserver comme base API unique, corriger routes legacy au Lot 3 |
| `src/services/api/client.ts` | Second client API local | Moyen | Consolider vers `src/api/client.ts` plus tard |

### Fichiers TS/TSX referencant Supabase ou compatibilite

Liste observee:

- `src/App.tsx`
- `src/components/NotificationButton.tsx`
- `src/components/foncier/WorkflowValidation.tsx`
- `src/components/media/MediaDetailModal.tsx`
- `src/components/page-builder/PageBuilder.tsx`
- `src/components/public/PublicPageLayoutRenderer.tsx`
- `src/components/public/PublicSocialWall.tsx`
- `src/data/foncier.repository.ts`
- `src/data/clients.repository.ts`
- `src/data/leads.repository.ts`
- `src/data/tenants.repository.ts`
- `src/hooks/useFoncierAudit.ts`
- `src/hooks/useFoncierData.ts`
- `src/hooks/useFoncierLogic.ts`
- `src/hooks/useFoncierSync.ts`
- `src/hooks/useRealtimePayments.ts`
- `src/lib/attestationPdfLogger.ts`
- `src/lib/attestationVerification.ts`
- `src/lib/bot-engine.ts`
- `src/lib/foncierOffline.ts`
- `src/lib/lead-capture.ts`
- `src/lib/legacySupabaseAdapter.ts`
- `src/lib/logoUtils.ts`
- `src/lib/mediaUtils.ts`
- `src/lib/sms-reminder-service.ts`
- `src/lib/social-publish.ts`
- `src/lib/supabase.service.ts`
- `src/lib/supabase.ts`
- `src/pages/AccueilEmploye.tsx`
- `src/pages/CatalogueLots.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Diagnostic.tsx`
- `src/pages/Documents.tsx`
- `src/pages/Employes.tsx`
- `src/pages/Finances.tsx`
- `src/pages/Foncier.tsx`
- `src/pages/Fournisseurs.tsx`
- `src/pages/Fournitures.tsx`
- `src/pages/Immobilier.tsx`
- `src/pages/Leads.tsx`
- `src/pages/Media.tsx`
- `src/pages/Parametres.tsx`
- `src/pages/Projets.tsx`
- `src/pages/RegistreVisiteur.tsx`
- `src/pages/Statistiques.tsx`
- `src/pages/Taches.tsx`
- `src/pages/Utilisateurs.tsx`
- `src/pages/admin/SiteEditor.tsx`
- `src/pages/public/PublicContact.tsx`
- `src/pages/public/PublicHome.tsx`
- `src/pages/public/PublicLots.tsx`
- `src/pages/public/PublicRealisations.tsx`
- `src/test/FoncierAttestation.test.ts`
- `src/test/FoncierHooks.test.ts`
- tests sous `src/lib/__tests__`

### Operations table `from()`

Tables detectees dans les operations frontend/adapters:

| Table | Occurrences observees | Criticite | Remplacement cible |
|---|---:|---:|---|
| `projects` | 7 | Eleve | `/api/v1/projects` |
| `suppliers` | 4 | Moyen | `/api/v1/suppliers` |
| `products` | 4 | Moyen | `/api/v1/products` |
| `employees` | 4 | Moyen | `/api/v1/employees` |
| `lead_interactions` | 3 | Eleve | `/api/v1/leads/:id/interactions` |
| `tasks` / `taches` | 3 | Eleve | `/api/v1/tasks` |
| `social_posts` | 2 | Moyen | `/api/v1/social-posts` ou service publication |
| `site_realisations` | 2 | Moyen | `/api/v1/site/realisations` |
| `party_roles` | 2 | Critique | Service parties/clients |
| `parties` | 2 | Critique | Service parties/clients |
| `page_layouts` | 2 | Moyen | `/api/v1/site/page-layouts` |
| `media_files` | 2 | Eleve | `/api/v1/media` + MinIO |
| `foncier_lots` | 2 | Critique | `/api/v1/foncier/lots` |
| `finances` | 2 | Eleve | `/api/v1/finance` |
| `documents` | 2 | Eleve | `/api/v1/documents` + MinIO |
| `visiteurs` | 1 | Moyen | `/api/v1/visiteurs` |
| `visites` | 1 | Moyen | `/api/v1/visites` |
| `users` | 1 | Critique | `/api/v1/users` |
| `site_content` | 1 | Moyen | `/api/v1/site-content` |
| `media_versions` | 1 | Eleve | `/api/v1/media/:id/versions` |
| `media_usage` | 1 | Eleve | `/api/v1/media/usage` |
| `media_audit_logs` | 1 | Moyen | Backend audit logs |
| `foncier_villages` | 1 | Critique | `/api/v1/foncier/villages` |
| `foncier_attestation_temoins` | 1 | Critique | `/api/v1/foncier/attestations/:id/temoins` |
| `contact_messages` | 1 | Moyen | `/api/v1/contact-messages` |

### RPC detectees

| RPC | Occurrences | Criticite | Remplacement cible |
|---|---:|---:|---|
| `search_foncier_lots` | 3 | Critique | `GET /api/v1/foncier/lots/search` |
| `soft_delete_foncier_lot` | 3 | Critique | `DELETE /api/v1/foncier/lots/{id}` avec soft delete |
| `restore_foncier_lot` | 3 | Critique | `POST /api/v1/foncier/lots/{id}/restore` |
| `foncier_stats_by_village` | 2 | Eleve | `GET /api/v1/foncier/stats/by-village` |
| `ensure_foncier_hierarchy` | 2 | Critique | Service backend transactionnel |
| `create_foncier_attestation_atomic` | 2 | Critique | `POST /api/v1/foncier/attestations` transactionnel |
| `attach_foncier_attestation_pdf_metadata` | 2 | Eleve | `POST /api/v1/foncier/attestations/{id}/pdf-metadata` |
| `get_funnel_stats` | 1 | Moyen | `GET /api/v1/leads/funnel-stats` |
| `check_foncier_duplicate` | 1 | Eleve | `POST /api/v1/foncier/lots/check-duplicate` |

### Storage, Edge Functions et Realtime cote frontend

| Reference | Occurrences | Criticite | Strategie |
|---|---:|---:|---|
| Bucket `media` | 7 | Eleve | MinIO + `/api/v1/media` |
| Bucket `documents` | 1 | Eleve | MinIO + `/api/v1/documents` |
| Function `attestation-sign` | 2 | Critique | Service FastAPI signature attestation |
| Channel `rent_payments_changes` | 1 | Moyen | WebSocket/SSE FastAPI ou polling controle |

## Inventaire backend FastAPI

Constat:

- aucune dependance Python directe a Supabase n'est declaree dans `backend/requirements.txt`;
- le backend FastAPI utilise PostgreSQL via SQLAlchemy;
- les routes backend incluent deja `/api/v1/*`, mais certaines routes non versionnees existent encore;
- le backend doit devenir le remplacement des usages Supabase, pas une nouvelle couche parallele.

Criticite:

- faible pour dependances Supabase directes backend;
- elevee pour l'ecart fonctionnel entre frontend Supabase et backend FastAPI.

Strategie:

- etendre les repositories/services FastAPI module par module;
- migrer les contrats depuis les operations Supabase vers `/api/v1`;
- porter les fonctions SQL critiques en services transactionnels ou fonctions PostgreSQL gerees par Alembic.

## Inventaire Supabase CLI, config et migrations

### Configuration Supabase

Fichier:

- `supabase/config.toml`

References majeures:

| Section | Etat | Criticite | Strategie |
|---|---|---:|---|
| `[api]` port `54321` | REST/PostgREST local | Critique legacy | Remplacer par FastAPI `8000` puis proxy Nginx |
| `[db]` port `54322`, PostgreSQL 17 | DB Supabase local | Critique historique | Migrer schema vers PostgreSQL cible/Alembic |
| `[realtime] enabled = true` | Realtime Supabase | Moyen | Remplacer par WebSocket/SSE/Redis selon besoin |
| `[storage] enabled = true`, S3 protocol | Storage Supabase | Eleve | Remplacer par MinIO |
| `[auth] enabled = true` | GoTrue/Supabase Auth | Critique | Remplacer par JWT FastAPI/RBAC |
| `[inbucket] enabled = true` | Mail test local | Faible/Moyen | Remplacer par mailer local si necessaire |
| `[studio] enabled = false` | Studio desactive | Faible | Garder archive/config legacy |

### Migrations SQL

Fichiers:

- `supabase/migrations/*.sql`
- `supabase/manual-migrations/*.sql`
- `supabase/migrations/.archive/*.sql`
- `supabase/seed*.sql`
- `supabase/seed/*.sql`

Categories:

| Categorie | Volume | Criticite | Strategie |
|---|---:|---:|---|
| RLS / policies | 40 fichiers | Critique | Traduire en RBAC backend + contraintes DB |
| `auth.uid()` / `auth.jwt()` | 25 fichiers | Critique | Remplacer par user context FastAPI + colonnes audit |
| Fonctions/RPC/security definer | 29 fichiers | Critique | Porter vers Alembic + services transactionnels |
| Storage/buckets | 9 fichiers | Eleve | Migrer buckets vers MinIO + tables media |
| Realtime/publication | 4 fichiers | Moyen | WebSocket/SSE/Redis |

Risque principal:

- les migrations Supabase contiennent aujourd'hui plus de metier que les migrations Alembic. Alembic ne peut devenir source unique qu'apres portage ou snapshot controle.

## Inventaire Edge Functions

| Dossier | Supabase direct | Criticite | Strategie |
|---|---|---:|---|
| `attestation-sign` | `createClient`, Auth, table `foncier_attestations`, RPC audit | Critique | Endpoint FastAPI signe + service audit |
| `attestation-verify` | Deno env, verification publique, pas SDK dominant observe | Critique | Endpoint public FastAPI `/api/v1/attestations/verify` |
| `auto-assign-agent` | Deja partiellement PostgreSQL direct | Moyen | Worker/service FastAPI leads |
| `calculate-lead-score` | `createClient`, table `leads` | Moyen | Service FastAPI score leads |
| `capture-lead` | `createClient`, table `leads`, auth bearer | Eleve | Endpoint public FastAPI capture lead |
| `create-user-with-profile` | Supabase Auth admin + `user_profiles` | Critique | `/api/v1/users` + JWT/RBAC local |
| `send-payment-notification` | Supabase Auth + OneSignal + `properties` | Moyen | Worker notification local/API |
| `send-welcome-message` | `createClient`, campagnes, lead_campagnes, taches | Moyen | Worker campagnes |
| `verify-turnstile` | Pas SDK Supabase principal, CORS Supabase headers | Moyen | Endpoint FastAPI securite formulaire |
| `_shared/db.ts` | PostgreSQL direct helper | Transition | Reutiliser comme reference conceptuelle, pas runtime cible |

## Inventaire Docker, proxy et runtime

| Fichier | Reference Supabase | Criticite | Strategie |
|---|---|---:|---|
| `Dockerfile` | build args `VITE_SUPABASE_MODE`, URL/key local | Eleve | Remplacer par `VITE_LOCAL_API_URL`, `VITE_STORAGE_BASE_URL` |
| `Dockerfile.runtime` | variables Supabase local | Moyen | Normaliser config local API |
| `Dockerfile.standalone` | local/cloud/auto Supabase | Moyen | Deprecier apres Compose cible |
| `Dockerfile.simple`, `Dockerfile.nofb` | variables Supabase cloud/local | Faible/Moyen | Lot 6 apres validation |
| `docker-entrypoint.sh` | substitution Supabase runtime | Eleve | Substitution API locale/storage |
| `docker-compose.yml` | Supabase local vars frontend | Eleve | Compose cible FastAPI |
| `docker-compose.server.yml` | Supabase local vars obligatoires | Eleve | Remplacer par API locale |
| `docker-compose.prod.yml` | Postgres init `supabase/migrations`, Kong | Critique | Remplacer init par Alembic |
| `docker-compose.prod.secure.yml` | Postgres init `supabase/migrations`, vars cloud | Critique | Porter vers Compose cible |
| `docker-compose.standalone.yml` | cle publishable hardcodee par defaut | Eleve | Remplacer/retirer apres migration |
| `nginx.conf`, `public/_headers`, `nginx/**` | CSP Supabase, proxy Kong/API | Moyen/Eleve | CSP API locale, retirer domaines Supabase |
| `kong/kong.yml` | Gateway heritage Supabase/PostgREST | Eleve | Remplacer par Nginx -> FastAPI |

## Inventaire CI/CD

| Workflow | Reference | Criticite | Strategie |
|---|---|---:|---|
| `.github/workflows/deploy.yml` | Supabase version, guard SDK, env build Supabase local | Eleve | CI FastAPI/PostgreSQL/Compose cible |
| `.github/workflows/deploy-prod.yml` | deploy `docker-compose.prod.yml` | Moyen | Pointer Compose cible |
| `.github/workflows/deploy-supabase-functions.yml` | Supabase CLI, secrets, deploy Edge Function | Critique legacy | Geler puis remplacer par deploy backend/workers |

## Inventaire scripts

59 scripts referencent Supabase ou ses variables.

Categories critiques:

| Categorie | Exemples | Criticite | Strategie |
|---|---|---:|---|
| Orchestration Supabase local | `workspace-stack.sh`, `workspace-lib.sh`, `fix-gnamba.sh`, `test_supabase.sh` | Eleve | Remplacer par scripts stack FastAPI/Postgres |
| Migrations Supabase | `verify-migrations.sh`, `apply-migrations.sh`, `sync-supabase-migrations.sh`, `reactivate-migrations.sh` | Critique | Remplacer par Alembic |
| Backup Supabase | `backup-supabase.sh`, `egs-supabase-backup.sh`, `setup-backup-cron.sh`, `verify-backup.sh` | Critique | Backup PostgreSQL + MinIO |
| Sync cloud/local | `sync-simple.sh`, `sync-via-api.sh`, `sync-with-service-role.sh`, `sync-schema-and-data.sh`, `recover-supabase-cloud.sh` | Eleve | Procedure migration ponctuelle, puis archive |
| Monitoring Supabase | `gnamba-monitor.sh`, `monitor.sh`, `monitor-config.env` | Moyen | Monitoring FastAPI/Postgres/MinIO/Redis |
| Validation env | `validate-env.sh`, `validate-prod-deployment.sh`, `validate-frontend-release.sh` | Eleve | Variables locales cibles |
| Edge Functions | `test-edge-function.sh`, deploy helpers | Moyen | Tests endpoints FastAPI |

## Inventaire documentation

La documentation contient de nombreuses references Supabase historiques.

Criticite documentaire:

| Type | Criticite | Strategie |
|---|---:|---|
| ADR 0001/0002 | Faible, utile | Conserver comme source cible |
| Rapports de migration Supabase removal | Moyen | Reclasser en historique |
| Guides operationnels Supabase local | Eleve si utilises en prod | Remplacer par guides self-hosted |
| Audits anciens | Faible/Moyen | Archiver apres Lot 6 |
| Docs foncier/attestation | Eleve | Mettre a jour apres migration endpoints |

## Risques de retrait premature

| Surface | Risque |
|---|---|
| `src/lib/supabase.ts` | Casse beaucoup de modules encore non portes |
| `legacySupabaseAdapter` | Casse le mode transition self-hosted |
| `supabase/migrations` | Perte de schema metier/RLS/RPC non portes vers Alembic |
| Edge Functions attestations | Rupture signature/verification publique |
| Storage media/documents | Perte upload/logo/documents |
| Scripts backup | Perte capacite sauvegarde historique pendant migration |
| CSP/proxy | Rupture acces assets/API existants pendant transition |

## Criteres de validation Lot 2

- Toutes les surfaces Supabase principales sont identifiees.
- Chaque surface a une criticite.
- Chaque surface a une strategie de remplacement.
- Aucun retrait n'est autorise avant Lot 5/6.
- Lot 3 peut cartographier `/api/*` et `/api/v1/*` en sachant quelles routes remplacent Supabase.

## Tests non destructifs recommandes

```bash
npm run typecheck
npm run test:run
cd backend && pytest
rg -n "supabase|SUPABASE_|@supabase|legacySupabaseAdapter" src supabase scripts .github Dockerfile* docker-compose*.yml
rg -n "APIRouter\\(|/api/v1|/api/" backend/app src
```

Ne pas executer:

- `supabase db push`
- `supabase db reset`
- `supabase start/stop` dans le cadre de cet inventaire;
- scripts de sync, backup ou restore;
- migrations Alembic.
