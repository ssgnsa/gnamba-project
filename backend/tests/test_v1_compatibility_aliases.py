from __future__ import annotations

from io import BytesIO

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_v1_settings_and_site_content_aliases_are_available() -> None:
    settings_response = client.get("/api/v1/settings")
    assert settings_response.status_code == 200
    assert isinstance(settings_response.json(), list)

    site_content_response = client.get("/api/v1/site-content")
    assert site_content_response.status_code == 200
    assert isinstance(site_content_response.json(), list)


def test_v1_media_aliases_cover_upload_usage_and_lifecycle() -> None:
    upload_response = client.post(
        "/api/v1/media",
        files={"file": ("demo-v1.png", BytesIO(b"fake-image"), "image/png")},
        data={
            "category": "autre",
            "alt_text": "demo v1",
            "description": "demo desc v1",
            "tags": "v1,compat",
        },
    )
    assert upload_response.status_code == 200, upload_response.text
    media_id = upload_response.json()["id"]

    list_response = client.get("/api/v1/media")
    assert list_response.status_code == 200
    assert any(item["id"] == media_id for item in list_response.json())

    brand_assets_response = client.get("/api/v1/media/brand-assets")
    assert brand_assets_response.status_code == 200
    assert isinstance(brand_assets_response.json(), list)

    usage_response = client.post(
        "/api/v1/media/usage",
        json={
            "media_id": media_id,
            "entity_type": "site_section",
            "entity_id": "hero-v1",
            "usage_type": "hero_image",
            "label": "Hero V1",
        },
    )
    assert usage_response.status_code == 200, usage_response.text
    usage_id = usage_response.json()["id"]

    usage_list_response = client.get(f"/api/v1/media/usage?media_id={media_id}")
    assert usage_list_response.status_code == 200
    assert usage_list_response.json()[0]["id"] == usage_id

    delete_usage_response = client.delete(f"/api/v1/media/usage/{usage_id}")
    assert delete_usage_response.status_code == 200

    delete_media_response = client.delete(f"/api/v1/media/{media_id}")
    assert delete_media_response.status_code == 200

    restore_response = client.post(f"/api/v1/media/{media_id}/restore")
    assert restore_response.status_code == 200

    purge_response = client.delete(f"/api/v1/media/{media_id}/purge")
    assert purge_response.status_code == 200
    assert purge_response.json()["status"] == "purged"

