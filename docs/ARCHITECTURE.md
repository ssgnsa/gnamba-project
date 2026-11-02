# Architecture projet EGS / GNAMBA

## 1. Cadre de référence

Le dépôt montre une architecture cible partiellement consolidée :

- Frontend React + TypeScript + Vite
- Backend FastAPI versionné sous `/api/v1`
- PostgreSQL + Alembic comme source de vérité de schéma
- Authentification locale et JWT côté backend
- Navigation ERP gérée en état local côté frontend

## 2. Source de vérité actuelle observée

### Frontend
- Point d’entrée principal : `src/App.tsx`
- Contexte d’authentification : `src/context/AuthContext.tsx`
- Contexte de paramètres : `src/context/SettingsContext.tsx`
- Client HTTP central : `src/api/client.ts`
- Services historiques / transition : `src/lib/dbClient.service.ts`, `src/data/tableClient.ts`

### Backend
- Point d’entrée : `backend/app/main.py`
- Routers versionnés : `backend/app/api/v1/__init__.py`
- Configuration globale : `backend/app/core/config.py`
- Base de données : `backend/app/core/database.py`
- Migrations : `backend/alembic/`

### Base de données
- PostgreSQL est la source de vérité attendue selon l’architecture conservée.
- Les migrations Alembic sont la gouvernance du schéma de façon prioritaire.

## 3. Contrat fonctionnel observé

### Interface applicative
- L’application ERP est une SPA sans routeur dédié.
- La navigation est pilotée par état local dans `App.tsx`.
- Les écrans métier sont incrémentés selon une map de pages dashboard et une map de pages publiques.

### API
- Le backend expose des endpoints sous `/api/v1`.
- Les routes business sont regroupées par module.
- La compatibilité legacy est gérée par middleware de réécriture dans `backend/app/main.py`.

### Authentification
- Le backend impose `LOCAL_AUTH_SECRET` et vérifie la présence d’une clé forte.
- Le frontend prend en charge un refresh et un stockage local de token pour la session auto-hébergée.
- Les niveaux observés côté code sont : `admin`, `gerant`, `secretaire`, `ouvrier`, `visiteur`, `gestionnaire`, `employe`.

## 4. Conflits d’architecture identifiés

- Plusieurs fichiers d’environnement coexistent.
- Plusieurs variantes de Docker Compose existent.
- Plusieurs couches de compatibilité API coexistent entre client historique et API versionnée.
- Les services legacy et les services de transition subsistent dans le code.

## 5. Cible de conception

La cible proposée pour la refonte est la suivante :

1. Une seule application backend FastAPI.
2. Une seule API versionnée `/api/v1`.
3. Une seule source de vérité de schéma PostgreSQL + Alembic.
4. Un seul frontend consommateur de cette API.
5. Une seule stratégie d’authentification.
6. Une seule configuration environnementale officielle.

## 6. Principe d’intervention

La refonte doit passer par :

- audit factuel
- spécification consolidée
- schéma cible
- implémentation backend
- implémentation frontend
- build et validation
- nettoyage contrôlé
- seeds
- tests

Aucun lot ne doit être initié sans validation du lot précédent.
