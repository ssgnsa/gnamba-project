# EGS — Cartographie du code

**Capture :** 2026-10-07, dépôt `/home/soma/gnamba-project`  
**Statut :** inventaire statique; ne constitue pas une preuve de code mort.

## Stack exécutée

| Couche | Composants identifiés | Point d'entrée / preuve |
| --- | --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind | `src/main.tsx`, `src/App.tsx`, `package.json` |
| Backend API | Python, FastAPI, SQLAlchemy | `backend/app/main.py`, `backend/requirements.txt` |
| Données | PostgreSQL, SQLAlchemy ORM, repositories | `backend/app/core/database.py`, `backend/app/models/` |
| Schéma | Alembic | `backend/alembic/versions/` |
| Pages serveur | Pas d'application Flask/Jinja détectée; un HTML statique existe sous `templates/` | `templates/attestation_villageoise_premium.html` |
| Tests | Pytest backend, Vitest frontend, quelques tests racine | `backend/tests/`, `src/**/*.test.*`, `tests/` |

Comptages indicatifs depuis les chemins suivis : 845 fichiers sous `src/`,
223 sous `backend/`, 59 fichiers de pages frontend, 23 modules `router.py`,
34 fichiers de migration Alembic, 26 fichiers de tests backend, 36 fichiers
de test frontend (tests placés sous `src/`) et trois tests racine.

## Frontend — modules principaux

### Navigation et contextes

- Navigation sans routeur : état applicatif et résolution de chemin dans
  `src/App.tsx`; registre administratif dans `src/components/Sidebar.tsx`.
- Contextes : auth, notifications, settings, contenu CMS, assistant et
  contexte village.
- Couches d'accès API : `src/api/client.ts`, client généré sous
  `src/api/generated/`, repositories `src/data/` et compatibilité
  `src/lib/dbClient.service.ts`.
- Cache/offline : IndexedDB, queue offline, localStorage settings et brouillons.
  Ces caches ne doivent pas être qualifiés de source de vérité sans analyse
  des flux d'écriture/synchronisation.

### Parcours

- ERP : dashboard, utilisateurs, clients, employés, projets, tâches,
  finances, fournitures, fournisseurs, leads, foncier, immobilier, documents,
  médias, statistiques, registre visiteurs et paramètres.
- Immobilier : propriétés, locataires, paiements, contrats et rapports.
- Site public : accueil, services, foncier, immobilier, lots, réalisations,
  blog, FAQ, contact, légal, témoignages et vérification.
- UI partagée : layout, navigation, formulaires, modales, composants visuels,
  page builder/CMS et contrôles d'erreur.
- Capacités transversales : Filebrowser, Ollama direct navigateur, Sentry,
  OneSignal, Turnstile, WhatsApp et mode offline (configuration réelle à
  confirmer).

## Backend — domaines

### API

Les 23 modules de route trouvés : `auth`, `clients`, `dashboard`, `employees`,
`entities`, `finance`, `foncier`, `immobilier`, `leads`, `media`,
`notifications`, `page_layouts`, `products`, `projects`, `rpc`, `settings`,
`site`, `site_content`, `suppliers`, `tables`, `tasks`, `tenants` et `users`.
`main.py` ajoute stockage, compatibilité de préfixe, health/version et routes
de vérification.

### Organisation interne

- `core/` : configuration, sécurité, DB, bootstrap, migrations et santé.
- `domain/` + `application/` : premiers objets et services applicatifs.
- `services/` : métier et intégrations (foncier, immobilier, média, leads,
  settings, storage).
- `repositories/` et `infrastructure/` : accès SQLAlchemy et adaptateurs.
- `models/` : modules d'entités ORM; `schemas/` : contrats Pydantic.
- `alembic/` : historique versionné de schéma.

### Tests présents

Tests backend : auth/password lifecycle, permissions/RBAC, storage/media,
finance, foncier, immobilier, notifications, modules métier, migrations et
schémas. Le test PostgreSQL immobilier est opt-in. Les suites couvrant
l'architecture actuelle devront être validées contre les parcours FastAPI
actuels avant toute suppression.

## Configurations, constructions et scripts

- Deux définitions Compose bornées par rôle : la racine est la pile canonique;
  `backend/docker-compose.yml` est réservé au développement backend local.
- Deux Dockerfiles : frontend statique/Nginx et backend FastAPI.
- Frontend : npm/Vite (`build`, `lint`, `typecheck`, Vitest).
- Backend : requirements pip + Pytest + Alembic.
- Scripts d'exploitation : sauvegardes/restauration, migrations, déploiement,
  audits et validations. Plusieurs scripts de déploiement, de migration et
  de test ne doivent pas être supprimés avant une recherche d'appels
  systemd/cron/CI et validation opérateur.
- Générés ou locaux : `dist`, `node_modules`, `.venv`, `.pytest_cache` et
  rapports de test sont ignorés localement; aucune suppression n'a eu lieu.
- Traces legacy : `_reconcile/` (168 chemins suivis), branches Git multiples,
  bases/fichiers de sauvegarde et documents historiques. Leur utilité est
  inconnue, pas « obsolète » par défaut.

## Constat de gouvernance

Le checkout comporte avant cette cartographie de nombreuses modifications
indexées/non indexées et non suivies. Certaines touchent backend, migrations,
Compose et scripts de déploiement. Aucun travail n'a été réinitialisé ou
remplacé. Les livrables historiques de juin 2026 décrivent Supabase, tandis
que le code et le parcours de redeploiement contrôlé utilisent FastAPI et
PostgreSQL direct. Une migration Flask/Jinja reste hors périmètre de cette
consolidation et nécessiterait une décision d'architecture séparée.

## Limites

Cette carte s'appuie sur les noms, dépendances et références statiques; elle
n'affirme pas qu'un module est utilisé en production ni qu'il est supprimable.
Les journaux et données utilisateurs n'ont pas été lus. Aucune recherche
exhaustive des crontabs de tous les comptes ou appels système n'a été faite,
car les permissions administrateur ne sont pas disponibles.
