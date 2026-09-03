from io import BytesIO

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_media_deduplication_and_lifecycle():
    # upload first file
    data = {"category": "autre", "alt_text": "dup-test"}
    resp1 = client.post(
        "/api/media",
        files={"file": ("dup.png", BytesIO(b"same-content"), "image/png")},
        data=data,
    )
    assert resp1.status_code == 200, resp1.text
    payload1 = resp1.json()
    id1 = payload1["id"]
    content_hash = payload1.get("content_hash")
    assert content_hash is not None

    # upload same content again -> should return same media (dedup)
    resp2 = client.post(
        "/api/media",
        files={"file": ("dup2.png", BytesIO(b"same-content"), "image/png")},
        data=data,
    )
    assert resp2.status_code == 200, resp2.text
    payload2 = resp2.json()
    id2 = payload2["id"]
    assert id2 == id1

    # soft-delete the media
    del_resp = client.delete(f"/api/media/{id1}")
    assert del_resp.status_code == 200
    assert del_resp.json()["deleted_at"] is not None

    # upload same content after deletion -> should create a new record (since we check deleted_at IS NULL when deduping)
    resp3 = client.post(
        "/api/media",
        files={"file": ("dup3.png", BytesIO(b"same-content"), "image/png")},
        data=data,
    )
    assert resp3.status_code == 200, resp3.text
    payload3 = resp3.json()
    id3 = payload3["id"]
    assert id3 != id1

    # purge the new media
    purge_resp = client.delete(f"/api/media/{id3}/purge")
    assert purge_resp.status_code == 200
    assert purge_resp.json()["status"] == "purged"
