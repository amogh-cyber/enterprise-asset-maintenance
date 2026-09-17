import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def get_auth_token(email="manager@assetflow.com"):
    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "AssetFlow@2026"
    })
    return login_res.json()["access_token"]

def test_list_assets_with_filters():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/assets?page=1&page_size=10", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 50
    assert len(data["items"]) == 10

    # Filter by criticality HIGH
    res_high = client.get("/api/v1/assets?criticality=HIGH", headers=headers)
    assert res_high.status_code == 200
    for item in res_high.json()["items"]:
        assert item["criticality"] == "HIGH"

def test_get_asset_360_detail():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/assets/AST-10042", headers=headers)
    assert response.status_code == 200
    detail = response.json()
    assert detail["id"] == "AST-10042"
    assert detail["model"] == "HVDC-CONVERTER-X"
    assert detail["serial_number"] == "SN-884920"
    assert "maintenance_requests" in detail
    assert "work_orders" in detail
    assert "pm_schedules" in detail

def test_create_and_update_asset():
    token = get_auth_token("admin@assetflow.com")
    headers = {"Authorization": f"Bearer {token}"}

    test_id = "AST-TEST-CUSTOM-1"
    new_asset = {
        "id": test_id,
        "name": "Precision Test Dynamometer",
        "asset_type": "Testing Equipment",
        "model": "DYN-TEST-2026",
        "serial_number": "SN-TEST-DYN-01",
        "location": "Pune Plant - QA Bay",
        "criticality": "MEDIUM",
        "status": "OPERATIONAL",
        "installation_date": "2026-01-10",
        "specifications": "Calibrated for dynamometer load testing."
    }
    create_res = client.post("/api/v1/assets", json=new_asset, headers=headers)
    assert create_res.status_code == 200
    assert create_res.json()["id"] == test_id

    # Update
    update_res = client.patch(f"/api/v1/assets/{test_id}", json={
        "location": "Pune Plant - Advanced Testing Lab"
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["location"] == "Pune Plant - Advanced Testing Lab"
