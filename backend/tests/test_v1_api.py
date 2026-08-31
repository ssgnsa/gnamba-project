from __future__ import annotations

import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.repositories.user_repository import InMemoryUserRepository
from app.services.auth_service import AuthService
from app.api import deps


class UnifiedV1ApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.memory_repo = InMemoryUserRepository()

        def override_get_user_repository():
            return self.memory_repo

        def override_get_auth_service():
            return AuthService(self.memory_repo)

        app.dependency_overrides[deps.get_user_repository] = override_get_user_repository
        app.dependency_overrides[deps.get_auth_service] = override_get_auth_service
        self.client = TestClient(app)

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def test_v1_auth_login_and_me(self) -> None:
        response = self.client.post(
            "/api/v1/auth/login",
            json={"email": "admin@egs.local", "password": "Admin@EGS2025!"},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["access_token"]
        assert payload["user"]["email"] == "admin@egs.local"

        me_response = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {payload['access_token']}"},
        )
        assert me_response.status_code == 200
        assert me_response.json()["user"]["email"] == "admin@egs.local"

    def test_v1_users_listing_requires_admin(self) -> None:
        login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "admin@egs.local", "password": "Admin@EGS2025!"},
        )
        token = login.json()["access_token"]

        response = self.client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_legacy_user_without_entity_still_maps_identity_fields(self) -> None:
        from app.infrastructure.sqlalchemy_user_repository import _to_domain
        from app.models.user import User as SqlAlchemyUser

        legacy_user = SqlAlchemyUser(
            id="legacy-user-1",
            email="legacy@egs.local",
            full_name="Legacy User",
            password_hash="hash",
            role="employe",
            access_level="employe",
            entity_id=None,
        )

        domain_user = _to_domain(legacy_user)

        assert domain_user.email == "legacy@egs.local"
        assert domain_user.full_name == "Legacy User"
        assert domain_user.entity_id == "legacy-user-1"

    def test_v1_lead_capture_endpoint_is_mounted(self) -> None:
        response = self.client.post(
            "/api/v1/leads/capture",
            json={
                "phone": "+2250102030405",
                "first_name": "Awa",
                "source": "web_form",
                "source_page": "/contact",
                "source_form": "contact",
            },
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["success"] is True
        assert payload["data"]["phone"] == "+2250102030405"
