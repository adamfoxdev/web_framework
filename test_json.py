#!/usr/bin/env python3
import requests
import json

# Get token
resp = requests.post(
    "http://localhost:5239/api/auth/login",
    json={"username": "admin", "password": "Admin123!"},
    timeout=5
)
token = resp.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Get exact JSON response
print("=== Raw JSON response from /api/reports ===")
resp = requests.get("http://localhost:5239/api/reports?pageSize=50", headers=headers, timeout=5)
print(json.dumps(resp.json(), indent=2)[:1000])

print("\n=== Check if items can be accessed ===")
data = resp.json()
print(f"Keys in response: {list(data.keys())}")
print(f"Items count: {len(data.get('items', []))}")
print(f"First item keys: {list(data['items'][0].keys()) if data.get('items') else 'No items'}")
