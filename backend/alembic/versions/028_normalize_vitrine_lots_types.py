"""Normalize the public vitrine lot characteristics column.

Revision ID: 028_normalize_vitrine_lots_types
Revises: 027_fix_public_site_schema_drift

The earlier revisions create ``id`` as UUID, the price/surface values as
NUMERIC and timestamps as timezone-aware. This revision preserves those types
and converts the JSON characteristics added by 027 into the array expected by
the ORM. Non-array JSON is rejected before conversion so existing data is not
silently discarded.
"""

from alembic import op
import sqlalchemy as sa


revision = "028_normalize_vitrine_lots_types"
down_revision = "027_fix_public_site_schema_drift"
branch_labels = None
depends_on = None


def _assert_postgresql(bind):
    if bind.dialect.name != "postgresql":
        raise RuntimeError("028 requires PostgreSQL; no changes made")


def _column_type(bind, column_name):
    return bind.execute(
        sa.text(
            """
            SELECT pg_catalog.format_type(a.atttypid, a.atttypmod)
            FROM pg_catalog.pg_attribute AS a
            WHERE a.attrelid = 'public.vitrine_lots'::regclass
              AND a.attname = :column_name
              AND a.attnum > 0
              AND NOT a.attisdropped
            """
        ),
        {"column_name": column_name},
    ).scalar_one_or_none()


def upgrade() -> None:
    bind = op.get_bind()
    _assert_postgresql(bind)

    if not sa.inspect(bind).has_table("vitrine_lots", schema="public"):
        raise RuntimeError("028 expected public.vitrine_lots; no changes made")

    pk = sa.inspect(bind).get_pk_constraint("vitrine_lots", schema="public")
    if pk.get("constrained_columns") != ["id"]:
        raise RuntimeError("028 expected PRIMARY KEY (id); no changes made")

    expected_types = {
        "id": {"uuid"},
        "superficie": {"numeric(10,2)"},
        "prix": {"numeric(12,2)"},
        "created_at": {"timestamp with time zone"},
        "updated_at": {"timestamp with time zone"},
        "tags": {"character varying[]", "text[]"},
        "caracteristiques": {"json", "jsonb", "character varying[]", "text[]"},
    }
    for column_name, allowed_types in expected_types.items():
        actual_type = _column_type(bind, column_name)
        if actual_type not in allowed_types:
            raise RuntimeError(
                f"028 preflight rejected public.vitrine_lots.{column_name}: "
                f"expected one of {sorted(allowed_types)}, found {actual_type!r}; "
                "no conversion attempted"
            )

    characteristics_type = _column_type(bind, "caracteristiques")
    if characteristics_type in {"character varying[]", "text[]"}:
        return

    if characteristics_type == "json":
        invalid_count = bind.execute(
            sa.text(
                """
                SELECT count(*)
                FROM public.vitrine_lots
                WHERE caracteristiques IS NOT NULL
                  AND json_typeof(caracteristiques) <> 'array'
                """
            )
        ).scalar_one()
        non_string_count = bind.execute(
            sa.text(
                """
                SELECT count(*)
                FROM public.vitrine_lots AS lot
                CROSS JOIN LATERAL json_array_elements(
                    CASE
                        WHEN json_typeof(lot.caracteristiques) = 'array'
                        THEN lot.caracteristiques
                        ELSE '[]'::json
                    END
                ) AS item(value)
                WHERE json_typeof(item.value) <> 'string'
                """
            )
        ).scalar_one()
    else:
        invalid_count = bind.execute(
            sa.text(
                """
                SELECT count(*)
                FROM public.vitrine_lots
                WHERE caracteristiques IS NOT NULL
                  AND jsonb_typeof(caracteristiques) <> 'array'
                """
            )
        ).scalar_one()
        non_string_count = bind.execute(
            sa.text(
                """
                SELECT count(*)
                FROM public.vitrine_lots AS lot
                CROSS JOIN LATERAL jsonb_array_elements(
                    CASE
                        WHEN jsonb_typeof(lot.caracteristiques) = 'array'
                        THEN lot.caracteristiques
                        ELSE '[]'::jsonb
                    END
                ) AS item(value)
                WHERE jsonb_typeof(item.value) <> 'string'
                """
            )
        ).scalar_one()

    if invalid_count or non_string_count:
        raise RuntimeError(
            "028 preflight rejected public.vitrine_lots.caracteristiques: "
            f"{invalid_count} non-array value(s), {non_string_count} non-string "
            "element(s); no conversion attempted"
        )

    json_type = "json" if characteristics_type == "json" else "jsonb"
    array_elements_function = (
        "json_array_elements_text"
        if json_type == "json"
        else "jsonb_array_elements_text"
    )
    op.execute(
        sa.text(
            f"""
            CREATE FUNCTION public._egs_028_json_array_to_varchar(value {json_type})
            RETURNS character varying[]
            LANGUAGE SQL IMMUTABLE STRICT
            AS $$
                SELECT COALESCE(
                    array_agg(element),
                    ARRAY[]::character varying[]
                )
                FROM {array_elements_function}(value) AS item(element)
            $$
            """
        )
    )
    op.execute(
        sa.text(
            """
            ALTER TABLE public.vitrine_lots
            ALTER COLUMN caracteristiques TYPE character varying[]
            USING public._egs_028_json_array_to_varchar(caracteristiques)
            """
        )
    )
    op.execute(
        sa.text(
            f"DROP FUNCTION public._egs_028_json_array_to_varchar({json_type})"
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    _assert_postgresql(bind)
    characteristics_type = _column_type(bind, "caracteristiques")
    if characteristics_type not in {"character varying[]", "text[]"}:
        raise RuntimeError(
            "028 downgrade expected an array in public.vitrine_lots.caracteristiques; "
            "no conversion attempted"
        )

    op.execute(
        sa.text(
            """
            ALTER TABLE public.vitrine_lots
            ALTER COLUMN caracteristiques TYPE json
            USING to_json(caracteristiques)
            """
        )
    )
