# EGS Backend — FastAPI + PostgreSQL

Local-first backend for the EGS (Enterprise Gnamba System) platform.

## Quick Start

### Prerequisites

- Python 3.12+
- PostgreSQL 14+
- pip / venv

### Setup

1. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

2. Configure database:

```bash
export DATABASE_URL="postgresql://<utilisateur>:<mot_de_passe>@localhost:5432/egs_local"
```

3. Run migrations:

```bash
python -m app.core.alembic_version_capacity --apply
python -m alembic upgrade head
```

4. Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

## Project Structure

```
app/
├── api/          # HTTP routes
├── core/         # Config, security, database
├── services/     # Business logic
├── repositories/ # Data access
├── models/       # ORM models
└── schemas/      # Pydantic models

alembic/         # Database migrations
tests/           # Unit and integration tests
```

## API Endpoints

### Authentication

**POST /api/v1/auth/login**

```json
{
  "email": "admin@egs.local",
  "password": "<mot_de_passe_fort>"
}
```

Returns: `{access_token, refresh_token, user}`

**GET /api/v1/auth/me**

- Header: `Authorization: Bearer <token>`
- Returns: `{user}`

**POST /api/v1/auth/refresh**

```json
{
  "refresh_token": "..."
}
```

Returns: `{access_token, refresh_token, user}`

**POST /api/v1/auth/logout**

- Header: `Authorization: Bearer <token>`
- Returns: `{status: "ok"}`

### Users

**POST /api/v1/users**

```json
{
  "email": "user@egs.local",
  "password": "<mot_de_passe_fort>",
  "full_name": "User Name",
  "access_level": "employe"
}
```

Returns: `{access_token, refresh_token, user}`

## Running Tests

```bash
pytest backend/tests/ -v
```

Tests use in-memory repositories by default.

## Database Migrations

Create a new migration:

```bash
alembic revision --autogenerate -m "your migration message"
```

Apply pending migrations:

```bash
python -m app.core.alembic_version_capacity --apply
python -m alembic upgrade head
```

View migration history:

```bash
alembic history
```

## Architecture Decision

See [ADR 0001](../docs/adr/0001-source-of-truth-fastapi.md) and [ADR 0002](../docs/adr/0002-backend-architecture-target.md) for architectural decisions.

## Environment Variables

| Variable                             | Default | Description                          |
| ------------------------------------ | ------- | ------------------------------------ |
| DATABASE_URL                         | —       | PostgreSQL connection (required)     |
| LOCAL_AUTH_SECRET                    | —       | JWT signing key (32+ random chars)   |
| EGS_ADMIN_TOTP_SECRET                | —       | Production admin TOTP secret, outside DB/Git |
| EGS_ADMIN_TOTP_USER_ID               | —       | Admin user ID bound to that TOTP secret |
| LOCAL_AUTH_ACCESS_TOKEN_TTL_SECONDS  | 600     | Access token lifetime (seconds)      |
| LOCAL_AUTH_REFRESH_TOKEN_TTL_SECONDS | 604800  | Refresh cookie lifetime (seconds)    |

## Development Notes

- Dual repository support: in-memory for tests, SQL for production
- JWT-based authentication with access + refresh tokens
- SQLAlchemy 2.0 with async-ready architecture
- Alembic for database versioning
- FastAPI dependency injection for clean code

## Next Steps

1. Extend client/lead modules through versioned routers
2. Keep document storage behind the local API
3. Maintain foncier workflows through `/api/v1`
4. Keep frontend AuthContext and repositories on the canonical local API
5. Extend business modules with matching Alembic migrations
