#!/usr/bin/env bash
set -Eeuo pipefail

: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${EGS_DB_APP_PASSWORD:?EGS_DB_APP_PASSWORD is required}"

if [[ ! "${EGS_DB_APP_PASSWORD}" =~ ^[A-Za-z0-9_-]{32,128}$ ]]; then
  printf '[postgres-init] EGS_DB_APP_PASSWORD must be 32-128 URL-safe characters\n' >&2
  exit 1
fi

psql \
  --set=ON_ERROR_STOP=1 \
  --username "${POSTGRES_USER}" \
  --dbname "${POSTGRES_DB}" <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'egs_app') THEN
    CREATE ROLE egs_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '${EGS_DB_APP_PASSWORD}';
  ELSE
    ALTER ROLE egs_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '${EGS_DB_APP_PASSWORD}';
  END IF;
END
\$\$;
ALTER DATABASE "${POSTGRES_DB}" OWNER TO egs_app;
GRANT ALL ON SCHEMA public TO egs_app;
GRANT USAGE, CREATE ON SCHEMA public TO egs_app;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SQL
