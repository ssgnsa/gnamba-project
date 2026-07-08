# Lot 7 - Gouvernance de migration et criteres de sortie

Date: 2026-07-06
Statut: gouvernance active
Portee: toutes les PR de migration industrielle EGS

## Objectif

Transformer les Epics A a G en un plan d'execution controle ou chaque modification possede:

- un perimetre precis;
- des criteres d'entree;
- des criteres de sortie;
- un rollback documente;
- des validations automatiques;
- une tracabilite.

Regle directrice:

```text
La migration precede toujours le nettoyage.
Une PR doit laisser le depot compilable, testable et deployable.
```

## Architecture cible non negociable

```text
Navigateur
  -> Nginx
  -> React/Vite
  -> FastAPI /api/v1
  -> Services
  -> Repositories
  -> PostgreSQL
  -> MinIO
  -> Redis
  -> Ollama optionnel
```

Survivants:

- React;
- Vite;
- FastAPI;
- PostgreSQL;
- Alembic;
- Redis;
- MinIO;
- Nginx;
- Docker Compose cible;
- `apiClient` unique;
- repositories PostgreSQL;
- services metier;
- workers FastAPI.

Non-survivants, a retirer uniquement apres migration et validation:

- Supabase Auth;
- Supabase Storage;
- Supabase RPC;
- Supabase Edge Functions;
- `legacySupabaseAdapter`;
- stores memoire;
- routes legacy;
- Docker Compose historiques;
- Dockerfiles historiques;
- scripts obsoletes;
- documentation contradictoire;
- migrations Supabase actives;
- Kong;
- Traefik.

## 1. Pipeline obligatoire avant fusion

Chaque PR doit passer les controles suivants.

### Frontend

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm run test
```

### Backend

```bash
python -m compileall backend/app
cd backend && pytest
```

### Infrastructure

```bash
docker compose -f docker-compose.selfhosted.yml config
docker compose -f backend/docker-compose.yml config
```

### Securite

```bash
git diff --check
rg -n "(password|secret|token|apikey|api_key|service_role|anon key)" . \
  -g '!node_modules' \
  -g '!dist' \
  -g '!dist-local' \
  -g '!coverage'
npm audit --audit-level=high
```

Une PR qui echoue a une etape ne peut pas etre fusionnee.

## 2. Environnements autorises

EGS ne conserve que trois environnements:

```text
DEV -> STAGING -> PRODUCTION
```

Chaque environnement possede:

- son fichier d'environnement dedie;
- sa base PostgreSQL;
- son stockage MinIO;
- son Redis;
- sa politique de sauvegarde;
- sa procedure de rollback.

| Environnement | Usage | Donnees | Deploiement |
|---|---|---|---|
| DEV | developpement local | jetables ou anonymisees | poste developpeur |
| STAGING | validation pre-production | copie controlee/anonymisee | serveur de validation |
| PRODUCTION | exploitation | donnees reelles | serveur Gnamba |

Regles:

- aucun secret en clair dans Git;
- aucun `.env` reel commite;
- aucune base partagee entre environnements;
- aucun test destructif en production.

## 3. Convention de Pull Request

Format du titre:

```text
Epic D - PR 04 - Migration MediaUploader vers /api/v1/media
```

Chaque PR doit contenir:

- objectif;
- perimetre;
- impact;
- rollback;
- tests executes;
- resultat;
- dette restante.

Un modele obligatoire est fourni dans:

```text
.github/pull_request_template.md
```

## 4. Politique de suppression

Aucune suppression n'est autorisee sans preuve.

Avant suppression:

```bash
rg "<nom>" .
```

Conditions obligatoires:

- 0 consommateur runtime;
- 0 import actif;
- 0 route active;
- 0 test dependant;
- build vert;
- tests verts;
- rollback disponible.

Si `rg` retourne encore un consommateur runtime:

```text
INTERDICTION DE SUPPRIMER.
```

## 5. Politique de migration module

Chaque module suit exactement ce cycle:

```text
Analyse
  -> API /api/v1
  -> Repository
  -> PostgreSQL
  -> Frontend
  -> Tests
  -> Validation
  -> Suppression legacy
```

Ordre de migration:

1. Auth.
2. Users.
3. Settings.
4. Media.
5. ERP.
6. Foncier.
7. Immobilier.
8. Leads.

## 6. Tableau de bord de migration

Le tableau de bord actif est maintenu dans:

```text
docs/industrialisation/MIGRATION_DASHBOARD.md
```

Colonnes obligatoires:

- API;
- PostgreSQL;
- Frontend;
- Tests;
- Legacy retire;
- risques;
- prochaine PR.

## 7. Indicateurs de progression

A chaque fin de PR, relever:

- taux de modules migres;
- nombre de routes legacy restantes;
- nombre d'appels Supabase restants;
- nombre de stores memoire restants;
- nombre de Docker Compose survivants;
- couverture de tests;
- dette technique restante.

Commandes de mesure recommandees:

```bash
rg "legacySupabaseAdapter|supabase\\.from|supabase\\.rpc|functions\\.invoke" src
rg "APIRouter\\(prefix=\"/api/" backend/app
rg "_.*_store|store memoire|memory" backend/app
find . -maxdepth 2 -name 'docker-compose*.yml' -print
```

## 8. Definition du Done module

Un module est termine uniquement lorsque:

- le frontend utilise exclusivement `apiClient` ou un service metier base sur `apiClient`;
- le backend utilise un repository PostgreSQL;
- les migrations sont gerees par Alembic;
- les tests unitaires et integration passent;
- aucune dependance runtime a Supabase ne subsiste;
- aucun store memoire n'est utilise;
- un rollback est documente.

## 9. Definition de fin de projet

La migration EGS est terminee lorsque:

- toutes les fonctionnalites passent par `/api/v1`;
- PostgreSQL est l'unique source de verite;
- Alembic est l'unique systeme de migrations;
- MinIO remplace totalement Supabase Storage;
- Redis gere cache, sessions et files d'attente;
- Supabase est retire du runtime;
- Edge Functions retirees;
- routes legacy retirees;
- stores memoire retires;
- Compose historiques retires ou archives;
- adaptateurs de compatibilite retires;
- tests backend, frontend et E2E verts;
- build reproductible;
- sauvegarde, restauration et rollback valides.

## 10. Comportement attendu de l'agent IA

Avant chaque modification:

1. expliquer le probleme;
2. expliquer la cause;
3. proposer la solution;
4. analyser les impacts;
5. definir le rollback;
6. modifier seulement ensuite.

Chaque intervention produit:

- analyse;
- plan d'action;
- modifications realisees;
- verifications;
- rollback;
- dette restante.

## 11. Criteres d'entree et sortie d'une PR

### Entree

- Epic identifie;
- module identifie;
- perimetre limite;
- rollback possible;
- tests a executer listes;
- dependances connues.

### Sortie

- code compile;
- tests passes;
- documentation mise a jour;
- dashboard mis a jour;
- legacy conserve ou retire avec preuve;
- rollback documente.

