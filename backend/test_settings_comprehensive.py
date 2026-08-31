import os
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@127.0.0.1:5432/egs_local"
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
print("Login response:", login_response.status_code)
token = login_response.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

# ============ Test 1: GET settings (initial state) ============
print("\n--- Test 1: GET settings ---")
get_response = client.get("/api/v1/settings", headers=headers)
print(f"Status: {get_response.status_code}")
print(f"Count: {len(get_response.json())}")

# ============ Test 2: POST upsert with items array (bulk) ============
print("\n--- Test 2: POST upsert bulk ---")
post_response = client.post("/api/v1/settings", headers=headers, json={
    "items": [
        {"key": "app_title", "value": "EGS - Test Title"},
        {"key": "primary_color", "value": "#1a73e8"}
    ]
})
print(f"Status: {post_response.status_code}")
print(f"Response: {post_response.json()}")

# ============ Test 3: POST upsert with single key-value ============
print("\n--- Test 3: POST upsert single ---")
post_response = client.post("/api/v1/settings", headers=headers, json={
    "key": "commission_rate",
    "value": 5.5
})
print(f"Status: {post_response.status_code}")
print(f"Response: {post_response.json()}")

# ============ Test 4: POST upsert with main endpoint (not alias) ============
print("\n--- Test 4: POST upsert main endpoint ---")
post_response = client.post("/api/v1/settings", headers=headers, json={
    "key": "rent_due_day",
    "value": 15
})
print(f"Status: {post_response.status_code}")
print(f"Response: {post_response.json()}")

# ============ Test 5: Update existing key ============
print("\n--- Test 5: Update existing key ---")
post_response = client.post("/api/v1/settings", headers=headers, json={
    "key": "commission_rate",
    "value": 7.25
})
print(f"Status: {post_response.status_code}")
print(f"Response: {post_response.json()}")

# ============ Test 6: POST upsert with empty value ============
print("\n--- Test 6: POST upsert with empty value ---")
post_response = client.post("/api/v1/settings", headers=headers, json={
    "key": "app_subtitle",
    "value": ""
})
print(f"Status: {post_response.status_code}")
print(f"Response: {post_response.json()}")

# ============ Test 7: POST upsert with null value ============
print("\n--- Test 7: POST upsert with null value ---")
post_response = client.post("/api/v1/settings", headers=headers, json={
    "key": "seo_keywords",
    "value": None
})
print(f"Status: {post_response.status_code}")
print(f"Response: {post_response.json()}")

# ============ Test 8: POST upsert with special characters ============
print("\n--- Test 8: POST upsert with special characters ---")
post_response = client.post("/api/v1/settings", headers=headers, json={
    "key": "contact_address",
    "value": "123 Rue des Tests, Abidjan, Côte d'Ivoire 🎉"
})
print(f"Status: {post_response.status_code}")
print(f"Response: {post_response.json()}")

# ============ Test 9: GET settings (final state) ============
print("\n--- Test 9: GET settings (final) ---")
get_response = client.get("/api/v1/settings", headers=headers)
print(f"Status: {get_response.status_code}")
print(f"Count: {len(get_response.json())}")
for setting in get_response.json():
    if setting['key'] in ('app_title', 'primary_color', 'commission_rate', 'rent_due_day', 'app_subtitle', 'seo_keywords', 'contact_address'):
        print(f"  {setting['key']}: {setting['value']}")

# ============ Test 10: GET single setting ============
print("\n--- Test 10: GET single setting ---")
get_response = client.get("/api/v1/settings/commission_rate", headers=headers)
print(f"Status: {get_response.status_code}")
print(f"Response: {get_response.json()}")

# ============ Test 11: GET non-existent setting ============
print("\n--- Test 11: GET non-existent setting ---")
get_response = client.get("/api/v1/settings/non_existent_key_12345", headers=headers)
print(f"Status: {get_response.status_code}")
print(f"Response: {get_response.json()}")

# ============ Test 12: Test with non-admin user (should fail) ============
print("\n--- Test 12: Test with non-admin user ---")
# Create a non-admin user first
create_response = client.post("/api/v1/users", headers=headers, json={
    "email": "testuser@egs.local",
    "password": "TestPass123!",
    "full_name": "Test User",
    "role": "employe",
    "access_level": "employe",
    "poste": "Test",
    "department": "Test",
    "phone": ""
})
print(f"Create user status: {create_response.status_code}")
if create_response.status_code == 200:
    # Login as non-admin
    login_response2 = client.post("/api/v1/auth/login", json={
        "email": "testuser@egs.local",
        "password": "TestPass123!"
    })
    if login_response2.status_code == 200:
        user_token = login_response2.json().get("access_token")
        user_headers = {"Authorization": f"Bearer {user_token}"}
        post_response = client.post("/api/v1/settings", headers=user_headers, json={
            "key": "app_title",
            "value": "should fail"
        })
        print(f"Non-admin POST status: {post_response.status_code}")
        print(f"Response: {post_response.json()}")

# ============ Test 13: Test whitelist rejection ============
print("\n--- Test 13: Test invalid key rejection ---")
post_response = client.post("/api/v1/settings", headers=headers, json={
    "key": "invalid_key_not_in_whitelist",
    "value": "should fail"
})
print(f"Status: {post_response.status_code}")
print(f"Response: {post_response.json()}")

# ============ Test 14: Test validation schema rejection ============
print("\n--- Test 14: Test invalid value (validation schema) ---")
post_response = client.post("/api/v1/settings", headers=headers, json={
    "key": "primary_color",
    "value": "not-a-valid-hex-color"
})
print(f"Status: {post_response.status_code}")
print(f"Response: {post_response.json()}")

# ============ Test 15: GET public settings ============
print("\n--- Test 15: GET public settings ---")
get_response = client.get("/api/v1/settings/public", headers=headers)
print(f"Status: {get_response.status_code}")
print(f"Count: {len(get_response.json())}")

# ============ Test 16: GET settings by category ============
print("\n--- Test 16: GET settings by category (branding) ---")
get_response = client.get("/api/v1/settings/category/branding", headers=headers)
print(f"Status: {get_response.status_code}")
print(f"Count: {len(get_response.json())}")

# ============ Test 17: GET frontend format ============
print("\n--- Test 17: GET frontend format ---")
get_response = client.get("/api/v1/settings/frontend", headers=headers)
print(f"Status: {get_response.status_code}")
print(f"Keys: {list(get_response.json().keys())}")

# ============ Test 18: GET whitelist ============
print("\n--- Test 18: GET whitelist ---")
get_response = client.get("/api/v1/settings/whitelist", headers=headers)
print(f"Status: {get_response.status_code}")
print(f"Keys: {list(get_response.json().keys())}")

# ============ Test 19: GET audit log ============
print("\n--- Test 19: GET audit log ---")
get_response = client.get("/api/v1/settings/audit", headers=headers)
print(f"Status: {get_response.status_code}")
print(f"Count: {len(get_response.json())}")

print("\n=== All tests completed ===")