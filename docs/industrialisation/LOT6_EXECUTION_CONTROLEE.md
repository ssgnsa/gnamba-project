# Lot 6 - Execution controlee nettoyage et migration

Date: 2026-07-06
Statut: execution demarree
Portee: nettoyage/migration controles apres decisions Lot 5

## Regles d'execution revisees

- Priorite a la reduction du risque runtime.
- Phase 6A: compatibilite uniquement, aucune suppression definitive.
- Phase 6B: migration metier module par module.
- Phase 6C: validation globale puis nettoyage controle.
- Les elements legacy actifs sont migres avant retrait.
- Les routes legacy restent temporairement en alias tant que les consommateurs ne sont pas tous convertis.
- Les secrets fournis oralement ne sont pas ecrits dans le depot.

## Phase 6A - Compatibilite

Objectif: zero regression.

Conserver explicitement:

- routes legacy;
- Supabase;
- anciens Docker Compose;
- `legacySupabaseAdapter`;
- scripts historiques;
- documentation historique.

Actions autorisees:

- ajouter des alias `/api/v1`;
- corriger la compilation TypeScript;
- corriger les imports manquants;
- corriger les exports casses;
- ajouter des tests de compatibilite.

## Actions Lot 6 - Passe 1

### API `/api/v1`

Objectif: reduire les ecarts Lot 3 sans casser l'existant.

Actions:

- ajouter `/api/v1/settings` en alias de la logique settings existante;
- ajouter `/api/v1/site-content` en alias de la logique site content existante;
- ajouter `/api/v1/media/*` en alias de la logique media existante;
- ajouter `/api/v1/auth/reset-password` en alias de `/api/v1/auth/password/reset`.

Routes legacy conservees temporairement:

- `/api/settings`;
- `/api/site-content`;
- `/api/media`;
- `/api/auth/reset-password`.

### Quarantaine artefacts

Objectif: sortir du chemin racine les fichiers accidentels sans perte immediate.

Destination:

```text
_archive/lot6-quarantine-2026-07-06/
```

Resultat passe 1:

- 26 fichiers de fragments/artefacts ont ete deplaces hors racine;
- un `README.md` de quarantaine documente la raison et les regles de restauration;
- aucun fichier applicatif n'a ete supprime.

Note de pilotage:

Cette action est desormais gelee. Elle est consideree comme reversible et ne doit pas etre poursuivie avant la Phase 6C. Si la regle stricte retenue est "aucun deplacement avant validation 6C", restaurer ces fichiers depuis `_archive/lot6-quarantine-2026-07-06/` avant toute PR.

## Phase 6B - Migration metier

Chaque module doit suivre le flux cible:

```text
Frontend
  -> apiClient
  -> FastAPI
  -> Repository
  -> PostgreSQL
```

Ordre recommande:

1. Auth.
2. Users.
3. Settings.
4. Media.
5. ERP CRUD.
6. Foncier.
7. Immobilier.
8. Leads.

Pour chaque module:

- PR atomique;
- rollback documente;
- routes `/api/v1` couvertes;
- frontend sans `supabase.from`;
- repository PostgreSQL;
- tests backend et frontend.

## Phase 6C - Validation et nettoyage

Nettoyage autorise seulement lorsque:

- tous les tests passent;
- le frontend compile;
- les E2E passent;
- migrations Alembic validees;
- sauvegarde PostgreSQL validee;
- rollback teste.

Alors seulement retirer:

- routes legacy;
- Supabase;
- adapter legacy;
- scripts obsoletes;
- Docker Compose historiques;
- docs contradictoires.

### Non traite dans cette passe

- Suppression Supabase;
- migration complete Foncier;
- remplacement complet des stores memoire;
- retrait des dependances npm;
- consolidation Docker complete;
- suppression de workflows CI.

Ces actions restent dependantes des migrations fonctionnelles.

## Verification attendue

```bash
python -m compileall backend/app
npm run typecheck
docker compose -f docker-compose.selfhosted.yml config
```

Si une verification echoue, le Lot 6 doit s'arreter sur correction ciblee, sans nettoyage supplementaire.

## Verification passe 1

| Verification | Resultat | Note |
|---|---|---|
| `python -m compileall backend/app` | OK | Compilation statique backend valide |
| `.venv/bin/python -m pytest backend/tests -q` | OK | 14 tests backend passent |
| `docker compose -f docker-compose.selfhosted.yml config` | OK | Compose cible syntaxiquement valide |
| Inspection routes FastAPI via `.venv/bin/python` | OK | Alias `/api/v1/settings`, `/api/v1/site-content`, `/api/v1/media/*`, `/api/v1/auth/reset-password` presents |
| `npm run typecheck` | OK | Base TypeScript frontend retablie |
| `npm run build` | OK | Build produit dans `dist-local` car `dist` non purgeable |

## Etat courant

Phase 6A est validee techniquement sur les controles statiques disponibles:

- aliases `/api/v1` ajoutes;
- routes legacy conservees;
- Supabase conserve;
- Docker Compose historiques conserves;
- TypeScript frontend OK;
- build frontend OK;
- backend compile;
- tests backend OK.

Decision:

- ne pas poursuivre le nettoyage;
- passer a la roadmap par Epics pour les migrations metier;
- chaque future action doit etre une PR atomique.
