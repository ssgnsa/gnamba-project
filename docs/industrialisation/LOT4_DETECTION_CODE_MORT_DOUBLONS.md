# Lot 4 - Detection du code mort, doublons et artefacts obsoletes

Date: 2026-07-06
Statut: audit lecture seule
Portee: Lot 4 uniquement

## Regles appliquees

- Aucune suppression.
- Aucun renommage.
- Aucune modification fonctionnelle.
- Aucun lancement de serveur.
- Aucun `docker compose up/down`.
- Aucun `supabase db push/reset`.
- Les elements listes sont des candidats a verifier, pas des suppressions autorisees.

## Objectif du lot

Transformer les constats des Lots 1, 2 et 3 en inventaire exploitable des elements morts, redondants, orphelins ou obsoletes:

- code frontend non branche au runtime;
- composants React inutilises;
- services et clients API doublonnes;
- routes FastAPI legacy, prototypes ou orphelines;
- migrations Supabase obsoletes ou concurrentes d'Alembic;
- Docker Compose et Dockerfiles redondants;
- scripts historiques ou dangereux;
- documentation obsolescente ou contradictoire;
- artefacts accidentels presents a la racine.

## Synthese executive

Le Lot 4 confirme que le probleme principal n'est pas seulement du code mort. Le depot contient quatre familles de dette:

1. **Dette runtime active**: fichiers encore branches mais incompatibles avec la cible `/api/v1` et PostgreSQL/Alembic.
2. **Dette legacy conservatoire**: Supabase, Edge Functions, anciennes migrations et workflows encore presents pour transition.
3. **Dette de duplication**: plusieurs clients API, plusieurs stacks Docker, plusieurs strategies Nginx/Traefik/Kong/Filebrowser/MinIO.
4. **Artefacts accidentels**: fichiers racine issus de sorties shell, fragments SQL ou sauvegardes non gouvernees.

Conclusion importante:

```text
La suppression immediate serait risquee.
Le nettoyage doit suivre la migration fonctionnelle, pas la preceder.
```

## Methode d'audit

Commandes non destructives utilisees ou recommandees:

```bash
rg --files
find src -type f
find backend -type f
rg "include_router|APIRouter|@router|@app" backend/app
rg "docker-compose|Dockerfile|nginx" .
rg "supabase|legacySupabaseAdapter|from\\(" src supabase scripts docs
```

Limites:

- Le projet est en worktree tres modifie avec des suppressions et ajouts non attribues a ce lot.
- Les candidats "inutilises" doivent etre confirmes par `npm run typecheck`, `npm run build`, tests et revue fonctionnelle.
- Les pages React sont chargees via navigation state-based dans `src/App.tsx`; un fichier non routeur peut etre actif sans route declarative.

## Classification

| Niveau | Signification | Action autorisee a ce stade |
|---|---|---|
| D0 | Artefact accidentel probable | Inventorier, ne pas supprimer |
| D1 | Doublon structurel confirme | Documenter dependances et ordre de retrait |
| D2 | Code dormant ou peu branche | Confirmer par tests avant suppression future |
| D3 | Legacy actif | Migrer d'abord, nettoyer ensuite |
| D4 | Prototype cible incomplet | Remplacer par implementation durable |

## 1. Artefacts accidentels racine

### Constat

Plusieurs fichiers a la racine semblent provenir de commandes collees, sorties shell, fragments SQL ou etats temporaires.

