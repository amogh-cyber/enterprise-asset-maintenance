# AssetFlow: Enterprise Asset Maintenance & Work Order Management System

> **A Production-Grade Enterprise Platform Inspired by SAP S/4HANA Plant Maintenance (SAP PM / EAM)**  
> Developed for Associate Systems Engineer / SAP S/4HANA ABAP Developer Portfolio demonstration.

---

## 1. Executive Summary & Business Problem

Industrial plants, electrical substations, and manufacturing complexes operate critical capital assets where unexpected equipment failure causes expensive downtime, safety hazards, and supply chain disruptions. 

**AssetFlow** is a layered, enterprise-grade asset lifecycle management and work-order execution platform. It models real industrial business processes—from initial problem detection and manager review to technician assignment, atomic spare-part consumption, skill verification, preventive maintenance scheduling, legacy ERP integration, and regulatory compliance audit logging.

The user interface features a **modern, crisp light enterprise theme** (no dark colors) adhering to enterprise readability, high contrast, clean typography, and responsive controls.

---

## 2. Core Business Workflow & Lifecycle

The platform strictly enforces the end-to-end operational lifecycle:

```
OPERATOR REPORTS DEFECT (Maintenance Request: MR-2026-00482)
       │
       ▼
REQUEST VALIDATION & MANAGER REVIEW
       │
       ├─► [REJECTED] (Mandatory reason required)
       │
       ▼ [APPROVED]
WORK ORDER CONVERSION (WO-2026-00982) & ASSET STATUS: UNDER_MAINTENANCE
       │
       ▼
SKILL-BASED TECHNICIAN SCHEDULING (EMP-1029: Rajesh Kumar)
       │
       ▼
MAINTENANCE EXECUTION (Status: IN_PROGRESS)
       │
       ├─► ATOMIC SPARE PART CONSUMPTION (P-20481: Cooling Fan 28 -> 27)
       │   └─► STOCK_OUT Transaction & Work Order Actual Cost Update
       │
       ├─► LABOR CONFIRMATION (Hours spent logged by technician)
       │
       ▼
WORK COMPLETION (Status: COMPLETED -> VALIDATION_PENDING)
       │
       ▼
MANAGER QA VALIDATION (Status: VALIDATED)
       │
       ▼
ORDER CLOSURE (Status: CLOSED)
       │
       ├─► Asset status restored to OPERATIONAL
       ├─► Asset last_maintenance_date updated to current timestamp
       ├─► Audit trail immutable record created
       └─► Dashboard operational metrics updated in real-time
```

---

## 3. Technology Stack

- **Frontend**:
  - React 18 with TypeScript
  - Vite build tool (fast bundling and zero-config compilation)
  - React Router 6 (SPA routing with protected routes)
  - Tailwind CSS (Clean light enterprise color palette: SAP Blue `#006ec6`, Slate canvas `#f8fafc`, crisp white cards)
  - Axios (centralized client with JWT request/response interceptors)
  - Lucide React (industrial icons)

- **Backend**:
  - Python 3.10+
  - FastAPI (REST API framework with automated OpenAPI/Swagger documentation)
  - Pydantic v2 (type-safe request/response schema validation)
  - SQLAlchemy 2.0 (Relational ORM with transaction support)
  - Passlib + BCrypt (secure salted password hashing)
  - Python-Jose (stateless JWT tokens)
  - Pytest + HTTPX (automated unit, integration, and state-machine tests)

- **Database**:
  - PostgreSQL 15 (primary production database)
  - SQLite with `PRAGMA foreign_keys = ON` (zero-setup local development fallback)

- **DevOps & Containerization**:
  - Docker & Docker Compose (`docker-compose.yml` orchestrating PostgreSQL, Redis, Backend, and Frontend)
  - GitHub Actions CI workflow (`.github/workflows/ci.yml`)

---

## 4. SAP S/4HANA & Enterprise ERP Alignment

AssetFlow explicitly models enterprise ERP concepts:

| Enterprise Concept | AssetFlow Implementation | SAP S/4HANA PM / MM Equivalent |
|---|---|---|
| **Master Data: Equipment** | `Asset` (`AST-10042`, specifications, serial) | Equipment Master (`IE01` / `IE03`, Table `EQUI`) |
| **Transactional: Problem Defect** | `MaintenanceRequest` (`MR-2026-00482`) | Maintenance Notification (`IW21` / `IW23`, Table `QMEL`) |
| **Transactional: Maintenance Order** | `WorkOrder` (`WO-2026-00982`, planned/actual cost) | Maintenance Order (`IW31` / `IW32`, Table `AUFK`, `AFIH`) |
| **Inventory: Parts Consumption** | `consumeWorkOrderPart` (atomic stock deduction) | Goods Issue Movement 261 (`MIGO`, Table `MSEG`, `RESB`) |
| **Labor: Activity Confirmation** | `WorkOrderActivity` (hours spent, labor rate) | Time & Activity Confirmation (`IW41`, Table `AFRU`) |
| **Technical Completion** | `VALIDATION_PENDING` -> `VALIDATED` | Technical Completion (`TECO`) |
| **Business Completion** | `VALIDATED` -> `CLOSED` | Business Close (`CLSD`) |
| **Preventive Maintenance** | `PreventiveMaintenanceSchedule` + Auto-Gen | Maintenance Plan / Strategy (`IP01` / `IP10` / `IP30`) |

