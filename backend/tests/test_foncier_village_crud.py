import psycopg2
from uuid import uuid4


DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "postgres",
    "database": "egs_local",
}


def _connect():
    return psycopg2.connect(**DB_CONFIG)


def test_foncier_village_update_and_delete_work():
    conn = _connect()
    conn.autocommit = True
    cur = conn.cursor()

    try:
        cur.execute("DELETE FROM foncier_village_access")
    except Exception:
        pass
    try:
        cur.execute("DELETE FROM foncier_lots")
    except Exception:
        pass
    cur.execute("DELETE FROM foncier_villages")

    cur.execute(
        "SELECT id FROM create_foncier_village_with_access(%s, %s, %s, %s)",
        ("Village Test", "Abidjan", "Cocody", "Abidjan"),
    )
    village_id = cur.fetchone()[0]
    assert village_id is not None

    cur.execute(
        "SELECT update_foncier_village(%s, %s, %s, %s, %s)",
        (village_id, "Village Modifié", "Lagunes", "Yopougon", "Abidjan"),
    )
    updated = cur.fetchone()[0]
    assert updated is not None

    cur.execute("SELECT delete_foncier_village(%s)", (village_id,))
    deleted = cur.fetchone()[0]
    assert deleted is True

    cur.execute("SELECT COUNT(*) FROM foncier_villages WHERE id = %s AND deleted_at IS NULL", (village_id,))
    assert cur.fetchone()[0] == 0

    cur.execute("SELECT deleted_at FROM foncier_villages WHERE id = %s", (village_id,))
    assert cur.fetchone()[0] is not None

    conn.close()
