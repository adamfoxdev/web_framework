#!/usr/bin/env python3
import subprocess
import json
import time
import sys
import os
import requests
from pathlib import Path

# Kill existing dotnet processes
print("Killing existing backend processes...")
subprocess.run("taskkill /F /IM dotnet.exe", shell=True, capture_output=True)
time.sleep(3)

# Start backend
print("Starting backend...")
backend_path = Path("c:/Code/web_framework/backend")
os.chdir(backend_path)
backend_proc = subprocess.Popen(["dotnet", "run"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
print(f"Backend started with PID {backend_proc.pid}")

# Wait for backend to be ready
print("Waiting for backend to start...")
for i in range(30):
    try:
        resp = requests.get("http://localhost:5239/api/health", timeout=2)
        if resp.status_code < 500:
            print("Backend is ready!")
            break
    except:
        pass
    print(f"  Attempt {i+1}/30...")
    time.sleep(1)
else:
    print("Backend failed to start in time")
    sys.exit(1)

# Test login
print("\n=== Testing /api/auth/login ===")
try:
    resp = requests.post(
        "http://localhost:5239/api/auth/login",
        json={"username": "admin", "password": "Admin123!"},
        timeout=5
    )
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        token = data.get("token")
        print(f"✓ Token received: {token[:20]}...")
        
        # Test /api/users/me
        print("\n=== Testing /api/users/me ===")
        try:
            resp = requests.get(
                "http://localhost:5239/api/users/me",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5
            )
            print(f"Status: {resp.status_code}")
            if resp.status_code != 200:
                print(f"Error: {resp.text[:500]}")
            else:
                print(f"✓ User: {resp.json().get('username')}")
        except Exception as e:
            print(f"Error: {e}")
        
        # Test /api/workspaces/mine
        print("\n=== Testing /api/workspaces/mine ===")
        try:
            resp = requests.get(
                "http://localhost:5239/api/workspaces/mine",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5
            )
            print(f"Status: {resp.status_code}")
            if resp.status_code != 200:
                print(f"Error: {resp.text[:500]}")
            else:
                count = len(resp.json())
                print(f"✓ Workspaces: {count}")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print(f"Error: {resp.text[:500]}")
except Exception as e:
    print(f"Connection error: {e}")
finally:
    print("\nDone")