### Dedicated ABAP Learning Component
A complete, documented ABAP report program is available in [`abap/ZASSETFLOW_MAINT_REP.abap`](file:///c:/Users/AMOGH%20HL/OneDrive/Desktop/SAP+P/abap/ZASSETFLOW_MAINT_REP.abap) and inside the web portal at `/sap-alignment`. It demonstrates:
- ABAP Data Dictionary structures and internal tables (`gt_orders TYPE STANDARD TABLE OF ty_work_order`)
- Selection screens with `PARAMETERS` and `SELECT-OPTIONS`
- Authorization checks (`AUTHORITY-CHECK OBJECT 'I_TCODE' ID 'TCD' FIELD 'IW33'`)
- Open SQL query structures simulating queries on `AUFK`, `AFIH`, and `EQUI`

---

## 5. Quick Start & Local Execution Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup & Run
From the root project directory:
```powershell
# Navigate to backend and install dependencies
cd backend
pip install -r requirements.txt

# Seed master database (52 assets, technicians, parts, PM schedules)
python -m app.db.seed_data

# Start the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The interactive API documentation is available at: **http://127.0.0.1:8000/api/v1/docs**

### 2. Frontend Setup & Run
In a new terminal window:
```powershell
cd frontend
npm install
npm run dev
```
Open your browser at: **http://localhost:5173**

---

## 6. Demonstration Scenario & Default Credentials

AssetFlow includes a **1-Click Demo Persona Bar** in the top navigation bar, allowing immediate role switching without manual logout/login:

| Persona | Email | Password | Role & Permissions |
|---|---|---|---|
| **Operator** | `operator@assetflow.com` | `AssetFlow@2026` | Report problems on equipment, track submitted requests |
| **Maintenance Manager** | `manager@assetflow.com` | `AssetFlow@2026` | Review/approve requests, assign technicians, validate & close orders |
| **Technician** | `tech@assetflow.com` | `AssetFlow@2026` | Rajesh Kumar (`EMP-1029`): start work, consume parts, log activity |
| **System Admin** | `admin@assetflow.com` | `AssetFlow@2026` | Master data administration, audit inspection, system sync |

### End-to-End Walkthrough Scenario
1. **Login as Operator** -> Open **Assets**, select `AST-10042` -> Click **Report Maintenance Problem** (`MR-2026-00482`: "Abnormal temperature detected").
2. **Switch to Manager** -> Open **Requests** -> Click **Review & Approve** on `MR-2026-00482`. System approves request, converts to Work Order `WO-2026-00982`, and sets asset to `UNDER_MAINTENANCE`.
3. **Assign Technician** -> Open `WO-2026-00982` -> Click **Assign Technician**, select Rajesh Kumar (`EMP-1029`).
4. **Switch to Technician** -> Click **Start Work** (`IN_PROGRESS`).
5. **Consume Part** -> Click **Consume Part**, select `P-20481` (Cooling Fan), enter quantity `1`. Stock drops from 28 to 27, inventory transaction `STOCK_OUT` is created, and order actual cost increases.
6. **Log Activity** -> Click **Log Labor Hours**, enter 2.5 hours.
7. **Complete Work** -> Click **Mark Completed**, then **Submit for QA Validation**.
8. **Switch to Manager** -> Click **Validate Work**, then **Finalize & Close Order**. Asset status restores to `OPERATIONAL`.
9. **Inspect Dashboard & Audit Logs** -> Notice live updated operational KPIs and complete immutable audit trail.

---

## 7. Automated Test Suite

To run all automated backend tests:
```powershell
pytest backend/tests -v
```

Tests verify:
- JWT Authentication & RBAC restrictions (`test_auth.py`)
- Asset Master CRUD & 360-degree queries (`test_assets.py`)
- Full Enterprise Business Workflow scenario (`test_business_workflow.py`)
- State Machine illegal transition rejection (`test_business_workflow.py`)
- Negative stock rejection (`test_business_workflow.py`)
- Preventive Maintenance Overdue Detection & Duplicate Prevention (`test_pm.py`)
- Legacy ERP Simulator Data Cleansing & Sync Adapter (`test_legacy_integration.py`)

---

## 8. Docker Deployment

To launch the full containerized stack:
```powershell
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/v1`
- PostgreSQL: `localhost:5432`
