import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def test_login_success():
    response = client.post("/api/v1/auth/login", json={
        "email": "manager@assetflow.com",
        "password": "AssetFlow@2026"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "manager@assetflow.com"
    assert data["user"]["role"] == "MAINTENANCE_MANAGER"

def test_login_invalid_password():
    response = client.post("/api/v1/auth/login", json={
        "email": "manager@assetflow.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]

def test_get_current_user_profile():
    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@assetflow.com",
        "password": "AssetFlow@2026"
    })
    token = login_res.json()["access_token"]

    # Access /me
    me_res = client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "admin@assetflow.com"
    assert me_res.json()["role"] == "ADMIN"

def test_unauthorized_access():
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
