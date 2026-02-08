#!/usr/bin/env python3
import requests
import json

# Get token
print("=== Getting auth token ===")
resp = requests.post(
    "http://localhost:5239/api/auth/login",
    json={"username": "admin", "password": "Admin123!"},
    timeout=5
)
print(f"Login: {resp.status_code}")
if resp.status_code != 200:
    print(f"Error: {resp.text}")
    exit(1)

token = resp.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Test /api/reports without workspace filter
print("\n=== Testing /api/reports (all reports) ===")
resp = requests.get("http://localhost:5239/api/reports", headers=headers, timeout=5)
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    print(f"Total: {data.get('total')}")
    print(f"Items: {len(data.get('items', []))}")
    if data.get('items'):
        for item in data['items']:
            print(f"  - {item.get('name')}")
else:
    print(f"Error: {resp.text[:500]}")

# Test with workspaceId parameter
print("\n=== Testing /api/reports?pageSize=50 ===")
resp = requests.get("http://localhost:5239/api/reports?pageSize=50", headers=headers, timeout=5)
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    print(f"Total: {data.get('total')}")
    print(f"Items: {len(data.get('items', []))}")
    if data.get('items'):
        for item in data['items'][:3]:
            print(f"  - {item.get('name')} (workspace: {item.get('workspaceId')})")
else:
    print(f"Error: {resp.text[:500]}")

# Get workspaces to test with specific workspace
print("\n=== Getting workspaces ===")
resp = requests.get("http://localhost:5239/api/workspaces/mine", headers=headers, timeout=5)
if resp.status_code == 200:
    workspaces = resp.json()
    print(f"Found {len(workspaces)} workspaces:")
    for ws in workspaces:
        print(f"  - {ws.get('name')} (ID: {ws.get('id')})")
        
        # Test reports for this workspace
        ws_id = ws.get('id')
        resp2 = requests.get(f"http://localhost:5239/api/reports?workspaceId={ws_id}", headers=headers, timeout=5)
        if resp2.status_code == 200:
            data = resp2.json()
            print(f"    Reports in this workspace: {data.get('total')}")
        else:
            print(f"    Error: {resp2.status_code}")
