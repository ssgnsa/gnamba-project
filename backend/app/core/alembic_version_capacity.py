"""Safely prepare and validate Alembic's PostgreSQL version table.

The version marker is infrastructure metadata, not an application migration.
PostgreSQL TEXT avoids imposing an arbitrary revision identifier length.
"""

from __future__ import annotations

import argparse
import os
import sys
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection


TABLE_NAME = "alembic_version"
COLUMN_NAME = "version_num"


class CapacityError(RuntimeError):
    """The existing Alembic version table is not safe to change implicitly."""


def _relation(connection: Connection) -> dict[str, Any] | None:
    row = connection.execute(
        text(
            """
            SELECT c.oid, n.nspname AS schema_name, c.relkind
            FROM pg_catalog.pg_class AS c
            JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
            WHERE c.oid = pg_catalog.to_regclass(:table_name)
            """
        ),
        {"table_name": TABLE_NAME},
    ).mappings().one_or_none()
    return dict(row) if row else None


def _table_shape(
    connection: Connection, relation: dict[str, Any]
) -> dict[str, Any]:
    columns = connection.execute(
        text(
            """
            SELECT a.attname AS name,
                   t.typname AS type_name,
                   t.typtype AS type_kind,
                   a.attnotnull AS not_null,
                   pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS column_default
            FROM pg_catalog.pg_attribute AS a
            JOIN pg_catalog.pg_type AS t ON t.oid = a.atttypid
            LEFT JOIN pg_catalog.pg_attrdef AS d
                   ON d.adrelid = a.attrelid AND d.adnum = a.attnum
            WHERE a.attrelid = :relation_oid
              AND a.attnum > 0
              AND NOT a.attisdropped
            ORDER BY a.attnum
            """
        ),
        {"relation_oid": relation["oid"]},
    ).mappings().all()

    constraints = connection.execute(
        text(
            """
            SELECT con.contype AS kind,
                   ARRAY(
                       SELECT a.attname
                       FROM unnest(con.conkey) WITH ORDINALITY
                            AS key(attnum, ordinality)
                       JOIN pg_catalog.pg_attribute AS a
                         ON a.attrelid = con.conrelid
                        AND a.attnum = key.attnum
                       ORDER BY key.ordinality
                   ) AS columns
            FROM pg_catalog.pg_constraint AS con
            WHERE con.conrelid = :relation_oid
            ORDER BY con.contype, con.conname
            """
        ),
        {"relation_oid": relation["oid"]},
    ).mappings().all()

    return {
        "columns": [dict(column) for column in columns],
        "constraints": [dict(constraint) for constraint in constraints],
    }


def _validate_shape(shape: dict[str, Any]) -> dict[str, Any]:
    columns = shape["columns"]
    constraints = shape["constraints"]
    if len(columns) != 1 or columns[0]["name"] != COLUMN_NAME:
        raise CapacityError(
            "Structure inattendue: alembic_version doit contenir uniquement "
            "la colonne version_num. Aucune modification effectuée."
        )

    column = columns[0]
    if (
        not column["not_null"]
        or column["column_default"] is not None
        or column["type_kind"] != "b"
        or column["type_name"] not in {"text", "varchar"}
    ):
        raise CapacityError(
            "Structure inattendue pour alembic_version.version_num "
            "(type, nullabilité ou défaut). Aucune modification effectuée."
        )

    primary_keys = [c for c in constraints if c["kind"] == "p"]
    if (
        len(primary_keys) != 1
        or list(primary_keys[0]["columns"]) != [COLUMN_NAME]
        or any(c["kind"] != "p" for c in constraints)
    ):
        raise CapacityError(
            "Structure inattendue: clé primaire ou contraintes "
            "d'alembic_version non conformes. Aucune modification effectuée."
        )
    return column


def validate_capacity(connection: Connection) -> None:
    """Fail closed unless Alembic can store revision identifiers without a cap."""
    relation = _relation(connection)
    if relation is None:
        raise CapacityError(
            "La table alembic_version est absente. Exécutez d'abord le "
            "bootstrap explicite: "
            "python -m app.core.alembic_version_capacity --apply"
        )
    if relation["relkind"] != "r":
        raise CapacityError(
            "alembic_version n'est pas une table ordinaire. "
            "Aucune migration lancée."
        )

    column = _validate_shape(_table_shape(connection, relation))
    if column["type_name"] != "text":
        raise CapacityError(
            "alembic_version.version_num doit être TEXT. Exécutez d'abord "
            "le bootstrap explicite avec "
            "python -m app.core.alembic_version_capacity --apply; "
            "aucune migration lancée."
        )


def prepare_capacity(connection: Connection) -> str:
    """Create or widen the version table within the caller's transaction."""
    relation = _relation(connection)
    preparer = connection.dialect.identifier_preparer

    if relation is None:
        schema = connection.execute(text("SELECT current_schema()")).scalar_one()
        if not schema:
            raise CapacityError(
                "Aucun schéma PostgreSQL courant. Définissez le search_path "
                "avant le bootstrap."
            )
        qualified_table = (
            f"{preparer.quote_schema(schema)}.{preparer.quote(TABLE_NAME)}"
        )
        connection.execute(
            text(
                f"CREATE TABLE {qualified_table} ("
                "version_num TEXT NOT NULL, "
                "CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num))"
            )
        )
        validate_capacity(connection)
        return f"créée en TEXT dans le schéma {schema}"

    if relation["relkind"] != "r":
        raise CapacityError(
            "alembic_version n'est pas une table ordinaire. "
            "Aucune modification effectuée."
        )

    column = _validate_shape(_table_shape(connection, relation))
    if column["type_name"] == "text":
        validate_capacity(connection)
        return "déjà conforme; aucune modification"

    qualified_table = (
        f"{preparer.quote_schema(relation['schema_name'])}."
        f"{preparer.quote(TABLE_NAME)}"
    )
    connection.execute(
        text(
            f"ALTER TABLE {qualified_table} "
            "ALTER COLUMN version_num TYPE TEXT"
        )
    )
    validate_capacity(connection)
    return f"VARCHAR converti en TEXT dans le schéma {relation['schema_name']}"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Prépare la capacité PostgreSQL d'alembic_version."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="crée/convertit alembic_version; sans cette option, inspection seule",
    )
    args = parser.parse_args(argv)

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        parser.error(
            "DATABASE_URL doit être défini explicitement; aucun DSN implicite "
            "n'est accepté pour le bootstrap."
        )

    engine = create_engine(database_url, pool_pre_ping=True)
    try:
        if args.apply:
            try:
                with engine.begin() as connection:
                    action = prepare_capacity(connection)
            except CapacityError as exc:
                print(str(exc), file=sys.stderr)
                return 2
            print(f"alembic_version: {action}")
            return 0

        with engine.connect() as connection:
            try:
                validate_capacity(connection)
            except CapacityError as exc:
                print(str(exc), file=sys.stderr)
                return 1
        print("alembic_version est conforme (TEXT).")
        return 0
    finally:
        engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
