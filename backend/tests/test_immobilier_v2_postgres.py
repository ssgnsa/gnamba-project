"""Explicit egs_test-only trigger, audit, and concurrency verification.

Run with EGS_IMMO_V2_DB_TEST=1, EGS_IMMO_V2_GUARD=1 and DATABASE_URL explicitly
targeting egs_test. Every non-concurrency case runs in a rolled-back transaction.
The concurrency fixture is deleted by its exact UUID after its committed race.
"""

from __future__ import annotations

import os
import re
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.engine import make_url


if os.getenv("EGS_IMMO_V2_DB_TEST") != "1":
    pytest.skip("set EGS_IMMO_V2_DB_TEST=1 for explicit egs_test checks", allow_module_level=True)

if os.getenv("EGS_IMMO_V2_GUARD") != "1":
    pytest.fail("EGS_IMMO_V2_GUARD=1 is required for DB tests")

url = make_url(os.environ["DATABASE_URL"])
if url.database != "egs_test":
    pytest.fail("IMMOBILIER V2 GUARD: base interdite — seule egs_test est autorisée")

engine = create_engine(url, pool_pre_ping=True)


@pytest.fixture
def connection():
    conn = engine.connect()
    tx = conn.begin()
    actual = conn.execute(text("SELECT current_database()")).scalar_one()
    assert actual == "egs_test"
    try:
        yield conn
    finally:
        tx.rollback()
        conn.close()


def set_actor(conn, actor="test-admin", role="admin"):
    request_id = str(uuid4())
    conn.execute(
        text("""
            SELECT set_config('app.immo_actor_id', :actor, true),
                   set_config('app.immo_actor_role', :role, true),
                   set_config('app.immo_request_id', :request_id, true)
        """),
        {"actor": actor, "role": role, "request_id": request_id},
    )
    return request_id


def insert_property(conn, *, commune="Cocody", ville="Abidjan", status="disponible"):
    request_id = set_actor(conn)
    row = conn.execute(
        text("""
            INSERT INTO public.properties (
              reference, titre, type_bien, adresse, commune, ville, statut
            ) VALUES (
              'CLIENT-REFERENCE', 'Titre fourni par le client', 'villa',
              'Rue de test', :commune, :ville, :status
            ) RETURNING id, reference, titre, statut, publier_vitrine,
                      titre_fige_le, deleted_at
        """),
        {"commune": commune, "ville": ville, "status": status},
    ).one()
    return row, request_id


EXPECTED_TRANSITIONS = {
    ("creation", "disponible"), ("creation", "en_travaux"),
    ("disponible", "en_vente"), ("disponible", "louee"),
    ("disponible", "en_travaux"), ("disponible", "retiree"),
    ("en_vente", "vendue"), ("en_vente", "disponible"),
    ("en_vente", "retiree"), ("en_travaux", "disponible"),
    ("en_travaux", "retiree"), ("louee", "disponible"),
    ("louee", "retiree"), ("vendue", "archivee"),
    ("retiree", "disponible"), ("archivee", "retiree"),
}


def test_reference_title_transitions_and_schema_are_database_owned(connection):
    transitions = set(connection.execute(text("""
        SELECT from_status, to_status FROM public.immobilier_statut_transitions
    """)).all())
    assert transitions == EXPECTED_TRANSITIONS
    assert connection.execute(text("""
        SELECT condeferrable FROM pg_constraint
        WHERE conrelid='public.properties'::regclass AND conname='uq_properties_titre_v2'
    """)).scalar_one() is False

    property_row, request_id = insert_property(connection)
    year = property_row.reference.split("-")[1]
    assert re.fullmatch(rf"IMM-{year}-\d{{4}}", property_row.reference)
    assert property_row.reference != "CLIENT-REFERENCE"
    assert property_row.titre == f"Villa – Cocody – {property_row.reference}"

    audit = connection.execute(text("""
        SELECT action, actor_id, actor_role, request_id, old_state, new_state
        FROM public.properties_audit WHERE property_id=:property_id
    """), {"property_id": property_row.id}).one()
    assert audit.action == "created"
    assert audit.actor_id == "test-admin" and audit.actor_role == "admin"
    assert str(audit.request_id) == request_id
    assert audit.old_state is None
    assert audit.new_state["titre"] == property_row.titre


