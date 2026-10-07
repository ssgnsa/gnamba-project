# Lot 2 - Strategie de remplacement Supabase

Date: 2026-07-06
Statut: plan de remplacement, non execute

## Objectif

Definir comment remplacer chaque famille Supabase par l'architecture cible:

React -> FastAPI `/api/v1` -> PostgreSQL/Alembic -> MinIO -> Redis si besoin.

## Matrice de remplacement

| Supabase actuel | Remplacement cible | Priorite | Prealable |
|---|---|---:|---|
| Supabase Auth / GoTrue | JWT FastAPI + refresh tokens + RBAC | P0 | Modele users/roles stable |
| `user_profiles` lie a `auth.users` | Table locale users/profiles geree par FastAPI | P0 | Migration donnees utilisateurs |
| `supabase.from()` frontend | Repositories frontend appelant `/api/v1` | P0/P1 | Routes FastAPI par module |
| `supabase.rpc()` | Services FastAPI transactionnels ou fonctions Postgres gerees Alembic | P0/P1 | Portage RPC critiques |
| Supabase Storage | MinIO + metadata PostgreSQL + API FastAPI | P0/P1 | Provider S3 backend |
| Supabase Edge Functions | Endpoints FastAPI ou workers | P0/P1 | Services metier equivalents |
| Supabase Realtime | WebSocket/SSE FastAPI ou polling + Redis pub/sub | P2 | Besoin realtime confirme |
| RLS Supabase | RBAC FastAPI + contraintes DB + audit | P0 | Politique permissions centralisee |
| Migrations Supabase | Alembic | P0 | Snapshot schema et portage |
| Supabase CLI scripts | Scripts Docker/Alembic/Postgres/MinIO | P1/P2 | Compose cible |
| Kong/PostgREST | Nginx -> FastAPI | P1 | API `/api/v1` complete |
| CSP Supabase domains | CSP API locale + storage local | P2 | Frontend sans appels Supabase |

## Ordre de remplacement recommande

### Phase 1 - Stabiliser les contrats

Objectifs:

- confirmer `/api/v1` comme unique API cible;
- definir les schemas API par module;
- bloquer toute nouvelle utilisation directe de `supabase.from/rpc/storage/functions`.

Fichiers concernes:

- `src/api/client.ts`
- `src/data/**`
- `backend/app/api/v1/**`
- `backend/app/schemas/**`

Validation:

- `rg "supabase\\.from|supabase\\.rpc|supabase\\.storage|supabase\\.functions" src` doit servir de baseline, pas augmenter.
- Les nouvelles routes doivent etre uniquement sous `/api/v1`.

Effort estime: 1 a 2 jours.

### Phase 2 - Auth et utilisateurs

Objectifs:

- remplacer Supabase Auth par JWT FastAPI;
- remplacer `create-user-with-profile`;
- aligner `AuthContext`, login, reset password, profils et roles.

Fichiers concernes:

- `src/context/AuthContext.tsx`
- `src/pages/public/LoginPage.tsx`
- `src/pages/Utilisateurs.tsx`
- `backend/app/api/v1/auth/**`
- `backend/app/api/v1/users/**`
- `backend/app/services/auth_service.py`
- `backend/app/models/user.py`
- `supabase/functions/create-user-with-profile/index.ts`

Risques:

- verrouillage utilisateurs;
- divergence roles;
- perte de session.

Tests:

- login admin;
- refresh token;
- `/api/v1/auth/me`;
- CRUD utilisateur admin;
- refus access non admin.

Effort estime: 3 a 5 jours.

### Phase 3 - Foncier et attestations

Objectifs:

- remplacer RPC foncier critiques;
- remplacer Edge Function `attestation-sign`;
- exposer verification publique via FastAPI;
- garder transactions atomiques.

Fichiers concernes:

- `src/pages/Foncier.tsx`
- `src/hooks/useFoncier*.ts`
- `src/lib/supabase.service.ts`
- `src/lib/foncierOffline.ts`
- `src/lib/attestationVerification.ts`
- `backend/app/api/v1/foncier/**`
- `supabase/functions/attestation-sign/index.ts`
- `supabase/functions/attestation-verify/index.ts`
- migrations foncier dans `supabase/migrations`

Risques:

- generation attestation incorrecte;
- rupture verification publique;
- perte audit historique;
- incoherence lots/villages.

Tests:

- recherche lot;
- creation lot;
- soft delete / restore;
- creation attestation;
- signature;
- verification publique;
- audit.

Effort estime: 5 a 8 jours.

### Phase 4 - Medias, documents et stockage

Objectifs:

- remplacer Supabase Storage par MinIO;
- implementer provider S3;
- migrer metadata `media_files`, `media_usage`, `media_versions`;
- remplacer upload documents/logos.

Fichiers concernes:

- `src/pages/Documents.tsx`
- `src/pages/Media.tsx`
- `src/components/media/**`
- `src/lib/mediaUtils.ts`
- `src/lib/logoUtils.ts`
- `backend/app/services/storage_provider.py`
- `backend/app/api/v1/media/**`
- migrations storage/media Supabase

Risques:

- liens publics casses;
- perte fichiers;
- rollback upload incomplet;
- CSP incorrecte.

Tests:

- upload media;
- generation URL publique;
- remplacement fichier;
- suppression soft/purge;
- logo marque;
- document rattache projet/client.

Effort estime: 4 a 7 jours.

### Phase 5 - Modules metier CRUD

Objectifs:

- remplacer `supabase.from()` dans les pages metier par repositories API;
- couvrir projets, finances, fournisseurs, fournitures, employes, taches, immobilier, visiteurs, site.

