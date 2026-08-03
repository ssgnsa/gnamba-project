import unittest
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repositories.user_repository import InMemoryUserRepository
from app.services.auth_service import AuthService
from app.api import deps


class LocalAuthApiTests(unittest.TestCase):
    """Tests for local auth API using in-memory repository."""
    
    def setUp(self) -> None:
        # Override dependencies to use in-memory repository
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

    def test_health(self) -> None:
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['service'], 'egs-local-api')

    def test_login_and_me(self) -> None:
        response = self.client.post('/api/v1/auth/login', json={
            'email': 'admin@egs.local',
            'password': 'Admin@EGS2025!'
        })
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn('access_token', payload)
        self.assertEqual(payload['user']['email'], 'admin@egs.local')

        me_response = self.client.get('/api/v1/auth/me', headers={
            'Authorization': f"Bearer {payload['access_token']}"
        })
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.json()['user']['email'], 'admin@egs.local')

    def test_create_user(self) -> None:
        response = self.client.post('/api/v1/users', json={
            'email': 'user@egs.local',
            'password': 'Test123!',
            'full_name': 'Test User',
            'access_level': 'employe'
        })
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body['user']['email'], 'user@egs.local')


if __name__ == '__main__':
    unittest.main()

