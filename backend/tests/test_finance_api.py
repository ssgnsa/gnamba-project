from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient

from app.api import deps
from app.main import app
from app.repositories.user_repository import InMemoryUserRepository
from app.services.auth_service import AuthService


class TestFinanceApi:
    def setup_method(self) -> None:
        self.memory_repo = InMemoryUserRepository()

        def override_get_user_repository():
            return self.memory_repo

        def override_get_auth_service():
            return AuthService(self.memory_repo)

        app.dependency_overrides[deps.get_user_repository] = override_get_user_repository
        app.dependency_overrides[deps.get_auth_service] = override_get_auth_service
        self.client = TestClient(app)

    def teardown_method(self) -> None:
        app.dependency_overrides.clear()

    def test_finance_crud_flow(self) -> None:
        reference = f"FIN-TEST-{uuid4().hex[:8].upper()}"
        create_response = self.client.post(
            "/api/v1/finance",
            json={
                "reference": reference,
                "montant": 150000,
                "type_transaction": "recette",
                "categorie": "Paiement Client",
                "date_transaction": "2026-07-11",
                "mode_paiement": "virement",
                "description": "Paiement test",
            },
        )

        assert create_response.status_code == 200
        created = create_response.json()
        assert created["reference"] == reference
        finance_id = created["id"]

        list_response = self.client.get("/api/v1/finance")
        assert list_response.status_code == 200
        listed = list_response.json()
        assert any(item["id"] == finance_id for item in listed)

        update_response = self.client.patch(
            f"/api/v1/finance/{finance_id}",
            json={"montant": 175000, "description": "Paiement test mis a jour"},
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["montant"] == 175000
        assert updated["description"] == "Paiement test mis a jour"

        delete_response = self.client.delete(f"/api/v1/finance/{finance_id}")
        assert delete_response.status_code == 200
        assert delete_response.json()["status"] == "ok"
