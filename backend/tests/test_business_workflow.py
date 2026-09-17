import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def get_token(email):
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "AssetFlow@2026"
    })
    return res.json()["access_token"]

def test_full_enterprise_maintenance_workflow():
    opr_token = get_token("operator@assetflow.com")
    mgr_token = get_token("manager@assetflow.com")
    tech_token = get_token("tech@assetflow.com")

    opr_headers = {"Authorization": f"Bearer {opr_token}"}
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}
    tech_headers = {"Authorization": f"Bearer {tech_token}"}

    # 1. Verify Demo Request MR-2026-00482 is OPEN
    req_res = client.get("/api/v1/requests/MR-2026-00482", headers=opr_headers)
    assert req_res.status_code == 200
    req_data = req_res.json()
    assert req_data["id"] == "MR-2026-00482"
    assert req_data["asset_id"] == "AST-10042"
    assert req_data["priority"] == "HIGH"
    assert req_data["status"] == "OPEN"

    # 2. Manager reviews and approves request -> converts to work order
    review_res = client.post("/api/v1/requests/MR-2026-00482/review", json={
        "action": "APPROVE",
        "target_priority": "HIGH"
    }, headers=mgr_headers)
    assert review_res.status_code == 200
    approved_req = review_res.json()
    assert approved_req["status"] == "CONVERTED_TO_WORK_ORDER"
    wo_id = approved_req["work_order_id"]
    assert wo_id == "WO-2026-00982"

    # Verify Asset is now UNDER_MAINTENANCE
    asset_res = client.get("/api/v1/assets/AST-10042", headers=mgr_headers)
    assert asset_res.json()["status"] == "UNDER_MAINTENANCE"

    # 3. Manager assigns Technician EMP-1029 (Rajesh Kumar)
    tech_user_res = client.get("/api/v1/users/technicians", headers=mgr_headers)
    rajesh = next(t for t in tech_user_res.json() if t["employee_id"] == "EMP-1029")
    
    assign_res = client.post(f"/api/v1/work-orders/{wo_id}/assign", json={
        "technician_id": rajesh["id"],
        "override_skill_warning": False
    }, headers=mgr_headers)
    assert assign_res.status_code == 200
    assert assign_res.json()["assigned_technician_id"] == rajesh["id"]
    assert assign_res.json()["status"] == "ASSIGNED"

    # 4. Technician starts work -> IN_PROGRESS
    start_res = client.post(f"/api/v1/work-orders/{wo_id}/status", json={
        "new_status": "IN_PROGRESS",
        "notes": "Initiated preliminary diagnostic on HVDC converter modules."
    }, headers=tech_headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "IN_PROGRESS"
    assert start_res.json()["actual_start"] is not None

    # 5. Check Spare Part P-20481 stock before consumption
    part_before = client.get("/api/v1/parts/P-20481", headers=tech_headers).json()
    initial_stock = part_before["stock_quantity"]
    assert initial_stock == 28
    unit_cost = part_before["unit_cost"]

    # 6. Consume 1x Cooling Fan (P-20481)
    consume_res = client.post(f"/api/v1/work-orders/{wo_id}/parts", json={
        "part_id": "P-20481",
        "quantity": 1,
        "notes": "Replaced worn inverter bay cooling fan assembly"
    }, headers=tech_headers)
    assert consume_res.status_code == 200
    assert consume_res.json()["quantity"] == 1
    assert consume_res.json()["unit_cost"] == 8500.0

    # Verify stock deducted in inventory
    part_after = client.get("/api/v1/parts/P-20481", headers=tech_headers).json()
    assert part_after["stock_quantity"] == 27  # Dropped from 28 to 27!

    # 7. Verify inventory transaction created
    txns = client.get("/api/v1/parts/transactions?limit=10", headers=tech_headers).json()
    wo_txn = next(t for t in txns if t["work_order_id"] == wo_id)
    assert wo_txn["transaction_type"] == "STOCK_OUT"
    assert wo_txn["quantity"] == 1
    assert wo_txn["total_cost"] == 8500.0

    # 8. Technician logs maintenance activity
    act_res = client.post(f"/api/v1/work-orders/{wo_id}/activities", json={
        "activity_type": "Component Replacement",
        "description": "De-energized inverter cabinet, replaced cooling fan P-20481, torqued brackets, performed thermal scan.",
        "hours_spent": 2.5
    }, headers=tech_headers)
    assert act_res.status_code == 200
    assert act_res.json()["hours_spent"] == 2.5

    # Verify Work Order actual cost includes part cost + labor cost
    wo_detail = client.get(f"/api/v1/work-orders/{wo_id}", headers=tech_headers).json()
    assert wo_detail["actual_cost"] >= 8500.0
    assert len(wo_detail["parts_consumed"]) == 1
    assert len(wo_detail["activities"]) == 1

    # 9. Technician marks work completed -> VALIDATION_PENDING
    complete_res = client.post(f"/api/v1/work-orders/{wo_id}/status", json={
        "new_status": "COMPLETED",
        "notes": "Work completed. Temperature tested at 42°C nominal under load."
    }, headers=tech_headers)
    assert complete_res.status_code == 200

    pending_res = client.post(f"/api/v1/work-orders/{wo_id}/status", json={
        "new_status": "VALIDATION_PENDING",
        "notes": "Submitted for Manager QA validation."
    }, headers=tech_headers)
    assert pending_res.status_code == 200

    # 10. Manager validates work
    validate_res = client.post(f"/api/v1/work-orders/{wo_id}/status", json={
        "new_status": "VALIDATED",
        "notes": "Post-maintenance operational inspection verified. Temperature logs normal."
    }, headers=mgr_headers)
    assert validate_res.status_code == 200
    assert validate_res.json()["status"] == "VALIDATED"

    # 11. Manager closes work order
    close_res = client.post(f"/api/v1/work-orders/{wo_id}/status", json={
        "new_status": "CLOSED",
        "notes": "Work order finalized and closed."
    }, headers=mgr_headers)
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "CLOSED"

    # 12. Verify Asset status restored to OPERATIONAL and last maintenance date updated
    asset_final = client.get("/api/v1/assets/AST-10042", headers=mgr_headers).json()
    assert asset_final["status"] == "OPERATIONAL"
    assert asset_final["last_maintenance_date"] is not None

    # 13. Verify Audit Logs captured the events
    audit_res = client.get("/api/v1/audit?page=1&page_size=30", headers=mgr_headers).json()
    audit_actions = [a["action"] for a in audit_res["items"]]
    assert "CONSUME_WORK_ORDER_PART" in audit_actions
    assert "LOG_MAINTENANCE_ACTIVITY" in audit_actions
    assert "APPROVE_REQUEST_CONVERT_WO" in audit_actions

def test_state_machine_invalid_transition_rejection():
    mgr_token = get_token("manager@assetflow.com")
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

    # Create a new work order in CREATED status
    new_wo = client.post("/api/v1/work-orders", json={
        "asset_id": "AST-10010",
        "title": "State machine test order",
        "description": "Testing invalid direct close transition",
        "priority": "LOW"
    }, headers=mgr_headers).json()

    wo_id = new_wo["id"]

    # Attempt illegal transition: CREATED -> CLOSED (must fail!)
    bad_res = client.post(f"/api/v1/work-orders/{wo_id}/status", json={
        "new_status": "CLOSED"
    }, headers=mgr_headers)
    assert bad_res.status_code == 400
    assert "Invalid State Transition" in bad_res.json()["detail"]

def test_negative_stock_rejection():
    tech_token = get_token("tech@assetflow.com")
    tech_headers = {"Authorization": f"Bearer {tech_token}"}

    # Attempt to consume 9999 items of a part
    bad_consume = client.post("/api/v1/work-orders/WO-2026-00982/parts", json={
        "part_id": "P-10104",
        "quantity": 9999
    }, headers=tech_headers)
    assert bad_consume.status_code == 400
    assert "Cannot consume" in bad_consume.json()["detail"] or "Insufficient" in bad_consume.json()["detail"]
