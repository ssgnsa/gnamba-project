# Lot 4 - Registre des candidats au nettoyage

Date: 2026-07-06
Statut: audit lecture seule
Portee: preparation Lot 6, aucune suppression autorisee

## Lecture du registre

| Champ | Sens |
|---|---|
| Priorite | Ordre de traitement futur, pas ordre de suppression immediate |
| Niveau | D0 artefact, D1 doublon, D2 dormant, D3 legacy actif, D4 prototype cible incomplet |
| Effort | S, M, L, XL |
| Blocage | Ce qui doit etre valide avant retrait |

## Registre priorise

| Priorite | Candidat | Niveau | Effort | Blocage avant action | Action future probable |
|---:|---|---|---|---|---|
| 1 | Fichiers racine fragments shell/SQL/Python | D0 | S | Verifier contenu + secret apparent | Supprimer/archiver apres validation |
| 2 | `sword: AdminLocal2026!` | D0 | S | Confirmer si secret reel + rotation | Supprimer et tracer incident si reel |
| 3 | `src/services/api/client.ts` vs `src/api/client.ts` | D1 | M | Stabiliser `/api/v1/auth` et utilisateurs | Fusionner clients API |
| 4 | `legacySupabaseAdapter.ts` | D3 | XL | Plus aucun consommateur Supabase direct | Supprimer apres migration modules |
| 5 | Routes `/api/auth`, `/api/users` | D3 | M | Frontend/tests sur `/api/v1` uniquement | Retirer alias legacy |
| 6 | Routes `/api/settings`, `/api/site-content`, `/api/media` | D3/D4 | L | Exposer equivalents `/api/v1/*` | Deprecier puis retirer |
| 7 | Routes metier stores memoire | D4 | XL | Repositories PostgreSQL operationnels | Remplacer implementation |
| 8 | Supabase Edge Functions | D3 | L | FastAPI/workers equivalents | Archiver/supprimer |
| 9 | `supabase/migrations` | D3 | XL | Baseline Alembic validee + donnees migrees | Archiver hors chemin actif |
| 10 | `supabase-migrations/egs` | D2/D3 | M | Confirmer non utilise par scripts | Archiver/supprimer |
| 11 | `docker-compose.filebrowser.simple.yml` | D2 | S | Decision MinIO/Filebrowser | Supprimer si redondant |
| 12 | `docker-compose.https.yml` | D2/D3 | M | Decision Nginx vs Traefik | Supprimer si Nginx cible |
| 13 | `Dockerfile.simple`, `Dockerfile.nofb` | D2 | S | Dockerfile cible unique | Supprimer |
| 14 | `nginx.conf.backup`, `nginx.conf.fixed` | D0/D2 | S | Verifier non reference | Supprimer |
| 15 | Scripts `temp_*`, `fix_*`, `rebuild-*` | D2/D3 | M | Scripts deploy cible valides | Archiver/supprimer |
| 16 | `.github/workflows/deploy-supabase-functions.yml` | D3 | M | Edge Functions remplacees | Desactiver/supprimer |
| 17 | `src/components/NetworkStatus.tsx` | D2 | S | Confirmer `OfflineIndicator` cible | Supprimer ou brancher |
| 18 | `src/components/NotificationButton.tsx` | D2 | S | Strategie notifications | Supprimer ou brancher |
| 19 | `src/components/filebrowser/FilebrowserIframe.tsx` | D2 | S | Decision Filebrowser | Supprimer ou brancher |
| 20 | `src/components/ui/Breadcrumb.tsx`, `LazyImage.tsx` | D2 | S | Revue UI | Supprimer si non utilises |
| 21 | `src/lib/bot-engine.ts` | D2/D3 | L | Decision n8n/workers/API leads | Migrer ou supprimer |
| 22 | `src/lib/social-publish.ts` | D2/D3 | M | API social cible | Migrer ou supprimer |
| 23 | `src/lib/sms-reminder-service.ts`, `whatsappService.ts` | D2/D3 | M | Notifications cible | Migrer ou supprimer |
| 24 | `src/domain/*/*.validator.ts`, `*.rules.ts` dormants | D2 | M | Architecture domaine cible | Integrer ou supprimer |
| 25 | Docs racine historiques | D2/D3 | L | Nouvelle doc source de verite | Archiver |
| 26 | `docx`, `ws`, `commander`, `@resvg/resvg-js` | D2 | S | Verification imports/usage scripts | Retirer dependencies si confirme |

## Ordre de nettoyage securise futur

1. **Sanitiser le repo**: traiter fichiers accidentels et secrets apparents.
2. **Stabiliser l'API**: aligner frontend/backend sur `/api/v1`.
3. **Migrer les modules Supabase actifs**: foncier, media, leads, ERP CRUD.
4. **Remplacer les stores memoire backend**: repositories PostgreSQL + Alembic.
5. **Consolider Docker/CI**: un Compose cible, un proxy cible, un Dockerfile cible.
6. **Archiver Supabase**: migrations, Edge Functions, scripts et docs legacy.
7. **Nettoyer le frontend dormant**: composants/modules non branches confirmes.
8. **Retirer dependances npm**: seulement apres build/test verts.

## Gates obligatoires avant suppression future

| Gate | Commandes |
|---|---|
| Frontend | `npm run typecheck`, `npm run build`, `npm run test:run` |
| Backend | `python -m compileall backend/app`, `cd backend && pytest` |
| Schema | `cd backend && alembic history`, validation baseline cible |
| Docker | `docker compose -f docker-compose.selfhosted.yml config` |
| Recherche | `rg "<candidat>" .` avant chaque retrait |
| Securite | verifier secrets apparents et rotation si necessaire |

## Non-actions explicites

Les actions suivantes ne sont pas autorisees par le Lot 4:

- supprimer des fichiers;
- deplacer des migrations;
- retirer des dependances;
- modifier les routes;
- fusionner les clients API;
- lancer des migrations;
- lancer `docker compose up/down`;
- nettoyer Git avec `reset`, `checkout`, `clean` ou `prune`.

