import asyncio
from logging.config import fileConfig
import os
import sys
from pathlib import Path

# Add the runtime project directory to the path so imports work both from the
# repository checkout and from the backend Docker image (/app).
runtime_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(runtime_root))

from sqlalchemy import pool, engine_from_config
from sqlalchemy.engine import Connection
from alembic import context
from alembic.util import CommandError

from app.core.database import Base
from app.core.alembic_version_capacity import CapacityError, validate_capacity
from app.core.alembic_guard import enforce_immo_v2_guard

# Import models to register them with Base.metadata
# This is needed for Alembic autogenerate to work
from app.models import *

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata


# Set SQLAlchemy URL from an explicit environment value only.
sqlalchemy_url = os.getenv("DATABASE_URL")
if not sqlalchemy_url:
    raise CommandError(
        "DATABASE_URL doit être défini explicitement; aucun DSN PostgreSQL "
        "implicite n'est autorisé"
    )
config.set_main_option("sqlalchemy.url", sqlalchemy_url)


def run_migrations_offline() -> None:
    """Offline SQL cannot verify the target version-table capacity."""
    raise CommandError(
        "Les migrations hors ligne sont désactivées tant que la capacité "
        "d'alembic_version ne peut pas être vérifiée sur la base cible. "
        "Préparez la base puis utilisez le chemin en ligne approuvé."
    )


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.StaticPool,
    )

    with connectable.connect() as connection:
        # Mission-scoped guard; the default Alembic behavior remains unchanged.
        enforce_immo_v2_guard(
            connection, enabled=os.getenv("EGS_IMMO_V2_GUARD") == "1"
        )

        # Fail closed before Alembic can create its default VARCHAR(32) table
        # or write a revision identifier that exceeds an existing limit.
        try:
            validate_capacity(connection)
        except CapacityError as exc:
            raise CommandError(str(exc)) from exc

        # The preflight uses SELECTs, which trigger SQLAlchemy autobegin.
        # End that read-only transaction so Alembic owns the migration one.
        if connection.in_transaction():
            connection.rollback()

        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
