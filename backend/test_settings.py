import os
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@127.0.1:5432/egs_local"
os.environ["JWT_SECRET"] = "EgsLocalAuthSecret2026SecureAndLong!"
os.environ["LOCAL_AUTH_SECRET"] = "EgsLocalAuthSecret2026SecureAndLong!"
os.environ["INITIAL_ADMIN_PASSWORD"] = "EgsAdminInitialPass2026Secure!"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# First login to get a token
login_response = client.post("/api/v1/auth/login", json={
    "email": "admin@egs.local",
    "password": "EgsAdminInitialPass2026Secure!"
})
print("Login response:", login_response.status_code, login_response.json())

if login_response.status_code == 200:
    token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test GET settings
    get_response = client.get("/api/v1/settings", headers=headers)
    print("GET settings:", get_response.status_code, get_response.json())
    
    # Test POST upsert settings
    post_response = client.post("/api/v1/settings", headers=headers, json={
        "items": [
            {"key": "test_key", "value": "test_value"}
        ]
    })
    print("POST upsert:", post_response.status_code, post_response.json())
    
    # Test single upsert
    post_response2 = client.post("/api/v1/settings", headers=headers, json={
        "key": "single_key",
        "value": "single_value"
    })
    print("POST upsert single:", post_response2.status_code, post_response2.json())
    
    # Test GET again
    get_response2 = client.get("/api/v1/settings", headers=headers)
    print("GET settings after:", get_response2.status_code, get_response2.json())