| Candidat | Niveau | Pourquoi | Risque si conserve | Strategie |
|---|---|---|---|---|
| `, subprocess, textwrap` | D0 | Nom de fichier fragment Python | Pollution repo | Verifier contenu puis supprimer au Lot 6 |
| `-a | grep supabase | head -20` | D0 | Fragment commande shell | Pollution repo | Verifier contenu puis supprimer au Lot 6 |
| `===" && docker-compose ps ...` | D0 | Fragment commande destructive colle | Risque confusion humaine | Isoler/supprimer apres validation |
| `===' && docker images ...` | D0 | Fragment commande shell | Pollution repo | Isoler/supprimer apres validation |
| `AS (` | D0 | Fragment SQL | Pollution repo | Verifier puis supprimer |
| `ce(coalesce(...` et variantes | D0 | Fragments SQL incomplets | Pollution repo | Verifier puis supprimer |
| `e config"` | D0 | Fragment texte | Pollution repo | Verifier puis supprimer |
| `e_db_gnamba-project...` | D0 | Fragment commande DB | Risque fuite/contexte DB | Verifier puis supprimer |
| `er Created:` | D0 | Fragment log | Pollution repo | Verifier puis supprimer |
| `import defaultdict` | D0 | Fragment Python | Pollution repo | Verifier puis supprimer |
| `on, urllib.request` | D0 | Fragment Python | Pollution repo | Verifier puis supprimer |
| `ource_rows AS (` | D0 | Fragment SQL | Pollution repo | Verifier puis supprimer |
| `sword: AdminLocal2026!` | D0 | Fragment secret apparent | Risque securite | Rotation secret si reel, suppression apres validation |
| `tgres" psql ...` | D0 | Fragment commande DB | Risque fuite/contexte DB | Verifier puis supprimer |
| `tty sane` | D0 | Fragment terminal | Pollution repo | Verifier puis supprimer |
| `ubprocess, os` | D0 | Fragment Python | Pollution repo | Verifier puis supprimer |

### Risques

- Fuite de secrets ou d'informations d'exploitation.
- Confusion lors d'un audit ou d'un packaging.
- Inclusion accidentelle dans une image Docker si le contexte build est large.

### Validation future

```bash
file "<nom-du-fichier>"
sed -n '1,80p' "<nom-du-fichier>"
git ls-files --error-unmatch "<nom-du-fichier>"
```

Effort estime: S.

## 2. Frontend - composants et modules dormants

### Composants React candidats

Ces fichiers ne sont pas observes comme importes par le runtime applicatif principal, ou seulement par eux-memes.

| Fichier | Niveau | Diagnostic | Strategie |
|---|---|---|---|
| `src/components/NetworkStatus.tsx` | D2 | Composant non branche observe | Confirmer besoin face a `OfflineIndicator` |
| `src/components/NotificationButton.tsx` | D2 | Non branche observe, logique OneSignal native | Confirmer avec strategie notifications |
| `src/components/filebrowser/FilebrowserIframe.tsx` | D2 | Non branche observe, concurrent de `FileBrowserIntegration` | Arbitrer Filebrowser vs MinIO |
| `src/components/ui/Breadcrumb.tsx` | D2 | Non branche observe | Conserver seulement si convention UI future |
| `src/components/ui/LazyImage.tsx` | D2 | Non branche observe | Remplacer/consolider avec `SafeImage` si inutile |

### Modules utilitaires candidats

| Fichier | Niveau | Diagnostic | Strategie |
|---|---|---|---|
| `src/lib/logger.ts` | D2 | Non importe hors lui-meme | Remplacer par logger unique ou supprimer futur |
| `src/lib/reports.ts` | D2 | Non importe observe | Verifier besoin export/reporting |
| `src/lib/whatsappService.ts` | D2 | Non importe observe | Arbitrer avec notifications/lead capture |
| `src/lib/sms-reminder-service.ts` | D2/D3 | Non importe observe mais depend Supabase | Remplacer par worker/API ou supprimer futur |
| `src/lib/social-publish.ts` | D2/D3 | Non importe observe mais depend Supabase | Migrer si social reste cible |
| `src/lib/bot-engine.ts` | D2/D3 | Non importe observe, logique workflow Supabase | Remplacer par worker FastAPI/n8n ou supprimer |
| `src/lib/lead-api.ts` | D2 | Non importe observe | Fusionner avec `leads.repository` ou service API |
| `src/lib/attestationPdfLogger.ts` | D2/D3 | Non importe observe, depend `supabase.service` | Integrer API attestations ou supprimer futur |
| `src/lib/adminUserCreation.ts` | D2/D3 | Seulement teste observe, logique Edge Function | Remplacer par `/api/v1/users` |
| `src/offline/versioning.ts` | D2 | Non branche observe | Integrer sync V2 ou supprimer futur |

### Domaine/validation candidats

