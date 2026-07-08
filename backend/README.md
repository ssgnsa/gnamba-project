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
export DATABASE_URL="postgresql://postgres:password@localhost:5432/egs_local"
```

3. Run migrations:

```bash
alembic upgrade head
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

**POST /api/auth/login**

```json
{
  "email": "admin@egs.local",
  "password": "deadsoulja28@"
}
```

Returns: `{access_token, refresh_token, user}`

**GET /api/auth/me**

- Header: `Authorization: Bearer <token>`
- Returns: `{user}`

**POST /api/auth/refresh**

```json
{
  "refresh_token": "..."
}
```

Returns: `{access_token, refresh_token, user}`

**POST /api/auth/logout**

- Header: `Authorization: Bearer <token>`
- Returns: `{status: "ok"}`

### Users

**POST /api/users**

```json
{
  "email": "user@egs.local",
  "password": "Test123!",
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
alembic upgrade head
```

View migration history:

```bash
alembic history
```

## Architecture Decision

See [ADR 0001](../docs/adr/0001-source-of-truth-fastapi.md) and [ADR 0002](../docs/adr/0002-backend-architecture-target.md) for architectural decisions.

## Environment Variables

| Variable                             | Default                                                 | Description                |
| ------------------------------------ | ------------------------------------------------------- | -------------------------- |
| DATABASE_URL                         | postgresql://postgres:postgres@localhost:5432/egs_local | PostgreSQL connection      |
| LOCAL_AUTH_SECRET                    | egs-local-dev-secret-change-me                          | JWT signing key            |
| LOCAL_AUTH_ACCESS_TOKEN_TTL_SECONDS  | 3600                                                    | Token lifetime (seconds)   |
| LOCAL_AUTH_REFRESH_TOKEN_TTL_SECONDS | 2592000                                                 | Refresh lifetime (seconds) |

## Development Notes

- Dual repository support: in-memory for tests, SQL for production
- JWT-based authentication with access + refresh tokens
- SQLAlchemy 2.0 with async-ready architecture
- Alembic for database versioning
- FastAPI dependency injection for clean code

## Next Steps

1. Implement client/lead modules
2. Integrate MinIO for document storage
3. Add foncier (land management) workflows
4. Migrate frontend AuthContext to use local API
5. Implement remaining business modules