Fichiers concernes:

- `src/pages/Projets.tsx`
- `src/pages/Finances.tsx`
- `src/pages/Fournisseurs.tsx`
- `src/pages/Fournitures.tsx`
- `src/pages/Employes.tsx`
- `src/pages/Taches.tsx`
- `src/pages/Immobilier.tsx`
- `src/pages/RegistreVisiteur.tsx`
- `src/pages/admin/SiteEditor.tsx`
- `src/pages/public/**`
- `backend/app/api/v1/**`

Risques:

- regressions CRUD;
- differences de noms de colonnes;
- pagination/filtrage non equivalents.

Tests:

- CRUD par module;
- recherche/filtre;
- permissions;
- affichage dashboard/statistiques.

Effort estime: 8 a 12 jours.

### Phase 6 - Leads, campagnes, notifications

Objectifs:

- remplacer Edge Functions leads/campagnes/notifications;
- remplacer `lead_interactions`, `capture-lead`, `calculate-lead-score`, `send-welcome-message`, `send-payment-notification`.

Fichiers concernes:

- `src/pages/Leads.tsx`
- `src/lib/lead-capture.ts`
- `src/lib/bot-engine.ts`
- `src/lib/social-publish.ts`
- `supabase/functions/capture-lead/index.ts`
- `supabase/functions/calculate-lead-score/index.ts`
- `supabase/functions/send-welcome-message/index.ts`
- `supabase/functions/send-payment-notification/index.ts`

Risques:

- perte capture publique;
- notifications non envoyees;
- scoring divergent.

Tests:

- capture lead publique;
- interaction lead;
- score lead;
- notification paiement;
- campagne bienvenue.

Effort estime: 4 a 6 jours.

### Phase 7 - Realtime et offline

Objectifs:

- remplacer `supabase.channel`;
- remplacer ping Supabase dans le systeme offline;
- definir strategie realtime minimale.

Fichiers concernes:

- `src/hooks/useRealtimePayments.ts`
- `src/offline/network/connectivity.ts`
- `src/offline/sync/sync.engine.v2.ts`
- `supabase/migrations/20260604160000_enable_realtime_rent_payments.sql`

Risques:

- notifications paiement non temps reel;
- offline considere hors ligne a tort.

Tests:

- changement paiement;
- ping API locale;
- reprise apres offline.

Effort estime: 2 a 4 jours.

### Phase 8 - CI/CD, scripts et documentation

Objectifs:

- remplacer workflows Supabase;
- remplacer scripts Supabase par Postgres/Alembic/MinIO;
- nettoyer documentation apres validation.

Fichiers concernes:

- `.github/workflows/**`
- `scripts/**`
- `docs/**`
- `README.md`
- `Dockerfile*`
- `docker-compose*.yml`

Risques:

- perte capacite backup/restore;
- documentation contradictoire;
- deploy non reproductible.

Tests:

- CI frontend/backend;
- validation Compose cible;
- backup PostgreSQL;
- backup MinIO;
- restore test local.

Effort estime: 5 a 8 jours.

## Correspondance par module

| Module | Source Supabase actuelle | Cible |
|---|---|---|
| Auth | `supabase.auth`, GoTrue, `auth.users` | `/api/v1/auth`, JWT |
| Utilisateurs | `user_profiles`, Edge Function create-user | `/api/v1/users` |
| Clients/parties | `parties`, `party_roles`, repositories avec `dbClient` | `/api/v1/parties`, `/api/v1/clients` |
| Projets | `projects` | `/api/v1/projects` |
| Finances | `finances` | `/api/v1/finance` |
| Fournisseurs | `suppliers` | `/api/v1/suppliers` |
| Fournitures | `products` | `/api/v1/products` |
| Employes | `employees` | `/api/v1/employees` |
| Taches | `tasks`, `taches` | `/api/v1/tasks` |
| Immobilier | tables immobilier + Realtime paiements | `/api/v1/immobilier`, WS/SSE si retenu |
| Foncier | `foncier_lots`, RPC, attestations | `/api/v1/foncier/**` |
| Documents | Storage `documents`, table `documents` | `/api/v1/documents`, MinIO |
| Media | Storage `media`, `media_files`, `media_usage`, versions | `/api/v1/media`, MinIO |
| Site public | `site_content`, `site_realisations`, `page_layouts` | `/api/v1/site/**` |
| Leads | `leads`, `lead_interactions`, Edge Functions | `/api/v1/leads/**` |
| Notifications | Edge Functions + OneSignal | worker/API notification |

## Pre-requis avant retrait effectif

- Routes `/api/v1` completes.
- Tests backend par module.
- Tests frontend critiques.
- Migration Alembic couvrant le schema utile.
- Procedure backup PostgreSQL et MinIO.
- Procedure rollback.
- Documentation cible a jour.

## Elements a ne pas supprimer au Lot 2

- `src/lib/supabase.ts`
- `src/lib/legacySupabaseAdapter.ts`
- `src/lib/supabase.service.ts`
- `supabase/migrations/**`
- `supabase/functions/**`
- scripts Supabase backup/sync/monitoring
- workflows Supabase
- variables `.env*`

Ces elements restent necessaires pour comprendre, migrer ou rollback tant que les remplacements ne sont pas testes.

## Feu vert propose pour Lot 3

Lot 3 peut demarrer apres validation de ce Lot 2. Il devra cartographier precisement:

- routes `/api/*`;
- routes `/api/v1/*`;
- consommateurs frontend/backend/tests;
- doublons;
- strategie de consolidation vers `/api/v1`.
