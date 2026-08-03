from io import BytesIO

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_media_usage_routes_work():
    response = client.post(
        "/api/media",
        files={"file": ("demo.png", BytesIO(b"fake-image"), "image/png")},
        data={"category": "autre", "alt_text": "demo", "description": "demo desc", "tags": "one,two"},
    )
    assert response.status_code == 200, response.text
    media_id = response.json()["id"]

    create_usage = client.post(
        "/api/media/usage",
        json={
            "media_id": media_id,
            "entity_type": "site_section",
            "entity_id": "hero",
            "usage_type": "hero_image",
            "label": "Hero",
        },
    )
    assert create_usage.status_code == 200, create_usage.text

    list_usage = client.get(f"/api/media/usage?media_id={media_id}")
    assert list_usage.status_code == 200
    assert list_usage.json()[0]["media_id"] == media_id

    slot_usage = client.get(
        "/api/media/usage?entity_type=site_section&usage_type=hero_image&entity_id=hero"
    )
    assert slot_usage.status_code == 200
    assert slot_usage.json()[0]["id"] == media_id

    delete_usage = client.delete(f"/api/media/usage/{list_usage.json()[0]['id']}")
    assert delete_usage.status_code == 200


def test_media_upload_list_get_update_delete_restore_purge_flow():
    response = client.post(
        "/api/media",
        files={"file": ("demo.png", BytesIO(b"fake-image"), "image/png")},
        data={"category": "autre", "alt_text": "demo", "description": "demo desc", "tags": "one,two"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    media_id = payload["id"]
    assert payload["filename"].startswith("autre/")

    list_response = client.get("/api/media")
    assert list_response.status_code == 200
    assert any(item["id"] == media_id for item in list_response.json())

    get_response = client.get(f"/api/media/{media_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == media_id

    update_response = client.patch(
        f"/api/media/{media_id}",
        json={"alt_text": "updated", "description": "updated desc"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["alt_text"] == "updated"

    delete_response = client.delete(f"/api/media/{media_id}")
    assert delete_response.status_code == 200
    assert delete_response.json()["deleted_at"] is not None

    restore_response = client.post(f"/api/media/{media_id}/restore")
    assert restore_response.status_code == 200
    assert restore_response.json()["deleted_at"] is None

    purge_response = client.delete(f"/api/media/{media_id}/purge")
    assert purge_response.status_code == 200
    assert purge_response.json()["status"] == "purged"

    after_purge = client.get(f"/api/media/{media_id}")
    assert after_purge.status_code == 404
