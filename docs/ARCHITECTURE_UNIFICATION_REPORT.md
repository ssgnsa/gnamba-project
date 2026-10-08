# Rapport d’unification architecturale EGS

## Statut

Ce document constitue la cartographie et l’audit de la consolidation. La cible
retenue pour le redeploiement contrôlé est l’architecture actuellement
implémentée : React/Vite → FastAPI `/api/v1` → PostgreSQL/Alembic. Une
migration Flask/Jinja n’est pas engagée par cette consolidation et reste hors
périmètre tant qu’une décision d’architecture distincte n’est pas approuvée.

## 1. Cartographie complète

### 1.1 Frontend

- Framework principal : React 18 + TypeScript + Vite + Tailwind.
- Point d’entrée applicatif : [src/App.tsx](src/App.tsx)
- Navigation : état local dans l’application, sans routeur dédié.
- Contexte applicatif : [src/context/AuthContext.tsx](src/context/AuthContext.tsx), [src/context/SettingsContext.tsx](src/context/SettingsContext.tsx), [src/context/SiteContentContext.tsx](src/context/SiteContentContext.tsx).
- Pages métier : [src/pages](src/pages)
- Service API unifié : [src/api/client.ts](src/api/client.ts)
- Adaptateur de transition table : [src/data/tableClient.ts](src/data/tableClient.ts)

### 1.2 Backend

