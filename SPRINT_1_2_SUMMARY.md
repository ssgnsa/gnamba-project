# Backend EGS — Sprint 1 & 2 Summary

## Status: Sprints 1 & 2 Complete ✓

### Sprint 1: Modular Architecture ✓

- [x] Refactored backend from monolithic prototype to modular structure
- [x] Separated concerns: API, services, repositories, models, schemas
- [x] Implemented AuthService with JWT support
- [x] Created in-memory user repository
- [x] All tests passing (3/3)

### Sprint 2: SQLAlchemy & Database ✓

- [x] Integrated SQLAlchemy ORM 2.0
- [x] Implemented Alembic migration system
- [x] Created User model with roles and enums
- [x] Added SQLAlchemy-backed repository
- [x] Dual-repository support (memory + SQL)
- [x] Test infrastructure with dependency overrides
- [x] Migration files generated

## Current Architecture

```
backend/
├── alembic/
│   ├── env.py              ← Configured for our models
│   └── versions/
│       └── 001_initial_create_users.py
│
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth/       (login, me, refresh, logout)
│   │   │   └── users/      (create user)
│   │   ├── deps/           (dependency injection + both repos)
│   │   └── __init__.py
│   │
│   ├── core/
│   │   ├── config.py       (settings)
│   │   ├── security.py     (JWT, password hashing)
│   │   └── database.py     (SQLAlchemy engine + session)
│   │
│   ├── services/
│   │   └── auth_service.py (business logic)
│   │
│   ├── repositories/
│   │   ├── user_repository.py              (in-memory)
│   │   └── sqlalchemy_user_repository.py   (SQL-backed)
│   │
│   ├── models/
│   │   └── user.py         (SQLAlchemy ORM)
│   │
│   ├── schemas/
│   │   └── auth.py         (Pydantic schemas)
│   │
│   └── main.py             (FastAPI app)
│
├── tests/
│   ├── conftest.py         (pytest fixtures)
│   └── test_auth_api.py    (3/3 PASS ✓)
│
└── requirements.txt        (fastapi, sqlalchemy, alembic, psycopg2)
```

## Data Flow: Authentication

### Login

```
POST /api/auth/login
  → LoginRequest validated
  → auth_service.authenticate()
    → user_repository.get_by_email()
    → verify_password()
    → issue_token() (JWT access + refresh)
  → AuthTokenResponse
```

### Token Refresh

```
POST /api/auth/refresh
  → RefreshTokenRequest validated
  → auth_service.refresh()
    → decode_token()
    → user_repository.get_by_id()
    → issue_token() (new JWT pair)
  → RefreshTokenResponse
```

### Get Current User

```
GET /api/auth/me
  → Authorization header parsed
  → auth_service.get_current_user()
    → decode_token()
    → user_repository.get_by_id()
  → UserResponse
```

## Repository Pattern

### InMemoryUserRepository

**Current**: Used in tests, keeps users in dict

- `get_by_email(email)` → dict | None
- `get_by_id(user_id)` → dict | None
- `create(payload)` → dict

### SQLAlchemy UserRepository

**For Production**: Backed by PostgreSQL

- Same interface as in-memory
- Uses `Session` from FastAPI dependency
- Enums: `RoleEnum` (admin, gestionnaire, employe, guest)
- Enums: `AccessLevelEnum` (same as RoleEnum)

## Database Schema (Alembic)

**Migration**: `001_initial_create_users`

Table: `users`

```
id                 (String, PRIMARY KEY)
email              (String, UNIQUE)
full_name          (String)
password_hash      (String)
role               (Enum: admin|gestionnaire|employe|guest)
access_level       (Enum: admin|gestionnaire|employe|guest)
poste              (String, nullable)
department         (String, nullable)
phone              (String, nullable)
is_active          (Integer, default 1)
created_at         (DateTime with TZ)
updated_at         (DateTime with TZ)
```

## Configuration

### Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
  - Default: `postgresql://postgres:postgres@localhost:5432/egs_local`
- `LOCAL_AUTH_SECRET` — JWT signing key
  - Default: `egs-local-dev-secret-change-me`
- `LOCAL_AUTH_ACCESS_TOKEN_TTL_SECONDS` — access token lifetime
  - Default: `3600` (1 hour)
- `LOCAL_AUTH_REFRESH_TOKEN_TTL_SECONDS` — refresh token lifetime
  - Default: `2592000` (30 days)

### Running Migrations

```bash
cd backend
alembic upgrade head
```

## Tests

**Status**: 3/3 PASS ✓

```bash
cd /home/soma/gnamba-project
.venv/bin/python -m pytest backend/tests/test_auth_api.py -v
```

Tests use **in-memory repository** via dependency overrides in `conftest.py`.

## Dependencies Added

```
sqlalchemy==2.0.23
alembic==1.13.1
psycopg2-binary==2.9.9
```

## Next Phase: Dependency Setup & Frontend Migration

Before continuing with Sprint 3 (clients/leads), the system needs:

1. **PostgreSQL running** (Docker container)

   ```bash
   docker run -d -e POSTGRES_PASSWORD=postgres \
     -p 5432:5432 postgres:16
   ```

2. **Run migrations**

   ```bash
   cd backend && alembic upgrade head
   ```

3. **Seed admin user** (optional)
   - Alembic post-migration script or script for initial data

4. **Frontend migration** (AuthContext.tsx)
   - Switch from Supabase Auth to `/api/auth/login`
   - Store JWT in localStorage
   - Call `/api/auth/refresh` on app load

## What's Ready

✓ Backend architecture is production-ready for local deployment
✓ Modular services and repositories
✓ SQLAlchemy ORM integration
✓ Alembic migrations system
✓ JWT authentication
✓ Test infrastructure
✓ Dependency injection

## What's Next

⏳ PostgreSQL integration
⏳ Client/lead modules
⏳ Document/media storage (MinIO)
⏳ Frontend AuthContext migration
⏳ Business modules (foncier, finances, projects, etc.)
