import sys
import os
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.db.seed_data import seed_db

TEST_DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_assetflow.db"))
TEST_DB_URL = f"sqlite:///{TEST_DB_FILE}"

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})

@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Apply dependency override to FastAPI app
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    # Remove old test database file if exists
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass

    # Create all tables on test engine
    Base.metadata.create_all(bind=test_engine)

    # Seed data into test database
    from app.models import (
        User, UserRole, UserStatus, TechnicianProfile,
        Asset, AssetCriticality, AssetStatus,
        MaintenanceRequest, RequestPriority, RequestStatus,
        Part, PartStatus, InventoryTransaction, InventoryTransactionType,
        PreventiveMaintenanceSchedule, PMScheduleStatus,
        AuditLog
    )
    from app.core.security import get_password_hash
    import datetime

    db = TestingSessionLocal()
    default_pwd = get_password_hash("AssetFlow@2026")

    # Seed Users
    users = [
        User(employee_id="EMP-ADMIN", name="System Administrator", email="admin@assetflow.com", hashed_password=default_pwd, department="IT", role=UserRole.ADMIN, status=UserStatus.ACTIVE),
        User(employee_id="EMP-MGR01", name="Sarah Jenkins", email="manager@assetflow.com", hashed_password=default_pwd, department="Maintenance", role=UserRole.MAINTENANCE_MANAGER, status=UserStatus.ACTIVE),
        User(employee_id="EMP-1029", name="Rajesh Kumar", email="tech@assetflow.com", hashed_password=default_pwd, department="Electrical", role=UserRole.TECHNICIAN, status=UserStatus.ACTIVE),
        User(employee_id="EMP-1030", name="Anita Sharma", email="tech2@assetflow.com", hashed_password=default_pwd, department="Mechanical", role=UserRole.TECHNICIAN, status=UserStatus.ACTIVE),
        User(employee_id="EMP-1031", name="David Miller", email="tech3@assetflow.com", hashed_password=default_pwd, department="HVAC", role=UserRole.TECHNICIAN, status=UserStatus.ACTIVE),
        User(employee_id="EMP-1032", name="Priya Nair", email="tech4@assetflow.com", hashed_password=default_pwd, department="Instrumentation", role=UserRole.TECHNICIAN, status=UserStatus.ACTIVE),
        User(employee_id="EMP-OPR01", name="Vikram Patel", email="operator@assetflow.com", hashed_password=default_pwd, department="Production", role=UserRole.OPERATOR, status=UserStatus.ACTIVE),
    ]
    db.add_all(users)
    db.commit()

    rajesh = db.query(User).filter_by(employee_id="EMP-1029").first()
    anita = db.query(User).filter_by(employee_id="EMP-1030").first()
    david = db.query(User).filter_by(employee_id="EMP-1031").first()
    priya = db.query(User).filter_by(employee_id="EMP-1032").first()

    tech_profiles = [
        TechnicianProfile(user_id=rajesh.id, specialty="Electrical", skills="Electrical, HVDC, Transformer Diagnostics", availability_status="AVAILABLE", hourly_rate=65.0),
        TechnicianProfile(user_id=anita.id, specialty="Mechanical", skills="Mechanical, Hydraulics, Turbines", availability_status="AVAILABLE", hourly_rate=60.0),
        TechnicianProfile(user_id=david.id, specialty="HVAC", skills="HVAC, Chillers, Refrigeration", availability_status="AVAILABLE", hourly_rate=55.0),
        TechnicianProfile(user_id=priya.id, specialty="Instrumentation", skills="Instrumentation, SCADA, PLC", availability_status="AVAILABLE", hourly_rate=70.0),
    ]
    db.add_all(tech_profiles)
    db.commit()

    # Seed Parts
    parts = [
        Part(id="P-20481", part_number="FAN-HVDC-48V", name="Cooling Fan", description="Cooling fan assembly", category="Electrical", stock_quantity=28, reorder_level=10, unit_cost=8500.0, warehouse_location="Warehouse B, Bay 4", status=PartStatus.ACTIVE),
        Part(id="P-10101", part_number="BRG-SKF-6205", name="Ball Bearing", category="Mechanical", stock_quantity=45, reorder_level=15, unit_cost=1250.0, warehouse_location="Warehouse A", status=PartStatus.ACTIVE),
        Part(id="P-10104", part_number="BRK-ABB-630A", name="Circuit Breaker", category="Electrical", stock_quantity=6, reorder_level=3, unit_cost=24500.0, warehouse_location="Warehouse B", status=PartStatus.ACTIVE),
        Part(id="P-10105", part_number="SNS-PT100-RTD", name="Temp Sensor", category="Instrumentation", stock_quantity=3, reorder_level=5, unit_cost=2800.0, warehouse_location="Warehouse A", status=PartStatus.ACTIVE),
    ]
    db.add_all(parts)
    db.commit()

    # Seed 52 Assets and PM Schedules
    today = datetime.date.today()
    assets = []
    schedules = []

    # Primary demo asset
    assets.append(Asset(
        id="AST-10042",
        name="HVDC Converter Station Unit 1",
        asset_type="Electrical Equipment",
        model="HVDC-CONVERTER-X",
        serial_number="SN-884920",
        location="Bangalore Facility - Substation 3",
        criticality=AssetCriticality.HIGH,
        status=AssetStatus.OPERATIONAL,
        installation_date=datetime.date(2023, 1, 15),
        last_maintenance_date=datetime.date(2026, 3, 1),
        next_maintenance_date=datetime.date(2026, 8, 28),
        specifications="High Voltage DC Converter 500kV"
    ))
    schedules.append(PreventiveMaintenanceSchedule(
        id="PM-SCH-AST-10042",
        asset_id="AST-10042",
        maintenance_type="Routine Preventive Electrical Equipment Diagnostic",
        interval_days=180,
        last_performed_date=datetime.date(2026, 3, 1),
        next_due_date=datetime.date(2026, 8, 28),
        responsible_team="Electrical Maintenance Team",
        status=PMScheduleStatus.ACTIVE
    ))

    # 51 more assets
    for i in range(1, 52):
        aid = f"AST-10{i:03d}"
        if aid == "AST-10042":
            continue
        crit = AssetCriticality.CRITICAL if i % 4 == 0 else (AssetCriticality.HIGH if i % 2 == 0 else AssetCriticality.MEDIUM)
        atype = "Electrical Equipment" if i % 3 == 0 else ("HVAC" if i % 3 == 1 else "Production Machinery")
        
        # Make a few overdue for testing
        is_over = (i <= 3)
        due_date = today - datetime.timedelta(days=15) if is_over else today + datetime.timedelta(days=30)
        
        assets.append(Asset(
            id=aid,
            name=f"Industrial Machine Unit {i}",
            asset_type=atype,
            model=f"MODEL-{i}-IND",
            serial_number=f"SN-TEST-{i:05d}",
            location="Bangalore Facility" if i % 2 == 0 else "Pune Plant",
            criticality=crit,
            status=AssetStatus.OPERATIONAL,
            installation_date=datetime.date(2022, 1, 1),
            last_maintenance_date=today - datetime.timedelta(days=60),
            next_maintenance_date=due_date
        ))
        schedules.append(PreventiveMaintenanceSchedule(
            id=f"PM-SCH-{aid}",
            asset_id=aid,
            maintenance_type=f"Routine Preventive {atype} Diagnostic",
            interval_days=90,
            last_performed_date=today - datetime.timedelta(days=60),
            next_due_date=due_date,
            responsible_team="Maintenance Team",
            status=PMScheduleStatus.ACTIVE
        ))

    db.add_all(assets)
    db.add_all(schedules)
    db.commit()

    # Demo request MR-2026-00482
    opr = db.query(User).filter_by(employee_id="EMP-OPR01").first()
    db.add(MaintenanceRequest(
        id="MR-2026-00482",
        asset_id="AST-10042",
        reporter_id=opr.id,
        title="Abnormal temperature detected",
        description="Abnormal temperature detected on HVDC cooling unit.",
        category="Electrical",
        priority=RequestPriority.HIGH,
        status=RequestStatus.OPEN
    ))
    db.commit()
    db.close()

    yield

    # Teardown
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass
