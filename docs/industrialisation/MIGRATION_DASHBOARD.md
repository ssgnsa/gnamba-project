# Tableau de bord de migration EGS

Date: 2026-07-06
Statut: suivi actif

## Legende

| Symbole | Sens |
|---|---|
| OK | Termine et valide |
| PARTIEL | En transition |
| TODO | Non demarre |
| BLOQUE | Bloque par dependance |
| NON | Non retire / encore present |

## Etat par module

| Module | API /api/v1 | PostgreSQL | Frontend apiClient | Tests | Legacy retire | Risques | Prochaine PR |
|---|---|---|---|---|---|---|---|
| Auth | OK | OK | PARTIEL | OK backend | NON | `apiService` encore present, Supabase compat conserve | Fusion `apiService` -> `apiClient` |
| Users | OK | OK | PARTIEL | OK backend | NON | routes `/api/users` encore presentes | convertir consommateurs restants |
| Settings | OK | PARTIEL | PARTIEL | OK alias | NON | logique legacy conservee | repository/settings complet |
| Media | PARTIEL | PARTIEL | PARTIEL | OK alias | NON | stockage cible MinIO non finalise | repository/storage provider MinIO |
| ERP CRUD | PARTIEL | PARTIEL | NON | Projects OK backend | NON | stores memoire restants employees/suppliers/products/finance | employees repository PostgreSQL |
| Foncier | PARTIEL | NON | NON | A completer | NON | RPC/adapter/Supabase encore centraux | `foncierService` + API metier |
| Immobilier | PARTIEL | NON | NON | A completer | NON | schemas historiques tenants/locataires | repository immobilier |
| Leads | TODO | NON | NON | A completer | NON | Edge Functions/bot/social legacy | API leads + repository |
| Documents | PARTIEL | PARTIEL | PARTIEL | A completer | NON | Storage Supabase/Filebrowser/MinIO coexistants | API documents/media |
| Notifications | TODO | NON | NON | A completer | NON | OneSignal/Edge Function/Supabase realtime | service notifications |

## Indicateurs courants

Les valeurs ci-dessous doivent etre mises a jour a chaque PR.

| Indicateur | Commande | Etat initial |
|---|---|---|
| Appels Supabase runtime | `rg "legacySupabaseAdapter|supabase\\.from|supabase\\.rpc|functions\\.invoke" src` | 129 occurrences |
| Routes legacy backend | `rg "prefix=\"/api/" backend/app` | 17 occurrences |
| Routes `/api/v1` | `rg "prefix=\"/api/v1" backend/app` | 12 occurrences |
| Stores memoire backend | `rg "_.*_store|memory" backend/app` | 28 occurrences |
| Compose existants | `find . -maxdepth 2 -name 'docker-compose*.yml' -print` | 10 fichiers |
| Tests backend | `.venv/bin/python -m pytest backend/tests -q` | OK Lot 6A, alias `/api/v1` ajoutes en Epic B PR01 |
| Typecheck frontend | `npm run typecheck` | OK au Lot 6A |
| Build frontend | `npm run build` | OK au Lot 6A |
| Compose cible | `docker compose -f docker-compose.selfhosted.yml config` | OK au Lot 6A |

## Journal de decision

| Date | Decision | Reference |
|---|---|---|
| 2026-07-04 | FastAPI + PostgreSQL source de verite | `docs/adr/0001-source-of-truth-fastapi.md` |
| 2026-07-06 | Architecture cible auto-hebergee | `docs/industrialisation/LOT5_ARCHITECTURE_CIBLE_AUTOHEBERGEE.md` |
| 2026-07-06 | Phase 6A compatibilite avant migration metier | `docs/industrialisation/LOT6_EXECUTION_CONTROLEE.md` |
| 2026-07-06 | Gouvernance PR atomiques et criteres de sortie | `docs/industrialisation/LOT7_GOUVERNANCE_MIGRATION.md` |
| 2026-07-06 | Epic B PR01: tests alias `/api/v1` settings/site-content/media | `backend/tests/test_v1_compatibility_aliases.py` |
| 2026-07-06 | Epic C PR01: Projects passe du store memoire a PostgreSQL | `backend/app/repositories/project_repository.py` |

## Prochaine sequence conseillee

1. Epic D - PR 01: fusion progressive `apiService` vers `apiClient`.
2. Epic C - PR 01: remplacer un store memoire simple par repository PostgreSQL.
3. Epic B - PR 02: contrats OpenAPI documentes pour `/api/v1`.
4. Epic F: aucune action avant E2E et migration module terminee.
