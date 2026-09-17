# AssetFlow: Enterprise Quality Assurance & Test Case Specification

This document details the formal test cases covering the complete lifecycle of physical industrial assets, work order state machines, atomic parts consumption, technician scheduling, preventive maintenance deduplication, and regulatory audit trail.

---

## Summary Matrix

| Test Case ID | Test Category | Target Component / Service | Execution Result | Status |
|---|---|---|---|---|
| **TC-AUTH-001** | Security & Auth | JWT Token Authentication | Bearer token generated, valid payload decoded | **PASSED** |
| **TC-AUTH-002** | Security & RBAC | Role-Based Access Enforcement | Operator blocked from manager review APIs | **PASSED** |
| **TC-AST-001** | Master Data | Asset 360 Detail Retrieval | Returns specs, open orders, requests, PM | **PASSED** |
| **TC-AST-002** | Business Rules | Inactive Asset Problem Prevention | Rejects problem reports on retired assets | **PASSED** |
| **TC-AST-003** | Business Rules | Active Critical Order Asset Lock | Prevents retiring asset with critical open order | **PASSED** |
| **TC-REQ-001** | Workflow | Maintenance Request Submission | Operator reports problem -> Status becomes OPEN | **PASSED** |
| **TC-REQ-002** | Workflow | Manager Review & WO Conversion | Approved request auto-converts to Work Order | **PASSED** |
| **TC-WO-001** | State Machine | Strict Status Transitions | Valid transitions succeed, illegal jumps rejected | **PASSED** |
| **TC-WO-002** | Scheduling | Skill-Based Technician Assignment | Verifies electrical skill vs electrical gear | **PASSED** |
| **TC-INV-001** | Transactions | Atomic Spare Part Consumption | Decrements stock, logs transaction, updates cost | **PASSED** |
| **TC-INV-002** | Business Rules | Negative Inventory Prevention | Rejects consumption exceeding stock count | **PASSED** |
| **TC-PM-001** | Scheduling | Overdue PM Work Order Generation | Generates orders for overdue assets | **PASSED** |
| **TC-PM-002** | Business Rules | Duplicate PM Order Prevention | Skips schedule if active order is in progress | **PASSED** |
| **TC-INT-001** | Integration | Legacy ERP Data Transformation | Maps legacy fields, rejects duplicate serials | **PASSED** |
| **TC-AUD-001** | Compliance | End-to-End Audit Trail Traceability | Every lifecycle event creates immutable record | **PASSED** |

---

## Detailed Test Case Specifications

### TC-WO-001: Strict Work Order State Machine Transitions
- **Objective**: Verify that work orders transition only along valid operational pathways (`CREATED` -> `APPROVED` -> `ASSIGNED` -> `IN_PROGRESS` -> `COMPLETED` -> `VALIDATION_PENDING` -> `VALIDATED` -> `CLOSED`).
- **Preconditions**: User is authenticated with appropriate role. Work Order exists.
- **Test Data**: Work Order `WO-2026-00982` in status `CREATED`.
- **Steps**:
  1. Attempt to send `POST /api/v1/work-orders/WO-2026-00982/status` with `new_status: "CLOSED"`.
  2. Attempt valid transition: `CREATED` -> `APPROVED` -> `ASSIGNED` -> `IN_PROGRESS`.
- **Expected Result**: Direct jump to `CLOSED` returns HTTP 400 Bad Request ("Invalid State Transition"). Orderly transitions return HTTP 200.
- **Actual Result**: Verified in automated test suite `test_state_machine_invalid_transition_rejection`. HTTP 400 returned with message "Invalid State Transition".
- **Status**: **PASSED**

---

### TC-INV-001: Atomic Spare Part Consumption & Cost Calculation
- **Objective**: Verify that consuming a spare part on a work order deducts stock quantity, generates an `InventoryTransaction` (`STOCK_OUT`), creates a `WorkOrderPart` record, and recalculates order `actual_cost` atomically.
- **Preconditions**: Asset `AST-10042` has Work Order `WO-2026-00982` in `IN_PROGRESS`. Part `P-20481` (Cooling Fan) has initial stock of 28 at unit cost $8,500.00.
- **Steps**:
  1. Request `POST /api/v1/work-orders/WO-2026-00982/parts` with `part_id: "P-20481"`, `quantity: 1`.
  2. Inspect Part `P-20481` stock level.
  3. Inspect `inventory_transactions` table.
  4. Inspect Work Order `WO-2026-00982` `actual_cost`.
- **Expected Result**:
  - Stock drops from 28 to 27.
  - Transaction record `TXN-*` created with type `STOCK_OUT` and total cost $8,500.00.
  - Work Order actual cost increased by $8,500.00.
- **Actual Result**: Tested in `test_full_enterprise_maintenance_workflow`. Stock verified at 27, transaction confirmed, actual cost updated.
- **Status**: **PASSED**

---

### TC-PM-002: Preventive Maintenance Duplicate Prevention
- **Objective**: Verify that when the PM auto-generation engine runs, it detects overdue schedules and spawns work orders, but skips any schedule that already has an active work order in progress.
- **Preconditions**: Database contains active PM schedules where `next_due_date <= today`.
- **Steps**:
  1. Call `POST /api/v1/pm/auto-generate`. Record number of generated orders.
  2. Immediately call `POST /api/v1/pm/auto-generate` a second time.
- **Expected Result**: First call generates orders. Second call skips generating duplicate orders (`work_orders_skipped_existing >= 1`) because active orders exist.
- **Actual Result**: Verified in `test_preventive_maintenance_and_deduplication`. Duplicate work orders prevented.
- **Status**: **PASSED**

---

### TC-INT-001: Legacy ERP Adapter & Duplicate Rejection
- **Objective**: Verify that legacy asset records (`LEG-88291`) are validated, mapped to AssetFlow schema (`AST-LEG-88291`), and duplicate records (e.g. matching serial number `SN-884920`) are rejected and logged to `integration_sync_logs`.
- **Preconditions**: Legacy simulator provides 5 records, including 1 record with duplicate serial `SN-884920`.
- **Steps**:
  1. Call `POST /api/v1/integrations/sync-legacy`.
  2. Check sync status and counts.
  3. Query `integration_sync_logs`.
- **Expected Result**: Batch returns status `PARTIAL_SUCCESS`. Valid records imported; duplicate serial rejected with logged error message.
- **Actual Result**: Verified in `test_legacy_integration_simulator_and_sync`. 4 records processed, 1 rejected, status logged as `PARTIAL_SUCCESS`.
- **Status**: **PASSED**
