from datetime import datetime, timezone
from importlib import import_module
from types import SimpleNamespace
from uuid import UUID

foncier_router = import_module("app.api.v1.foncier.router")


LOT_ID = UUID("0277e280-06a5-40e3-83e8-d7be15e1873a")
ATTESTATION_ID = UUID("c837008e-4762-4388-952d-b6e08520215f")
ATTESTATION_REFERENCE = (
    "ATT-20260922-LOT-AUTO9943-GARE-ROUT3-02-14-20260922-LOT-1"
)


def make_attestation(reference=ATTESTATION_REFERENCE):
    now = datetime(2026, 9, 22, 17, 43, 21, tzinfo=timezone.utc)
    return SimpleNamespace(
        id=ATTESTATION_ID,
        lot_id=LOT_ID,
        proprietaire_client_id=None,
        reference=reference,
        version=1,
        type="cession",
        statut="soumis",
        gps_points=[],
        temoin_empreinte_media_ids=None,
        temoins=[
            SimpleNamespace(
                id=UUID("d2382bfe-c1ef-4d93-84dc-4ab30ee0dc35"),
                attestation_id=ATTESTATION_ID,
                nom="",
                prenom="",
                profession=None,
                telephone=None,
                cni=None,
                empreinte_media_id=None,
                created_at=now,
            )
        ],
        created_at=now,
        updated_at=now,
    )


def install_search_service(monkeypatch, attestations):
    calls = []

    class FakeAttestationService:
        def search(self, lot_id=None, statut=None, limit=50, offset=0):
            calls.append((lot_id, statut, limit, offset))
            filtered = attestations
            if lot_id is not None:
                filtered = [item for item in filtered if item.lot_id == lot_id]
            if statut is not None:
                filtered = [item for item in filtered if item.statut == statut]
            return filtered[offset : offset + limit], len(filtered)

    monkeypatch.setattr(
        foncier_router,
        "get_attestation_service",
        lambda _db: FakeAttestationService(),
    )
    return calls


def test_search_attestations_by_lot_serializes_orm_and_legacy_values(
    test_client, monkeypatch
):
    attestation = make_attestation()
    install_search_service(monkeypatch, [attestation])

    response = test_client.get(f"/api/v1/foncier/attestations?lot_id={LOT_ID}")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == str(ATTESTATION_ID)
    assert body["items"][0]["reference"] == ATTESTATION_REFERENCE
    assert body["items"][0]["lot_id"] == str(LOT_ID)
    assert body["items"][0]["statut"] == "soumis"
    assert body["items"][0]["type"] == "cession"
    assert body["items"][0]["gps_points"] == []
    assert body["items"][0]["temoin_empreinte_media_ids"] is None
    assert body["items"][0]["temoins"][0]["nom"] == ""
    assert body["items"][0]["temoins"][0]["prenom"] == ""
    assert body["items"][0]["created_at"].startswith("2026-09-22T17:43:21")


def test_search_attestations_without_results_returns_empty_items(
    test_client, monkeypatch
):
    install_search_service(monkeypatch, [make_attestation()])
    missing_lot_id = UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")

    response = test_client.get(
        f"/api/v1/foncier/attestations?lot_id={missing_lot_id}"
    )

    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["total"] == 0


def test_search_attestations_preserves_pagination(test_client, monkeypatch):
    attestations = [make_attestation(f"ATT-{index}") for index in range(3)]
    calls = install_search_service(monkeypatch, attestations)

    response = test_client.get(
        f"/api/v1/foncier/attestations?lot_id={LOT_ID}&page=2&page_size=1"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert body["page"] == 2
    assert body["page_size"] == 1
    assert body["total_pages"] == 3
    assert [item["reference"] for item in body["items"]] == ["ATT-1"]
    assert calls == [(LOT_ID, None, 1, 1)]


def test_revoke_attestation_accepts_json_reason(test_client, monkeypatch):
    calls = []

    class FakeAttestationService:
        def revoke(self, attestation_id, reason, user_id):
            calls.append((attestation_id, reason, user_id))
            return None

    monkeypatch.setattr(
        foncier_router,
        "get_attestation_service",
        lambda _db: FakeAttestationService(),
    )
    response = test_client.post(
        f"/api/v1/foncier/attestations/{ATTESTATION_ID}/revoke",
        json={"reason": "Correction validée"},
    )

    assert response.status_code == 400
    assert calls == [
        (ATTESTATION_ID, "Correction validée", "00000000-0000-0000-0000-000000000001")
    ]


def test_audit_search_accepts_multiple_foncier_entity_types(test_client, monkeypatch):
    calls = []

    class FakeAuditService:
        def search(self, params):
            calls.append(params.entity_type)
            return [], 0

    monkeypatch.setattr(
        foncier_router,
        "get_audit_service",
        lambda _db: FakeAuditService(),
    )
    response = test_client.get(
        "/api/v1/foncier/audit?entity_type=foncier_lot&entity_type=foncier_attestation"
    )

    assert response.status_code == 200
    assert response.json()["items"] == []
    assert calls == [["foncier_lot", "foncier_attestation"]]