| Fichier | Niveau | Diagnostic | Strategie |
|---|---|---|---|
| `src/domain/foncier/foncier.rules.ts` | D2 | Non importe observe | Integrer dans service foncier cible ou supprimer |
| `src/domain/foncier/foncier.validator.ts` | D2 | Non importe observe | Fusionner avec `src/lib/foncierValidation.ts` |
| `src/domain/leads/leads.rules.ts` | D2 | Non importe observe | Integrer API leads ou supprimer |
| `src/domain/leads/leads.validator.ts` | D2 | Non importe observe | Integrer API leads ou supprimer |

### Risques

- Un composant non importe aujourd'hui peut etre appele par code dynamique non detecte.
- Les tests peuvent couvrir des modules sans qu'ils soient actifs runtime.
- Certains modules representent une architecture cible non terminee.

### Tests de validation futurs

```bash
npm run typecheck
npm run build
npm run test:run
rg "NetworkStatus|NotificationButton|FilebrowserIframe|Breadcrumb|LazyImage" src
rg "bot-engine|social-publish|sms-reminder-service|whatsappService|reports" src
```

Effort estime: M.

## 3. Frontend - doublons structurels

| Sujet | Fichiers | Niveau | Diagnostic | Strategie |
|---|---|---|---|---|
| Clients API | `src/api/client.ts`, `src/services/api/client.ts`, `src/data/client.ts` | D1 | Trois couches d'appel concurrentes | Consolider vers `src/api/client.ts` + services metier |
| Pont Supabase | `src/lib/supabase.ts`, `src/lib/legacySupabaseAdapter.ts`, `src/lib/supabase.service.ts` | D3 | Legacy actif, incompatible self-hosted complet | Migrer par module avant retrait |
| Foncier validation | `src/lib/foncierValidation.ts`, `src/domain/foncier/foncier.validator.ts`, `src/domain/foncier/foncier.rules.ts` | D1/D2 | Deux modeles de validation | Une seule couche domaine/service |
| Offline sync | `src/offline/sync.engine.ts`, `src/offline/sync/sync.engine.v2.ts`, `src/lib/foncierOffline.ts`, `src/lib/manualSyncStore.ts` | D1/D3 | Plusieurs moteurs/sources locales | Choisir un moteur cible apres migration API |
| Media images | `SafeImage`, `LazyImage`, media utils, brand assets | D1/D2 | Recouvrement partiel | Normaliser apres migration media |
| Notifications | `NotificationButton`, `useRealtimePayments`, OneSignal dans `App.tsx`, `whatsappService` | D1/D3 | Plusieurs canaux non unifies | Service notification cible |

## 4. Backend - routes FastAPI orphelines ou prototypes

### Routes legacy non versionnees

| Route/fichier | Niveau | Diagnostic | Strategie |
|---|---|---|---|
| `backend/app/api/v1/auth/__init__.py` (`/api/auth/*`) | D3 | Doublon legacy de `/api/v1/auth/*` | Retirer apres migration consommateurs/tests |
| `backend/app/api/v1/users/__init__.py` (`/api/users*`) | D3 | Doublon legacy de `/api/v1/users*` | Retirer apres migration consommateurs/tests |
| `backend/app/api/v1/settings/__init__.py` (`/api/settings`, `/api/site-content`) | D3/D4 | Backend non aligne frontend `/api/v1/*` | Versionner proprement avant retrait legacy |
| `backend/app/api/v1/media/__init__.py` (`/api/media*`) | D3/D4 | Backend non aligne frontend `/api/v1/media*` | Versionner et connecter stockage cible |
| `backend/app/main.py` (`/api/attestations/verify`) | D3 | Endpoint public non versionne | Conserver temporairement ou alias `/api/v1` |

### Routes prototypes memoire

| Fichier | Niveau | Diagnostic | Strategie |
|---|---|---|---|
| `backend/app/api/v1/projects/__init__.py` | D4 | Store memoire | Remplacer par service/repository PostgreSQL |
| `backend/app/api/v1/employees/__init__.py` | D4 | Store memoire | Remplacer par service/repository PostgreSQL |
| `backend/app/api/v1/suppliers/__init__.py` | D4 | Store memoire | Remplacer par service/repository PostgreSQL |
| `backend/app/api/v1/products/__init__.py` | D4 | Store memoire | Remplacer par service/repository PostgreSQL |
| `backend/app/api/v1/finance/__init__.py` | D4 | Store memoire | Remplacer par service/repository PostgreSQL |
| `backend/app/api/v1/immobilier/__init__.py` | D4 | Store memoire | Remplacer par service/repository PostgreSQL |
| `backend/app/api/v1/foncier/__init__.py` | D4 | Store memoire | Remplacer par service/repository PostgreSQL |

