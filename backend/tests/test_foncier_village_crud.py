import os
import psycopg2
import pytest


DB_CONFIG = {
    "host": os.getenv("DB_HOST", "egs-postgres"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "database": os.getenv("DB_NAME", "egs_local"),
}


def _connect():
    return psycopg2.connect(**DB_CONFIG)


def test_foncier_village_update_and_delete_work():
    # This legacy integration test used to clear every village, ACL, lot and
    # lotissement before running. Require an explicit opt-in and a disposable
    # database, then keep every write inside a transaction that is rolled back.
    if os.getenv("EGS_ALLOW_FONCIER_INTEGRATION") != "1":
        pytest.skip("Set EGS_ALLOW_FONCIER_INTEGRATION=1 to opt in to PostgreSQL integration tests")
    if not DB_CONFIG["database"].endswith("_test"):
        pytest.skip("Foncier integration tests require a disposable database whose name ends in _test")

    conn = _connect()
    try:
        cur = conn.cursor()

        try:
            cur.execute(
                "SELECT id FROM create_foncier_village_with_access(%s, %s, %s, %s)",
                ("Village Test Foncier", "Abidjan", "Cocody", "Abidjan"),
            )
            village_id = cur.fetchone()[0]
        except Exception as exc:
            conn.rollback()
            pytest.skip(f"Database helper functions for Foncier are unavailable: {exc}")

        assert village_id is not None

        cur.execute(
            "SELECT id FROM update_foncier_village(%s, %s, %s, %s, %s)",
            (village_id, "Village Modifié", "Lagunes", "Yopougon", "Abidjan"),
        )
        updated_id = cur.fetchone()[0]
        assert updated_id == village_id

        cur.execute("SELECT delete_foncier_village(%s)", (village_id,))
        deleted = cur.fetchone()[0]
        assert deleted is True

        cur.execute("SELECT deleted_at FROM foncier_villages WHERE id = %s", (village_id,))
        assert cur.fetchone()[0] is not None
    finally:
        # Never persist fixture data, including when an assertion fails.
        conn.rollback()
        conn.close()