def test_locality_fallback_freeze_reedition_refusal_and_atomic_unpublish(connection):
    property_row, _ = insert_property(connection, commune="  ", ville=" Abidjan  ")
    assert property_row.titre == f"Villa – Abidjan – {property_row.reference}"

    set_actor(connection)
    published = connection.execute(text("""
        UPDATE public.properties SET publier_vitrine=TRUE WHERE id=:id
        RETURNING publier_vitrine,titre_fige_le
    """), {"id": property_row.id}).one()
    assert published.publier_vitrine is True and published.titre_fige_le is not None

    savepoint = connection.begin_nested()
    with pytest.raises(DBAPIError, match="Titre gelé"):
        connection.execute(text("UPDATE public.properties SET commune='Plateau' WHERE id=:id"), {"id": property_row.id})
    savepoint.rollback()

    set_actor(connection)
    connection.execute(text("UPDATE public.properties SET publier_vitrine=FALSE WHERE id=:id"), {"id": property_row.id})
    connection.execute(text("UPDATE public.properties SET commune='Plateau' WHERE id=:id"), {"id": property_row.id})
    updated_title = connection.execute(text("SELECT titre FROM public.properties WHERE id=:id"), {"id": property_row.id}).scalar_one()
    assert updated_title == f"Villa – Plateau – {property_row.reference}"

    set_actor(connection)
    connection.execute(text("UPDATE public.properties SET publier_vitrine=TRUE WHERE id=:id"), {"id": property_row.id})
    connection.execute(text("UPDATE public.properties SET statut='louee' WHERE id=:id"), {"id": property_row.id})
    state = connection.execute(text("""
        SELECT statut,publier_vitrine,titre_fige_le,deleted_at
        FROM public.properties WHERE id=:id
    """), {"id": property_row.id}).one()
    assert (state.statut, state.publier_vitrine, state.titre_fige_le, state.deleted_at) == ("louee", False, None, None)

    set_actor(connection)
    result = connection.execute(text("UPDATE public.properties SET statut='vendue' WHERE id=:id"), {"id": property_row.id})
    assert result.rowcount == 0
    current = connection.execute(text("SELECT statut FROM public.properties WHERE id=:id"), {"id": property_row.id}).scalar_one()
    assert current == "louee"
    rejected = connection.execute(text("""
        SELECT count(*) FROM public.properties_audit
        WHERE property_id=:id AND action='transition_refused'
    """), {"id": property_row.id}).scalar_one()
    assert rejected == 1


def test_audit_role_cannot_update_delete_or_truncate(connection):
    property_row, _ = insert_property(connection)
    privileges = connection.execute(text("""
        SELECT has_table_privilege('egs_test_user','public.properties_audit','INSERT'),
               has_table_privilege('egs_test_user','public.properties_audit','UPDATE'),
               has_table_privilege('egs_test_user','public.properties_audit','DELETE'),
               has_table_privilege('egs_test_user','public.properties_audit','TRUNCATE')
    """)).one()
    assert privileges == (False, False, False, False)

    for statement in (
        "UPDATE public.properties_audit SET reason='tamper' WHERE property_id=:id",
        "DELETE FROM public.properties_audit WHERE property_id=:id",
    ):
        savepoint = connection.begin_nested()
        with pytest.raises(DBAPIError):
            connection.execute(text(statement), {"id": property_row.id})
        savepoint.rollback()

    savepoint = connection.begin_nested()
    with pytest.raises(DBAPIError, match="append-only"):
        connection.exec_driver_sql("TRUNCATE public.properties_audit")
    savepoint.rollback()

    connection.exec_driver_sql("SET LOCAL ROLE egs_test_user")
    for statement in (
        "UPDATE public.properties_audit SET reason='tamper' WHERE property_id=:id",
        "DELETE FROM public.properties_audit WHERE property_id=:id",
    ):
        savepoint = connection.begin_nested()
        with pytest.raises(DBAPIError):
            connection.execute(text(statement), {"id": property_row.id})
        savepoint.rollback()


def test_concurrent_publish_and_lease_cannot_end_published():
    with engine.begin() as conn:
        assert conn.execute(text("SELECT current_database()")).scalar_one() == "egs_test"
        set_actor(conn, actor="immo-v2-race", role="admin")
        property_row = conn.execute(text("""
            INSERT INTO public.properties(type_bien,adresse,commune,ville,statut)
            VALUES ('villa','TEST-IMMOV2-CONCURRENCY','Cocody','Abidjan','disponible')
            RETURNING id
        """)).one()
        property_id = str(property_row.id)

    barrier = Barrier(2)

    def update(column, value):
        with engine.begin() as conn:
            assert conn.execute(text("SELECT current_database()")).scalar_one() == "egs_test"
            set_actor(conn, actor="immo-v2-race", role="admin")
            barrier.wait(timeout=10)
            conn.execute(text(f"UPDATE public.properties SET {column}=:value WHERE id=:id"), {"value": value, "id": property_id})

    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            futures = [
                pool.submit(update, "statut", "louee"),
                pool.submit(update, "publier_vitrine", True),
            ]
            for future in futures:
                future.result(timeout=20)
        with engine.connect() as conn:
            state = conn.execute(text("SELECT statut,publier_vitrine FROM public.properties WHERE id=:id"), {"id": property_id}).one()
            assert (state.statut, state.publier_vitrine) == ("louee", False)
    finally:
        with engine.begin() as conn:
            assert conn.execute(text("SELECT current_database()")).scalar_one() == "egs_test"
            conn.exec_driver_sql("SET LOCAL session_replication_role = replica")
            conn.execute(text("DELETE FROM public.properties WHERE id=:id"), {"id": property_id})