### Backend fichiers candidats dormants

| Fichier | Niveau | Diagnostic | Strategie |
|---|---|---|---|
| `backend/app/application/user_service.py` | D2 | Peu/pas reference observee | Fusionner avec service auth/user cible |
| `backend/app/core/health.py` | D2 | Health defini dans `main.py` | Choisir un seul health module |
| `backend/app/core/init_db.py` | D2 | Bootstrap utilise `seed_system`, pas init direct observe | Confirmer usage ops |
| `backend/app/domain/employee.py` | D2/D4 | Domaine non branche observe | Integrer route employees cible |
| `backend/app/domain/project.py` | D2/D4 | Domaine non branche observe | Integrer route projects cible |
| `backend/app/infrastructure/memory_user_repository.py` | D2/D3 | Memoire legacy probable | Retirer apres PostgreSQL stable |

### Tests de validation futurs

```bash
python -m compileall backend/app
cd backend && pytest
cd backend && alembic history
rg "/api/auth|/api/users|/api/settings|/api/media" src backend/tests
```

Effort estime: L.

## 5. Migrations obsoletes ou concurrentes

### Constat

Le depot contient plusieurs gouvernances schema:

| Zone | Volume observe | Niveau | Diagnostic |
|---|---:|---|---|
| `supabase/migrations/*.sql` | 74 fichiers actifs observes | D3 | Historique schema Supabase actif/legacy |
| `supabase/migrations/.archive/*.sql` | 1 fichier observe | D2/D3 | Archive partielle dans le dossier actif |
| `supabase-migrations/egs/*.sql` | 8 fichiers observes | D2/D3 | Ancienne copie/reference EGS |
| `supabase/manual-migrations/*.sql` | 1 fichier observe | D2/D3 | Migration manuelle hors sequence |
| `backend/alembic/versions/*.py` | 2 fichiers observes | D4 | Cible PostgreSQL/Alembic encore incomplete |

### Doublons/obsolescences probables

| Sujet | Fichiers | Risque |
|---|---|---|
| Foncier attestations | `supabase-migrations/egs/*foncier*`, `supabase/migrations/20260326*`, `20260401*`, `20260404*` | Schema concurrent |
| Immobilier tenants/locataires | `20260402090000*`, `20260404110000*`, `20260405120000*`, `2026040804*`, `20260428000003*`, `20260512*` | Renommages successifs |
| Village logos/storage | `2026050914*` a `2026050918*`, `20260525000001*` | Buckets et policies redondants |
| Media schema/storage | `2026052111*` a `20260524000005*` | Compat columns et buckets historiques |
| Foncier RPC/security | `20260324000000*`, `20260508110000*`, `20260510100000*` | RPC legacy contraire cible FastAPI |
| Debug/fix migrations | `debug_*`, `fix_*`, `verify_*` | Historique correctif non cible Alembic |

### Strategie

- Ne pas supprimer pendant Lot 4.
- Geler `supabase/migrations` comme source historique.
- Construire une baseline Alembic cible au Lot 5/6.
- Une fois PostgreSQL cible valide, archiver les migrations Supabase hors chemin actif.

Tests futurs:

```bash
cd backend && alembic history
cd backend && alembic current
rg "create table|alter table|create policy|create function" supabase/migrations backend/alembic/versions
```

Effort estime: XL.

## 6. Docker Compose, Dockerfiles et Nginx redondants

### Docker Compose

