import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def get_token(email="manager@assetflow.com"):
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "AssetFlow@2026"
    })
    return res.json()["access_token"]

def test_preventive_maintenance_and_deduplication():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch schedules
    schedules_res = client.get("/api/v1/pm/schedules", headers=headers)
    assert schedules_res.status_code == 200
    schedules = schedules_res.json()
    assert len(schedules) >= 50
    overdue_count = sum(1 for s in schedules if s["is_overdue"])
    assert overdue_count >= 1

    # 2. Trigger auto-generation
    gen_res = client.post("/api/v1/pm/auto-generate", headers=headers)
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert gen_data["schedules_checked"] >= 50
    assert gen_data["work_orders_generated"] >= 1

    # 3. Trigger auto-generation AGAIN immediately: Business Rule 7 (Duplicate Prevention)
    gen_res_2 = client.post("/api/v1/pm/auto-generate", headers=headers)
    assert gen_res_2.status_code == 200
    gen_data_2 = gen_res_2.json()
    # All previously generated work orders should now be skipped because active work orders exist
    assert gen_data_2["work_orders_skipped_existing"] >= 1
