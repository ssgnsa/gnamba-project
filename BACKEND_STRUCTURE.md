# Architecture du Backend EGS — Sprint 1 (Fondation)

## Vue d'ensemble

Le backend EGS a été refondu selon une architecture modulaire, passant d'un monolithe prototype à une couche métier professionnelle organisée par domaines de responsabilité.

## Structure des répertoires

```
backend/
├── app/
│   ├── api/
│   │   ├── deps/           # Injection de dépendances FastAPI
│   │   │   └── __init__.py → get_auth_service(), get_current_user()
│   │   ├── v1/
│   │   │   ├── auth/       # Authentification (login, me, refresh, logout)
│   │   │   │   └── __init__.py
│   │   │   └── users/      # Utilisateurs (create user)
│   │   │       └── __init__.py
│   │   └── __init__.py     → Agrège les routers v1
│   │
│   ├── core/
│   │   ├── config.py       → Settings centralisées
│   │   ├── security.py     → JWT, hash_password, token validation
│   │   └── __init__.py
│   │
│   ├── services/
│   │   ├── auth_service.py → AuthService (authenticate, refresh, get_current_user, create_user)
│   │   └── __init__.py
│   │
│   ├── repositories/
│   │   ├── user_repository.py → InMemoryUserRepository (phase 1), sera remplacée par SQLAlchemy
│   │   └── __init__.py
│   │
│   ├── models/
│   │   └── __init__.py     → Modèles (SQLAlchemy, à implémenter)
│   │
│   ├── schemas/
│   │   ├── auth.py         → LoginRequest, AuthTokenResponse, etc.
│   │   └── __init__.py
│   │
│   ├── main.py             → Entrée FastAPI, healthcheck, attestation verify
│   └── __init__.py
│
├── tests/
│   └── test_auth_api.py    → Tests d'intégration (3/3 PASS)
│
├── requirements.txt
└── README.md
```

## Principes architecturaux

### 1. Séparation des responsabilités

| Couche           | Responsabilité       | Fichiers                             |
| ---------------- | -------------------- | ------------------------------------ |
| **API Routes**   | Points d'entrée HTTP | `api/v1/{domain}/__init__.py`        |
| **Services**     | Logique métier       | `services/*.py`                      |
| **Repositories** | Accès aux données    | `repositories/*.py`                  |
| **Models**       | Entités persistées   | `models/*.py`                        |
| **Schemas**      | Contrats API         | `schemas/*.py`                       |
| **Core**         | Infrastructure       | `core/config.py`, `core/security.py` |

### 2. Injection de dépendances

Les services sont injectés par FastAPI via `api/deps/__init__.py`. Exemple :

```python
@router.post("/api/auth/login")
def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthTokenResponse:
```

### 3. Gestion des erreurs

Les exceptions métier (`AuthenticationError`, `AuthorizationError`) sont converties en réponses HTTP via `get_http_exception_for_error()`.

## Flux d'authentification actuel

### Scénario 1 : Login

```
POST /api/auth/login (admin@egs.local, deadsoulja28@)
  ↓
LoginRequest validé par Pydantic
  ↓
auth_service.authenticate() appelé
  ↓
user_repository.get_by_email() → retourne l'utilisateur
  ↓
verify_password() valide le hash
  ↓
JWT d'accès et refresh générés
  ↓
AuthTokenResponse retournée au client
```

### Scénario 2 : Refresh Token

```
POST /api/auth/refresh (refresh_token)
  ↓
auth_service.refresh() appelé
  ↓
decode_token() valide et extrait le sub
  ↓
user_repository.get_by_id() récupère l'utilisateur
  ↓
Nouveaux tokens générés
  ↓
RefreshTokenResponse retournée
```

### Scénario 3 : Get Current User

```
GET /api/auth/me (Authorization: Bearer <token>)
  ↓
Authorization header parsé
  ↓
auth_service.get_current_user() appelé
  ↓
decode_token() valide le JWT
  ↓
user_repository.get_by_id() récupère l'utilisateur
  ↓
UserResponse retournée
```

## État des données (Phase 1)

**Actuellement** : `InMemoryUserRepository` stocke les utilisateurs en mémoire.

```python
_users_by_email: dict[str, dict[str, Any]] = {
    "admin@egs.local": {
        "id": "local-admin",
        "email": "admin@egs.local",
        "password_hash": "<hash>",
        "full_name": "Admin Local",
        "role": "admin",
        ...
    }
}
```

**Phase 2** : sera remplacée par un ORM SQLAlchemy + PostgreSQL.

## Configuration

Fichier : `backend/app/core/config.py`

Variables d'environnement :

- `LOCAL_AUTH_SECRET` — clé secrète pour signer les JWT
- `LOCAL_AUTH_ACCESS_TOKEN_TTL_SECONDS` — durée de vie du token d'accès (défaut: 3600s)
- `LOCAL_AUTH_REFRESH_TOKEN_TTL_SECONDS` — durée de vie du token de refresh (défaut: 2592000s)

## Tests

Fichier : `backend/tests/test_auth_api.py`

**Status** : 3/3 PASS ✓

Cas de test :

1. GET /health → {"status": "ok"}
2. POST /api/auth/login + GET /api/auth/me
3. POST /api/users → crée un utilisateur et retourne un token

Exécution :

```bash
cd /home/soma/gnamba-project
.venv/bin/python -m pytest backend/tests/test_auth_api.py -v
```

## Roadmap

### Sprint 2 — Utilisateurs et RBAC

- [ ] Modèles SQLAlchemy pour User, Role
- [ ] Migrations Alembic
- [ ] Repository SQLAlchemy
- [ ] Permissions par rôle

### Sprint 3 — CRM et Leads

- [ ] API `/api/clients`
- [ ] API `/api/leads`

### Sprint 4 — Documents et Médias

- [ ] Intégration MinIO
- [ ] API `/api/documents`

### Sprint 5 — Foncier

- [ ] API `/api/foncier`
- [ ] Workflow d'attestations

### Sprint 6 et plus

- [ ] Finances, Projets, Employés, Fournitures, Immobilier

## Prochaines tâches

1. **Remplacer le repository en mémoire**
   - Ajouter SQLAlchemy + Alembic
   - Créer le modèle `User` SQLAlchemy

2. **Étendre les tests**
   - Tests unitaires des services
   - Tests d'intégration avec la base

3. **Frontend** : migration de [src/context/AuthContext.tsx](../../src/context/AuthContext.tsx)
   - Appeler les nouveaux endpoints `/api/auth/login`, `/api/auth/refresh`
   - Stocker les JWT dans le localStorage