| Fichier | Niveau | Diagnostic Lot 4 | Strategie |
|---|---|---|---|
| `docker-compose.selfhosted.yml` | D4 | Candidat socle local mais incomplet frontend/Nginx/API | Conserver comme base cible |
| `backend/docker-compose.yml` | D4 | Dev backend coherent | Conserver dev backend |
| `docker-compose.prod.secure.yml` | D3/D4 | Prod durcie mais encore Kong/Supabase | Recuperer hardening utile |
| `docker-compose.prod.yml` | D3 | Production historique, utilise par workflow prod | Ne pas supprimer avant CI/CD cible |
| `docker-compose.server.yml` | D3 | Frontend serveur seul, utilise scripts/service | Deprecier apres Compose cible |
| `docker-compose.yml` | D3 | Frontend/Filebrowser, pas ERP complet | Deprecier apres Compose cible |
| `docker-compose.https.yml` | D2/D3 | Traefik concurrent de Nginx | Arbitrer proxy cible |
| `docker-compose.standalone.yml` | D2 | Frontend seul | Supprimer futur si non retenu |
| `docker-compose.filebrowser.yml` | D2 | Filebrowser seul | Arbitrer avec MinIO/Filebrowser |
| `docker-compose.filebrowser.simple.yml` | D2 | Redondant avec precedent | Candidat suppression future |

### Dockerfiles/Nginx

| Fichier | Niveau | Diagnostic | Strategie |
|---|---|---|---|
| `Dockerfile` | D4 | Frontend principal | Conserver jusqu'a Compose cible |
| `Dockerfile.runtime` | D2/D3 | Variante runtime | Fusionner si utile |
| `Dockerfile.standalone` | D2 | Variante standalone | Deprecier si non cible |
| `Dockerfile.simple` | D2 | Variante ancienne/simple | Candidat suppression future |
| `Dockerfile.nofb` | D2 | Variante sans Filebrowser | Candidat suppression future |
| `nginx.conf` | D4 | Nginx frontend principal mais bloque `/api/` | Corriger au lot migration infra |
| `nginx-standalone.conf` | D2/D3 | Utilise par variantes Dockerfile | Fusionner |
| `nginx-simple.conf` | D2 | Lie a Dockerfile.simple | Candidat suppression future |
| `nginx-fixed.conf` | D2 | Correctif historique | Candidat suppression future |
| `nginx.conf.backup`, `nginx.conf.fixed` | D0/D2 | Sauvegardes non gouvernees | Supprimer futur apres verification |

Tests futurs:

```bash
docker compose -f docker-compose.selfhosted.yml config
docker compose -f backend/docker-compose.yml config
docker compose -f docker-compose.prod.secure.yml config
docker compose -f docker-compose.prod.yml config
```

Effort estime: L.

## 7. Scripts inutilises, historiques ou dangereux

### Scripts appeles par `package.json`

Les scripts references par `package.json` existent. Ils ne sont donc pas morts par absence de fichier.

### Scripts candidats obsoletes/historiques

| Famille | Fichiers | Niveau | Diagnostic |
|---|---|---|---|
| Rebuild/fix frontend | `rebuild-*.sh`, `fix-*.sh`, `diagnose-and-fix.sh` | D2/D3 | Correctifs manuels historiques |
| Supabase operations | `reset_supabase.sh`, `cleanup_supabase.sh`, `test_supabase.sh`, scripts `sync-*supabase*` | D3 | Legacy actif a encadrer |
| Migration ad hoc | `fix_migrations.sh`, `temp_reactivate.sh`, `temp_verify_backup.sh` | D2/D3 | Temporaire/historique |
| Deployment multiple | `redeploy.sh`, `startup.sh`, `build-standalone.sh`, `verify-full.sh` | D2/D3 | Recouvre scripts `scripts/deploy.sh` |
| Backup/restore | `restore_from_backup.sh`, `restore-ordered.sh`, `scripts/backup/*` | D3/D4 | Ne pas supprimer sans politique backup |

### Risques

- Certains scripts peuvent etre utilises hors npm par systemd, SSH ou documentation.
- Les scripts Supabase peuvent etre dangereux mais utiles pour recuperation.
- Les scripts backup/restore doivent etre conserves tant qu'aucune procedure cible n'est validee.

Validation future:

```bash
rg "nom-du-script.sh" .
bash -n scripts/*.sh
bash -n *.sh
```

Effort estime: M.

## 8. Documentation obsolete ou contradictoire

### Constat

La documentation racine contient beaucoup de rapports historiques, guides correctifs et resumes de phases. Plusieurs documents pointent encore vers:

- Supabase comme source active;
- Docker Compose historiques;
- deploiement `docker-compose.prod.yml`;
- Filebrowser/Kong/Traefik concurrents;
- anciens correctifs foncier/immobilier.

### Documents a classer avant nettoyage

| Famille | Exemples | Niveau | Strategie |
|---|---|---|---|
| Docs cible | `README.md`, `docs/adr/*`, `docs/industrialisation/*`, `docs/architecture/*` | D4 | Conserver et aligner |
| Docs prod historiques | `DEPLOYMENT_GUIDE.md`, `DEPLOY_PROD.md`, `STANDALONE_DEPLOYMENT.md`, `QWEN.md` | D3 | Reviser apres Compose cible |
| Rapports anciens | `AUDIT_*`, `PHASE*`, `CORRECTIONS_*`, `SESSION_SUMMARY*` | D2/D3 | Archiver hors racine |
| Docs Supabase legacy | `SUPABASE_*`, `DIAGNOSTIC_SUPABASE_LOCAL.md`, `POSTGRES_LOCAL_SETUP.md` | D3 | Garder transition puis archiver |
| `_archive/**` | Nombreux anciens guides | D2 | Conserver comme archive ou externaliser |

Effort estime: L.

## 9. CI/CD obsolete ou contradictoire

| Fichier | Niveau | Diagnostic | Strategie |
|---|---|---|---|
| `.github/workflows/deploy.yml` | D3 | Build local Supabase vars, Node 18, check anti `@supabase/supabase-js` | Aligner FastAPI/local API |
| `.github/workflows/deploy-prod.yml` | D3 | Deploie `docker-compose.prod.yml` historique | Pointer Compose cible apres validation |
| `.github/workflows/deploy-supabase-functions.yml` | D3 | Deploy Edge Function Supabase | Desactiver seulement apres remplacement FastAPI/workers |

Tests futurs:

```bash
npm run lint
npm run typecheck
npm run build
npm run validate:frontend
```

Effort estime: M.

## 10. Dependances npm candidates

### Utilisees observees

| Dependances | Usage observe |
|---|---|
| `lucide-react` | UI extensive |
| `react`, `react-dom` | Runtime |
| `react-onesignal` | `src/App.tsx` |
| `react-turnstile` | `LoginPage` |
| `qrcode` | `Foncier`, `Documents`, generation PDF |
| `dompurify` | `print`, `foncier`, `PublicContact` |
| `zod` | validations domaine |
| `dockerode` | Codex assistant |
| `puppeteer` | generation PDF script |

### Candidates a confirmer

| Dependances | Niveau | Diagnostic |
|---|---|---|
| `docx` | D2 | Pas d'import observe dans `src/scripts/backend` |
| `ws` | D2 | Pas d'import observe hors references textuelles |
| `commander` | D2 | Pas d'import observe, sauf usage futur possible scripts Codex |
| `@resvg/resvg-js` | D2 | Pas d'import observe |

Les devDependencies de build/test/config ne doivent pas etre classees inutiles uniquement par absence d'import applicatif.

Validation future:

```bash
npm ls --depth=0 --omit=optional
rg "from ['\\\"]docx|from ['\\\"]ws|from ['\\\"]commander|@resvg" .
```

Effort estime: S.

## Criteres de validation Lot 4

- Les candidats sont inventories sans suppression.
- Les doublons sont classes par risque et dependances.
- Les routes legacy/prototypes sont separees des routes cibles.
- Les migrations Supabase sont classees comme historique/legacy, pas effacees.
- Les scripts dangereux sont identifies avant execution future.
- Le nettoyage est reporte au Lot 6 apres migration/validation.

## Tests recommandes avant tout nettoyage futur

```bash
npm run typecheck
npm run build
npm run test:run
python -m compileall backend/app
cd backend && pytest
cd backend && alembic history
docker compose -f docker-compose.selfhosted.yml config
docker compose -f backend/docker-compose.yml config
docker compose -f docker-compose.prod.secure.yml config
```

Ne pas executer automatiquement de suppression, reset, prune, db push, db reset, compose down ou compose up dans le cadre du Lot 4.

