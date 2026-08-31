from __future__ import annotations

from uuid import uuid4

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api import deps
from fastapi import Header
from app.main import app
from app.repositories.user_repository import InMemoryUserRepository
from app.services.auth_service import AuthService


class TestFinanceApi:
    def setup_method(self) -> None:
        self.memory_repo = InMemoryUserRepository()
        self.auth_service = AuthService(self.memory_repo)

        def override_get_user_repository():
            return self.memory_repo

        def override_get_auth_service():
            return self.auth_service

        # Override get_current_user pour qu'il utilise l'auth service et
        # lève HTTPException(401) au lieu de AuthorizationError
        def override_get_current_user(authorization: str | None = Header(default=None)):
            if not authorization or not authorization.startswith("Bearer "):
                raise HTTPException(status_code=401, detail="Authorization header manquant")
            try:
                return self.auth_service.get_current_user(authorization)
            except Exception:
                raise HTTPException(status_code=401, detail="Token invalide")

        def override_get_user_id(current_user: dict = None):
            if not current_user:
                raise HTTPException(status_code=401, detail="Utilisateur non authentifié")
            return current_user.get("id") or current_user.get("sub")

        app.dependency_overrides[deps.get_user_repository] = override_get_user_repository
        app.dependency_overrides[deps.get_auth_service] = override_get_auth_service
        app.dependency_overrides[deps.get_current_user] = override_get_current_user
        self.client = TestClient(app)

        # Authentifier avec le compte admin par défaut
        auth_result = self.auth_service.authenticate("admin@egs.local", "Admin@EGS2025!")
        self.admin_token = auth_result["access_token"]

    def teardown_method(self) -> None:
        app.dependency_overrides.clear()

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.admin_token}"}

    # =====================================
    # TESTS D'AUTHENTIFICATION
    # =====================================

    def test_create_requires_auth(self) -> None:
        response = self.client.post(
            "/api/v1/finance",
            json={
                "reference": "FIN-TEST-NOAUTH",
                "montant": 50000,
                "type_transaction": "recette",
                "categorie": "Paiement Client",
            },
        )
        assert response.status_code == 401, f"Attendu 401, reçu {response.status_code}: {response.text}"

    def test_update_requires_auth(self) -> None:
        # Créer avec auth d'abord
        headers = self._headers()
        ref = f"FIN-SEC-{uuid4().hex[:8].upper()}"
        create_resp = self.client.post(
            "/api/v1/finance",
            json={"reference": ref, "montant": 5000},
            headers=headers,
        )
        assert create_resp.status_code == 201
        finance_id = create_resp.json()["id"]

        # Tenter de modifier sans auth
        response = self.client.patch(f"/api/v1/finance/{finance_id}", json={"montant": 9999})
        assert response.status_code == 401

    def test_delete_requires_auth(self) -> None:
        # Créer avec auth d'abord
        headers = self._headers()
        ref = f"FIN-SEC-{uuid4().hex[:8].upper()}"
        create_resp = self.client.post(
            "/api/v1/finance",
            json={"reference": ref, "montant": 5000},
            headers=headers,
        )
        assert create_resp.status_code == 201
        finance_id = create_resp.json()["id"]

        # Tenter de supprimer sans auth
        response = self.client.delete(f"/api/v1/finance/{finance_id}")
        assert response.status_code == 401

    # =====================================
    # TESTS CRUD
    # =====================================

    def test_finance_crud_flow(self) -> None:
        """Test CRUD complet: Create → Read → Update → Soft Delete → Hard Delete"""
        headers = self._headers()
        reference = f"FIN-TEST-{uuid4().hex[:8].upper()}"

        # CREATE
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
            headers=headers,
        )
        assert create_response.status_code == 201, f"Create failed: {create_response.text}"
        created = create_response.json()
        assert created["reference"] == reference
        assert created["montant"] == 150000
        finance_id = created["id"]

        # GET by ID
        get_resp = self.client.get(f"/api/v1/finance/{finance_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["reference"] == reference

        # LIST
        list_resp = self.client.get("/api/v1/finance")
        assert list_resp.status_code == 200
        listed = list_resp.json()
        assert isinstance(listed, list)
        assert any(item["id"] == finance_id for item in listed)

        # UPDATE
        update_resp = self.client.patch(
            f"/api/v1/finance/{finance_id}",
            json={"montant": 175000, "description": "Paiement test mis à jour"},
            headers=headers,
        )
        assert update_resp.status_code == 200
        updated = update_resp.json()
        assert updated["montant"] == 175000
        assert updated["description"] == "Paiement test mis à jour"

        # SOFT DELETE
        del_resp = self.client.delete(f"/api/v1/finance/{finance_id}", headers=headers)
        assert del_resp.status_code == 200
        assert del_resp.json()["status"] == "ok"
        assert "annulée" in del_resp.json()["message"]

        # Vérifier le statut = "annule"
        soft_del = self.client.get(f"/api/v1/finance/{finance_id}")
        assert soft_del.status_code == 200
        assert soft_del.json()["statut"] == "annule"

        # HARD DELETE
        hard_del = self.client.delete(f"/api/v1/finance/{finance_id}", headers=headers)
        assert hard_del.status_code == 200
        assert "supprimée définitivement" in hard_del.json()["message"]

        gone = self.client.get(f"/api/v1/finance/{finance_id}")
        assert gone.status_code == 404

    # =====================================
    # TESTS DE VALIDATION
    # =====================================

    def test_validation_montant_negatif(self) -> None:
        headers = self._headers()
        response = self.client.post(
            "/api/v1/finance",
            json={"reference": "FIN-BAD", "montant": -1000, "type_transaction": "recette"},
            headers=headers,
        )
        assert response.status_code == 422

    def test_validation_montant_zero(self) -> None:
        headers = self._headers()
        response = self.client.post(
            "/api/v1/finance",
            json={"reference": "FIN-ZERO", "montant": 0, "type_transaction": "recette"},
            headers=headers,
        )
        assert response.status_code == 422

    def test_validation_type_transaction_invalide(self) -> None:
        headers = self._headers()
        response = self.client.post(
            "/api/v1/finance",
            json={"reference": "FIN-BADTYPE", "montant": 1000, "type_transaction": "mouvement"},
            headers=headers,
        )
        assert response.status_code == 422

    def test_validation_mode_paiement_invalide(self) -> None:
        headers = self._headers()
        response = self.client.post(
            "/api/v1/finance",
            json={"reference": "FIN-MODE", "montant": 1000, "mode_paiement": "crypto"},
            headers=headers,
        )
        assert response.status_code == 422

    # =====================================
    # TESTS PAGINATION
    # =====================================

    def test_pagination(self) -> None:
        """Vérifie que limit/offset fonctionnent"""
        headers = self._headers()
        for i in range(3):
            self.client.post(
                "/api/v1/finance",
                json={"reference": f"FIN-PAGE-{i}", "montant": 10000, "type_transaction": "recette"},
                headers=headers,
            )

        page1 = self.client.get("/api/v1/finance?limit=2&offset=0")
        assert page1.status_code == 200
        assert len(page1.json()) <= 2

        page2 = self.client.get("/api/v1/finance?limit=2&offset=2")
        assert page2.status_code == 200

    # =====================================
    # TESTS 404
    # =====================================

    def test_404_get_not_found(self) -> None:
        bad_id = "00000000-0000-0000-0000-000000000000"
        assert self.client.get(f"/api/v1/finance/{bad_id}").status_code == 404

    def test_404_update_not_found(self) -> None:
        headers = self._headers()
        bad_id = "00000000-0000-0000-0000-000000000000"
        resp = self.client.patch(f"/api/v1/finance/{bad_id}", json={"montant": 100}, headers=headers)
        assert resp.status_code == 404

    def test_404_delete_not_found(self) -> None:
        headers = self._headers()
        bad_id = "00000000-0000-0000-0000-000000000000"
        resp = self.client.delete(f"/api/v1/finance/{bad_id}", headers=headers)
        assert resp.status_code == 404

    # =====================================
    # TEST STATS
    # =====================================

    def test_stats_after_crud(self) -> None:
        """Vérifie que la liste fonctionne malgré l'auth"""
        headers = self._headers()
        self.client.post(
            "/api/v1/finance",
            json={"reference": "FIN-STAT-R", "montant": 100000, "type_transaction": "recette"},
            headers=headers,
        )
        self.client.post(
            "/api/v1/finance",
            json={"reference": "FIN-STAT-D", "montant": 30000, "type_transaction": "depense"},
            headers=headers,
        )

        resp = self.client.get("/api/v1/finance")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 2