- Framework principal : FastAPI.
- Point d’entrée : [backend/app/main.py](backend/app/main.py)
- Configuration : [backend/app/core/config.py](backend/app/core/config.py)
- Base de données : [backend/app/core/database.py](backend/app/core/database.py)
- Routers versionnés : [backend/app/api/v1/**init**.py](backend/app/api/v1/__init__.py)
- Modules implémentés : auth, users, settings, media, projects, employees, suppliers, products, finance, immobilier, foncier.
- Référentiel SQLAlchemy : [backend/app/repositories](backend/app/repositories)

### 1.3 Base de données

- Système cible principal : PostgreSQL.
- Gouvernance de migrations : Alembic via [backend/alembic](backend/alembic)
- Modèles et seed initiaux : [backend/app/models](backend/app/models)
- Initialisation système : [backend/app/core/bootstrap.py](backend/app/core/bootstrap.py)

### 1.4 Docker et infrastructure

- Compose principal : [docker-compose.yml](docker-compose.yml)
- Compose backend de développement : [backend/docker-compose.yml](backend/docker-compose.yml)
- Conteneurs/services observés : frontend web, production web, filebrowser.
- Déploiement CI/CD : [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

### 1.5 Documentation et tests

- Documentation centrale : [README.md](README.md) et [backend/README.md](backend/README.md)
- Rapports d’architecture : [docs/architecture](docs/architecture)
- Tests backend : [backend/tests](backend/tests)
- Tests frontend : [src/lib/**tests**](src/lib/__tests__)

## 2. Diagramme logique

```mermaid
graph TD
  A[React/Vite frontend] --> B[App shell + contexts]
  B --> C[Pages métier]
  C --> D[Service API unifié]
  D --> E[FastAPI /api/v1]
  E --> F[Service layer / repositories]
  F --> G[PostgreSQL]
  E --> H[Auth / JWT / RBAC]
  C -.transition.-> I[Table adapter]
  I --> D
```

## 3. Architecture actuelle

### 3.1 État observé

- Le frontend consomme l’API locale via `src/api/client.ts`; quelques écrans
  passent encore par `src/data/tableClient.ts`, adaptateur de transition.
- L’authentification et les contextes applicatifs utilisent l’API locale
  versionnée.
- Les modules métier sont exposés sous `/api/v1` et leur schéma de référence
  est gouverné par Alembic.

### 3.2 Architecture cible retenue

- Une seule API de référence : FastAPI versionnée sous /api/v1.
- Un frontend React consommant strictement cette API via un client unique.
- Une base PostgreSQL unique gouvernée par Alembic.
- Une seule source de vérité pour l’authentification, les modules métier, la configuration et les règles d’accès.

## 4. Forces

- Backend FastAPI déjà présent et fonctionnel.
- Documentation architecturale déjà existante et relativement détaillée.
- Service API front unifié déjà en place, avec `src/data/tableClient.ts`
  conservé uniquement comme adaptateur de transition.
- Tests backend en place et stables.
- Base de migrations Alembic présente.

## 5. Faiblesses et risques

- Frontend encore couplé à des adaptateurs nommés legacy dans quelques pages,
  mais aucun SDK Supabase n’est présent dans les dépendances runtime.
- Une compatibilité entrante réécrit encore les anciens préfixes vers `/api/v1`;
  les routeurs actifs sont versionnés sous `/api/v1`.
- Dépendance mixte entre `src/api/client.ts`, repositories métier et adaptateur
  table; elle doit être réduite progressivement.
- Risque de divergence entre l’API backend et les écrans frontend tant que la migration n’est pas complète.
- Plusieurs fichiers de configuration et de déploiement coexistent, ce qui augmente la complexité opérationnelle.

## 6. Dette technique observée

- Doublons de surface API.
- Doublons de documents et scripts de déploiement.
- Coexistence de plusieurs chemins de configuration environnementale.
- Modules partiellement migrés côté frontend et backend.
- Dépendance à l’adaptateur table historique alors que le client API local est
  déjà disponible.

## 7. Duplications identifiées

- Compatibilité de préfixe legacy à retirer après validation des consommateurs;
  les routes de référence restent sous `/api/v1`.
- Documentation multiple sur l’architecture, la migration et le déploiement.
- Scripts de maintenance et d’ops redondants dans la racine.
- Plusieurs fichiers Docker Compose et variantes de déploiement.
- Modèles et services métier potentiellement dupliqués entre le frontend et le backend.

## 8. Modules et statut

### Modules déjà couverts côté backend

- Authentification
- Utilisateurs
- Paramètres
- Médias
- Projets
- Employés
- Fournisseurs
- Produits
- Finance
- Immobilier
- Foncier

### Modules encore à consolider

- Tâches
- Leads
- Documents
- Site vitrine
- Contact public
- Campagnes / notifications / workflow métier avancés

## 9. Endpoints API observés

### Backend existants

- /health
- /api/v1/auth/\*
- /api/v1/users/\*
- /api/v1/settings/\*
- /api/v1/site-content/\*
- /api/v1/media/\*
- /api/v1/projects/\*
- /api/v1/employees/\*
- /api/v1/suppliers/\*
- /api/v1/products/\*
- /api/v1/finance/\*
- /api/v1/immobilier/\*
- /api/v1/foncier/\*

## 10. Variables d’environnement et configuration

Fichiers et zones à surveiller :

- [/.env](.env)
- [/.env.example](.env.example)
- [/.env.local.example](.env.local.example)
- [/.env.server.example](.env.server.example)
- [backend/.env.example](backend/.env.example)

Les principales variables concernées sont liées à l’API locale, à PostgreSQL et
à la sécurité JWT. Les anciennes variables Supabase ne font plus partie du
contrat de déploiement self-hosted.

## 11. Validation actuelle

Validations déjà exécutées dans ce workspace :

- tests backend : pytest sur les suites auth, v1, media et modules métier
- état des routes backend : observé via la structure de [backend/app/api/v1/**init**.py](backend/app/api/v1/__init__.py)
- état du frontend : observé via [src/App.tsx](src/App.tsx) et [src/context/AuthContext.tsx](src/context/AuthContext.tsx)

## 12. Positionnement de la phase suivante

La phase suivante ne doit pas supprimer ni réécrire arbitrairement. Elle doit :

1. consolider les routes autour de `/api/v1` uniquement ;
2. réduire la dépendance aux adaptateurs table côté frontend ;
3. aligner les modules métier sur PostgreSQL/Alembic comme source de vérité ;
4. valider chaque migration par tests avant toute suppression.

## 13. Recommandation de gouvernance

Avant toute suppression, exiger les points suivants :

- traçabilité de chaque dépendance ;
- validation par tests ;
- documentation synchronisée ;
- aucune route ou import abandonné sans remplacement explicite.
