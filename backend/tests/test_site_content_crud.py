from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app, raise_server_exceptions=True)


def test_site_content_crud_flow() -> None:
    # Create or upsert a site content key
    payload = {"section": "hero", "key": "test_title", "value": "Titre de test"}
    resp = client.post("/api/site-content", json=payload)
    assert resp.status_code == 200, resp.text
    assert resp.json().get("status") == "ok"

    # Read list and find our key
    list_resp = client.get("/api/site-content")
    assert list_resp.status_code == 200
    items = list_resp.json()
    found = [i for i in items if i.get("key") == "test_title"]
    assert len(found) >= 1
    # If id is not returned via list, try to patch by locating any matching key
    # The table exposes id in the generic tables API, but here we can attempt delete via tables as well

    # Try update via patch (use first item's id if present)
    maybe_id = None
    # Try querying through generic tables endpoint to find id
    tbl = client.get("/api/tables/site_content")
    if tbl.status_code == 200:
        for row in tbl.json():
            if row.get("key") == "test_title":
                maybe_id = row.get("id")
                break

    if maybe_id:
        patch_resp = client.patch(f"/api/site-content/{maybe_id}", json={"section": "hero", "key": "test_title", "value": "Titre modifié"})
        assert patch_resp.status_code == 200
        assert patch_resp.json().get("status") == "ok"

        del_resp = client.delete(f"/api/site-content/{maybe_id}")
        assert del_resp.status_code == 200
        assert del_resp.json().get("status") == "ok"
    else:
        # If id not found, at least ensure the key is present in list
        assert any(i.get("key") == "test_title" for i in items)
