"""Run approved online Alembic migrations for a database the caller has backed up."""

from __future__ import annotations

import os
import subprocess
import sys
from urllib.parse import unquote

from sqlalchemy import create_engine, text
from sqlalchemy.exc import ArgumentError
from sqlalchemy.engine import URL, make_url


def _database_url() -> str:
    value = os.getenv("DATABASE_URL", "").strip()
    if not value:
        raise RuntimeError("DATABASE_URL doit être fourni explicitement")
    return value


def _verify_new_host_target(database_url: str) -> URL:
    try:
        target = make_url(database_url)
    except (ArgumentError, TypeError, ValueError) as exc:
        raise RuntimeError("DATABASE_URL n'est pas une URL SQLAlchemy valide") from exc
    if (
        target.get_backend_name() != "postgresql"
        or target.host != "egs-postgres"
        or target.port != 5432
        or target.database != "egs_local"
        or unquote(target.username or "") != "egs_app"
    ):
        raise RuntimeError(
            "Déploiement nouvel hôte refusé: DATABASE_URL doit cibler "
            "egs_app@egs-postgres:5432/egs_local"
        )
    return target


def _verify_database(database_url: str) -> None:
    new_host_target = os.getenv("EGS_DEPLOYMENT_TARGET") == "new-host"
    if new_host_target or os.getenv("EGS_REQUIRE_EMPTY_DATABASE") == "1":
        _verify_new_host_target(database_url)

    engine = create_engine(database_url, pool_pre_ping=True)
    try:
        with engine.connect() as connection:
            is_superuser = connection.execute(
                text(
                    "SELECT rolsuper FROM pg_catalog.pg_roles "
                    "WHERE rolname = current_user"
                )
            ).scalar_one()
            if is_superuser:
                raise RuntimeError(
                    "Le rôle de migration est superutilisateur; rôle applicatif requis"
                )

            if os.getenv("EGS_REQUIRE_EMPTY_DATABASE") == "1":
                existing_tables = connection.execute(
                    text(
                        "SELECT schemaname, tablename FROM pg_catalog.pg_tables "
                        "WHERE schemaname NOT IN ('pg_catalog', 'information_schema') "
                        "ORDER BY schemaname, tablename"
                    )
                ).all()
                if existing_tables:
                    names = ", ".join(
                        f"{schema}.{table}" for schema, table in existing_tables
                    )
                    raise RuntimeError(
                        "Initialisation refusée: la base n'est pas vierge "
                        f"({names}); aucune migration exécutée"
                    )
    finally:
        engine.dispose()


def main() -> int:
    if os.getenv("EGS_BACKUP_VERIFIED") != "1":
        raise RuntimeError("EGS_BACKUP_VERIFIED=1 est requis après vérification d'un backup restaurable")
    if os.getenv("EGS_MIGRATION_APPROVED") != "1":
        raise RuntimeError("EGS_MIGRATION_APPROVED=1 est requis pour confirmer les migrations")

    database_url = _database_url()
    if (
        os.getenv("EGS_DEPLOYMENT_TARGET") == "new-host"
        and os.getenv("EGS_REQUIRE_EMPTY_DATABASE") != "1"
    ):
        raise RuntimeError(
            "EGS_REQUIRE_EMPTY_DATABASE=1 est requis pour le déploiement nouvel hôte"
        )
    _verify_database(database_url)

    commands = (
        (sys.executable, "-m", "alembic", "heads"),
        (sys.executable, "-m", "alembic", "current"),
        (sys.executable, "-m", "app.core.alembic_version_capacity", "--apply"),
        (sys.executable, "-m", "alembic", "upgrade", "head"),
    )
    for command in commands:
        subprocess.run(command, check=True)

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, ValueError) as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
