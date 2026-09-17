import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def get_token(email="admin@assetflow.com"):
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "AssetFlow@2026"
    })
    return res.json()["access_token"]

def test_legacy_integration_simulator_and_sync():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch simulator records
    sim_res = client.get("/api/v1/integrations/simulator/records", headers=headers)
    assert sim_res.status_code == 200
    records = sim_res.json()
    assert len(records) >= 5
    assert any(r["legacy_id"] == "LEG-88291" for r in records)

    # 2. Trigger sync
    sync_res = client.post("/api/v1/integrations/sync-legacy", headers=headers)
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["records_received"] >= 5
    assert sync_data["records_processed"] >= 4
    # The duplicate record LEG-88295 has serial SN-884920 which matches AST-10042, so it should fail!
    assert sync_data["records_failed"] >= 1
    assert sync_data["status"] == "PARTIAL_SUCCESS"

    # 3. Verify sync logs
    logs_res = client.get("/api/v1/integrations/logs", headers=headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) >= 1
    assert logs[0]["status"] == "PARTIAL_SUCCESS"

    # 4. Verify newly imported asset exists in master
    imported_asset_res = client.get("/api/v1/assets/AST-LEG-88291", headers=headers)
    assert imported_asset_res.status_code == 200
    imported = imported_asset_res.json()
    assert imported["id"] == "AST-LEG-88291"
    assert imported["criticality"] == "CRITICAL"
