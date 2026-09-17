import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.core.security import get_password_hash
from app.models import (
    User, UserRole, UserStatus, TechnicianProfile,
    Asset, AssetCriticality, AssetStatus,
    MaintenanceRequest, RequestPriority, RequestStatus,
    WorkOrder, WorkOrderPriority, WorkOrderStatus,
    Part, PartStatus, InventoryTransaction, InventoryTransactionType,
    PreventiveMaintenanceSchedule, PMScheduleStatus,
    AuditLog
)

def seed_db():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if users already seeded
        if db.query(User).first():
            print("Database already contains data, skipping initial seed.")
            return

        print("Seeding Master Data...")
        default_pwd = get_password_hash("AssetFlow@2026")

        # 1. Users
        users = [
            User(
                employee_id="EMP-ADMIN",
                name="System Administrator",
                email="admin@assetflow.com",
                hashed_password=default_pwd,
                department="Information Technology",
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE
            ),
            User(
                employee_id="EMP-MGR01",
                name="Sarah Jenkins",
                email="manager@assetflow.com",
                hashed_password=default_pwd,
                department="Plant Maintenance Operations",
                role=UserRole.MAINTENANCE_MANAGER,
                status=UserStatus.ACTIVE
            ),
            User(
                employee_id="EMP-1029",  # As in master prompt
                name="Rajesh Kumar",
                email="tech@assetflow.com",
                hashed_password=default_pwd,
                department="Electrical Engineering",
                role=UserRole.TECHNICIAN,
                status=UserStatus.ACTIVE
            ),
            User(
                employee_id="EMP-1030",
                name="Anita Sharma",
                email="tech2@assetflow.com",
                hashed_password=default_pwd,
                department="Mechanical Maintenance",
                role=UserRole.TECHNICIAN,
                status=UserStatus.ACTIVE
            ),
            User(
                employee_id="EMP-1031",
                name="David Miller",
                email="tech3@assetflow.com",
                hashed_password=default_pwd,
                department="HVAC & Utilities",
                role=UserRole.TECHNICIAN,
                status=UserStatus.ACTIVE
            ),
            User(
                employee_id="EMP-1032",
                name="Priya Nair",
                email="tech4@assetflow.com",
                hashed_password=default_pwd,
                department="Automation & Instrumentation",
                role=UserRole.TECHNICIAN,
                status=UserStatus.ACTIVE
            ),
            User(
                employee_id="EMP-OPR01",  # As in master prompt
                name="Vikram Patel",
                email="operator@assetflow.com",
                hashed_password=default_pwd,
                department="Production Floor",
                role=UserRole.OPERATOR,
                status=UserStatus.ACTIVE
            ),
        ]
        db.add_all(users)
        db.commit()

        # Refresh users to get IDs
        tech_rajesh = db.query(User).filter_by(employee_id="EMP-1029").first()
        tech_anita = db.query(User).filter_by(employee_id="EMP-1030").first()
        tech_david = db.query(User).filter_by(employee_id="EMP-1031").first()
        tech_priya = db.query(User).filter_by(employee_id="EMP-1032").first()

        # Technician Profiles
        tech_profiles = [
            TechnicianProfile(
                user_id=tech_rajesh.id,
                specialty="Electrical",
                skills="Electrical, HVDC, Transformer Diagnostics, Power Electronics",
                certifications="High Voltage Certified, NFPA 70E",
                availability_status="AVAILABLE",
                hourly_rate=65.0
            ),
            TechnicianProfile(
                user_id=tech_anita.id,
                specialty="Mechanical",
                skills="Mechanical, Hydraulics, Turbines, Gearboxes, Alignment",
                certifications="ISO Vibration Analyst Cat II",
                availability_status="AVAILABLE",
                hourly_rate=60.0
            ),
            TechnicianProfile(
                user_id=tech_david.id,
                specialty="HVAC",
                skills="HVAC, Chillers, Refrigeration, Compressors, Cooling Towers",
                certifications="EPA Universal Refrigerant Handling",
                availability_status="AVAILABLE",
                hourly_rate=55.0
            ),
            TechnicianProfile(
                user_id=tech_priya.id,
                specialty="Instrumentation",
                skills="Instrumentation, SCADA, PLC, RTD Calibration, Pressure Sensors",
                certifications="ISA Certified Automation Professional",
                availability_status="AVAILABLE",
                hourly_rate=70.0
            ),
        ]
        db.add_all(tech_profiles)
        db.commit()

        # 2. Spare Parts Catalog
        parts = [
            Part(
                id="P-20481",  # Matches master prompt
                part_number="FAN-HVDC-48V",
                name="Cooling Fan",
                description="High-output 48V DC brushless inverter cooling fan assembly",
                category="Electrical",
                stock_quantity=28,  # Exactly 28 as specified in prompt demo scenario!
                reorder_level=10,
                unit_cost=8500.0,
                warehouse_location="Warehouse B, Bay 4, Bin 12",
                status=PartStatus.ACTIVE
            ),
            Part(
                id="P-10101",
                part_number="BRG-SKF-6205",
                name="Deep Groove Ball Bearing 6205-2RS",
                description="Sealed heavy-duty rolling bearing for drive motors",
                category="Mechanical",
                stock_quantity=45,
                reorder_level=15,
                unit_cost=1250.0,
                warehouse_location="Warehouse A, Rack 2",
                status=PartStatus.ACTIVE
            ),
            Part(
                id="P-10102",
                part_number="OIL-HYD-ISO46",
                name="Hydraulic Fluid ISO VG 46 (20L)",
                description="Anti-wear high performance hydraulic fluid for presses and lifts",
                category="Consumables",
                stock_quantity=18,
                reorder_level=8,
                unit_cost=3400.0,
                warehouse_location="Warehouse C, Drum Zone",
                status=PartStatus.ACTIVE
            ),
            Part(
                id="P-10103",
                part_number="FLT-AIR-HEPA",
                name="Industrial HEPA Air Intake Filter",
                description="99.97% particulate filter for cabinet positive pressure air intake",
                category="HVAC",
                stock_quantity=12,
                reorder_level=5,
                unit_cost=4200.0,
                warehouse_location="Warehouse B, Bay 2",
                status=PartStatus.ACTIVE
            ),
            Part(
                id="P-10104",
                part_number="BRK-ABB-630A",
                name="Molded Case Circuit Breaker 630A 3P",
                description="Thermal-magnetic trip unit MCCB 3-pole 50kA",
                category="Electrical",
                stock_quantity=6,
                reorder_level=3,
                unit_cost=24500.0,
                warehouse_location="Warehouse B, High Value Locker",
                status=PartStatus.ACTIVE
            ),
            Part(
                id="P-10105",
                part_number="SNS-PT100-RTD",
                name="PT100 Temperature Sensor Probe",
                description="3-wire platinum resistance temperature detector -50°C to 400°C",
                category="Instrumentation",
                stock_quantity=3,  # Low stock trigger!
                reorder_level=5,
                unit_cost=2800.0,
                warehouse_location="Warehouse A, Bin 8",
                status=PartStatus.ACTIVE
            ),
            Part(
                id="P-10106",
                part_number="VLV-PRV-350BAR",
                name="Proportional Pressure Relief Valve 350 Bar",
                description="Direct-operated hydraulic cartridge pressure valve",
                category="Mechanical",
                stock_quantity=2,  # Low stock trigger!
                reorder_level=4,
                unit_cost=18900.0,
                warehouse_location="Warehouse A, Rack 5",
                status=PartStatus.ACTIVE
            ),
            Part(
                id="P-10107",
                part_number="PLC-IO-DI16",
                name="Digital Input Module 16-Channel 24VDC",
                description="Fast optical isolated digital inputs for Siemens/Allen Bradley racks",
                category="Instrumentation",
                stock_quantity=8,
                reorder_level=4,
                unit_cost=15200.0,
                warehouse_location="Warehouse B, Shelf 1",
                status=PartStatus.ACTIVE
            ),
            Part(
                id="P-10108",
                part_number="BELT-V-B90",
                name="Industrial V-Belt Heavy Duty B-90",
                description="Heat and oil resistant wrapped cogged drive belt",
                category="Mechanical",
                stock_quantity=22,
                reorder_level=10,
                unit_cost=950.0,
                warehouse_location="Warehouse A, Rack 1",
                status=PartStatus.ACTIVE
            ),
            Part(
                id="P-10109",
                part_number="GSK-FLG-DN100",
                name="Spiral Wound Flange Gasket DN100 PN40",
                description="Graphite filled 316SS inner and outer ring pipe gasket",
                category="Mechanical",
                stock_quantity=35,
                reorder_level=15,
                unit_cost=650.0,
                warehouse_location="Warehouse A, Bin 19",
                status=PartStatus.ACTIVE
            ),
        ]
        db.add_all(parts)
        db.commit()

        # Initial stock-in transactions for parts
        admin_user = db.query(User).filter_by(employee_id="EMP-ADMIN").first()
        for p in parts:
            txn = InventoryTransaction(
                id=f"TXN-INIT-{p.id}",
                part_id=p.id,
                transaction_type=InventoryTransactionType.STOCK_IN,
                quantity=p.stock_quantity,
                unit_cost=p.unit_cost,
                total_cost=p.stock_quantity * p.unit_cost,
                performed_by_id=admin_user.id,
                notes="Initial warehouse inventory baseline count",
                timestamp=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)
            )
            db.add(txn)
        db.commit()

        # 3. 50+ Realistic Industrial Assets
        asset_templates = [
            # The exact primary prompt asset
            ("AST-10042", "HVDC Converter Station Unit 1", "Electrical Equipment", "HVDC-CONVERTER-X", "SN-884920", "Bangalore Facility - Substation 3", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 180),
            
            # Additional assets across plant areas
            ("AST-10010", "Main Substation Step-Down Transformer 33kV/415V", "Electrical Equipment", "ABB-RESIN-2500KVA", "SN-TR-449102", "Bangalore Facility - Substation 1", AssetCriticality.CRITICAL, AssetStatus.OPERATIONAL, 90),
            ("AST-10011", "Centrifugal Chilled Water Compressor 01", "HVAC", "TRANE-CVHE-500", "SN-CH-992182", "Bangalore Facility - Utility Bldg", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 60),
            ("AST-10012", "CNC 5-Axis Precision Milling Center", "Production Machinery", "DMG-MORI-DMU-50", "SN-CNC-332918", "Bangalore Facility - Machine Shop", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 30),
            ("AST-10013", "High Pressure Steam Boiler 15 TPH", "Thermal Utilities", "THERMAX-COMBIPAC", "SN-BLR-118273", "Bangalore Facility - Boiler House", AssetCriticality.CRITICAL, AssetStatus.OPERATIONAL, 45),
            ("AST-10014", "Hydraulic Stamping Press 800 Ton", "Heavy Machinery", "SCHULER-HYD-800", "SN-PRS-772183", "Pune Plant - Press Shop", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 60),
            ("AST-10015", "Rotary Screw Air Compressor 110kW", "Pneumatics", "ATLAS-COPCO-GA110", "SN-CMP-558291", "Pune Plant - Utility Room", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 90),
            ("AST-10016", "Automated Robotic Spot Welding Cell 4", "Robotics", "KUKA-KR-QUANTEC", "SN-ROB-991201", "Pune Plant - Body Assembly", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 30),
            ("AST-10017", "Overhead Traveling Crane 25 Ton", "Lifting & Rigging", "DEMAG-EKKE-25T", "SN-CRN-442188", "Pune Plant - Heavy Bay", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 180),
            ("AST-10018", "Natural Gas Microturbine Generator 200kW", "Power Generation", "CAPSTONE-C200", "SN-GEN-883912", "Pune Plant - Co-Gen Area", AssetCriticality.CRITICAL, AssetStatus.UNDER_MAINTENANCE, 90),
            ("AST-10019", "Cooling Tower Induced Draft Fan Cell A", "HVAC", "SPX-MARLEY-NC8400", "SN-CT-129034", "Bangalore Facility - Roof Yard", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 120),
            ("AST-10020", "Surface Grinding Machine Heavy Duty", "Production Machinery", "CHEVALIER-FSG-3A1224", "SN-GRD-552819", "Bangalore Facility - Tool Room", AssetCriticality.LOW, AssetStatus.OPERATIONAL, 180),
            
            # Chennai Complex
            ("AST-10021", "Plastic Injection Molding Machine 450T", "Molding Equipment", "ENGEL-VICTORY-450", "SN-INJ-771829", "Chennai Complex - Molding Div", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 45),
            ("AST-10022", "Multi-Stage Boiler Feed Water Pump", "Hydraulic System", "KBL-KS-50-12", "SN-PMP-339182", "Chennai Complex - Utility Plant", AssetCriticality.CRITICAL, AssetStatus.OPERATIONAL, 60),
            ("AST-10023", "Emergency Diesel Generator 1250kVA", "Power Generation", "CUMMINS-QST30-G4", "SN-DG-902188", "Chennai Complex - DG Yard", AssetCriticality.CRITICAL, AssetStatus.OPERATIONAL, 30),
            ("AST-10024", "Paint Shop Electrodeposition (ED) Dip Tank", "Finishing Line", "DURR-ECO-COAT", "SN-PNT-441290", "Chennai Complex - Paint Shop", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 90),
            ("AST-10025", "Packaging Line Automated Palletizer", "Packaging", "FANUC-M-410iC", "SN-PAL-662819", "Chennai Complex - Warehouse 1", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 90),
            ("AST-10026", "Reverse Osmosis Water Purification Plant", "Water Treatment", "THERMAX-RO-50M3", "SN-WTP-110294", "Chennai Complex - WTP Area", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 60),
            ("AST-10027", "Industrial Air Handling Unit AHU-04", "HVAC", "VOLTAS-AHU-DOUBLE-SKIN", "SN-AHU-882910", "Chennai Complex - Clean Room 2", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 90),
            ("AST-10028", "Effluent Treatment Aeration Blower 45kW", "Environmental Systems", "KOBELCO-SCREW-BLOWER", "SN-ETP-339184", "Chennai Complex - ETP Unit", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 90),
            ("AST-10029", "Motor Control Center MCC-B02", "Electrical Equipment", "SCHNEIDER-BLOKSET", "SN-MCC-773819", "Chennai Complex - Electrical Rm 2", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 180),
            ("AST-10030", "Laser Sheet Metal Cutting Machine 6kW", "Fabrication", "TRUMPF-TRULASER-3030", "SN-LSR-991823", "Chennai Complex - Sheet Metal", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 30),
            
            # Hyderabad Tech Center & R&D
            ("AST-10031", "Environmental Thermal Shock Test Chamber", "Testing & QC", "WEISS-TECHNIK-TS-130", "SN-ENV-112948", "Hyderabad Tech Center - Test Lab", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 90),
            ("AST-10032", "High Precision Coordinate Measuring Machine", "Metrology", "ZEISS-PRISMO-NAVIGATOR", "SN-CMM-662810", "Hyderabad Tech Center - Metrology", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 90),
            ("AST-10033", "Cleanroom Precision Air Chiller", "HVAC", "DAIKIN-MAGNARING-200", "SN-CHL-449102", "Hyderabad Tech Center - Cleanroom", AssetCriticality.CRITICAL, AssetStatus.OPERATIONAL, 60),
            ("AST-10034", "Uninterruptible Power Supply (UPS) 500kVA", "Electrical Equipment", "EATON-POWER-XPERT-9395", "SN-UPS-883910", "Hyderabad Tech Center - Server Hall", AssetCriticality.CRITICAL, AssetStatus.OPERATIONAL, 90),
            ("AST-10035", "Vibration Shaker Fatigue Testing System", "Testing & QC", "IMV-ECO-EM2605", "SN-SHK-771920", "Hyderabad Tech Center - Reliability", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 180),
            
            # Mumbai Terminal & Logistics
            ("AST-10036", "Fuel Transfer Booster Pump Station", "Fluid Systems", "FLOWSERVE-HPX-6X4", "SN-PMP-559102", "Mumbai Terminal - Tank Farm 4", AssetCriticality.CRITICAL, AssetStatus.OPERATIONAL, 60),
            ("AST-10037", "Heavy Electric Reach Stacker 45T", "Material Handling", "KALMAR-GLORIA-DRG", "SN-STK-338192", "Mumbai Terminal - Container Yard", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 45),
            ("AST-10038", "Nitrogen Inerting Generation Skid 99.9%", "Process Systems", "PARKER-NITROFLOW", "SN-N2-882910", "Mumbai Terminal - Skid Bay 1", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 90),
            ("AST-10039", "Vapor Recovery Unit (VRU) Hydrocarbon", "Environmental Systems", "JOHN-ZINK-VRU-1200", "SN-VRU-441029", "Mumbai Terminal - Loading Rack", AssetCriticality.CRITICAL, AssetStatus.OPERATIONAL, 90),
            ("AST-10040", "Subsea Hydraulic Power Unit HPU 250Bar", "Hydraulic System", "OCEANEERING-HPU-250", "SN-HPU-992819", "Mumbai Terminal - Marine Wharf", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 60),
            
            # Plant Expansion Assets (41 to 55)
            ("AST-10041", "High Speed Robotic Pick-and-Place Gantry", "Automation", "BOSCH-REXROTH-GANTRY-4", "SN-GNT-102948", "Bangalore Facility - Packaging", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 60),
            ("AST-10043", "Industrial Gas Chromatography Spectrometer", "Analytical", "AGILENT-8890-GC", "SN-ANA-662910", "Bangalore Facility - QA Lab", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 180),
            ("AST-10044", "Fluidized Bed Heat Treatment Furnace 900C", "Thermal Utilities", "SECO-WARWICK-FBF", "SN-FRN-773829", "Bangalore Facility - Heat Treat", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 45),
            ("AST-10045", "Vertical Machining Center VMC-850", "Production Machinery", "HAAS-VF-4SS", "SN-VMC-229104", "Pune Plant - Machine Shop 2", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 60),
            ("AST-10046", "Industrial Waste Shredder Dual Shaft 75kW", "Recycling & Waste", "WEIMA-WLK-1500", "SN-SHR-884910", "Pune Plant - Scrap Yard", AssetCriticality.LOW, AssetStatus.OPERATIONAL, 90),
            ("AST-10047", "Dry Type Cast Resin Distribution Transformer", "Electrical Equipment", "SIEMENS-GEAFOL-1600", "SN-TR-339182", "Pune Plant - Substation B", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 180),
            ("AST-10048", "Screw Chiller Water Cooled 350TR", "HVAC", "CARRIER-23XRV", "SN-CHL-992104", "Pune Plant - Utility Cell", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 90),
            ("AST-10049", "Automatic Guided Vehicle (AGV) Fleet Master", "Logistics Automation", "KION-DEMATIC-EGV", "SN-AGV-448192", "Pune Plant - Assembly Line 1", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 30),
            ("AST-10050", "Centrifugal Oil Purifier Separator 3000LPH", "Lubrication Systems", "ALFA-LAVAL-MOPX-205", "SN-SEP-119284", "Bangalore Facility - Oil Cellar", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 90),
            ("AST-10051", "Industrial X-Ray Weld Inspection System", "Non-Destructive Testing", "WAYGATE-SEIFERT-XRAY", "SN-NDT-558291", "Chennai Complex - Inspection Lab", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 180),
            ("AST-10052", "High Pressure Hydrostatic Test Bench 1000Bar", "Testing Equipment", "MAXIMATOR-TEST-BENCH", "SN-MAX-992814", "Chennai Complex - Valve Testing", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 90),
            ("AST-10053", "Heavy Gantry Milling Machine 12m Bed", "Heavy Machining", "WALDRICH-COBURG-TAURUS", "SN-MIL-330194", "Pune Plant - Heavy Machine Shop", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 120),
            ("AST-10054", "Thermal Oxidizer Volatile Emission Scrubber", "Environmental Systems", "DURR-OXI-CAT-3000", "SN-ENV-884912", "Pune Plant - Coating Unit", AssetCriticality.CRITICAL, AssetStatus.OPERATIONAL, 60),
            ("AST-10055", "Induction Hardening Machine Dual Spindle", "Thermal Utilities", "EMA-INDUCTION-HARDENER", "SN-IND-110294", "Bangalore Facility - Shaft Line", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 90),
            ("AST-10056", "Automated Clean-in-Place (CIP) Skid Unit", "Sanitary Process", "ALFA-LAVAL-CIP-400", "SN-CIP-772910", "Chennai Complex - Bio Facility", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 60),
            ("AST-10057", "High Torque Electric Screwdriving Station", "Assembly Automation", "ATLAS-COPCO-POWER-FOCUS", "SN-SCR-338190", "Pune Plant - Sub-Assembly", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 90),
            ("AST-10058", "Multi-Zone Nitrogen Reflow Soldering Oven", "Electronics Assembly", "HELLER-1809-MK5", "SN-RFL-449102", "Bangalore Facility - SMT Line", AssetCriticality.HIGH, AssetStatus.OPERATIONAL, 30),
            ("AST-10059", "Ultrasonic Cleaning & Degreasing Tank", "Surface Prep", "BRANSON-IC-SERIES", "SN-USC-992104", "Bangalore Facility - Precision Bay", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 120),
            ("AST-10060", "Industrial Dust Collection Cyclone Unit", "Environmental Systems", "DONALDSON-TORIT-DFE", "SN-DST-662819", "Pune Plant - Foundry Area", AssetCriticality.MEDIUM, AssetStatus.OPERATIONAL, 90),
            ("AST-10061", "Battery Energy Storage System (BESS) 1MWh", "Power Storage", "TESLA-MEGAPACK-2XL", "SN-BES-118293", "Bangalore Facility - Grid Yard", AssetCriticality.CRITICAL, AssetStatus.OPERATIONAL, 90),
        ]

        today = datetime.date.today()
        assets = []
        schedules = []

        for item in asset_templates:
            aid, name, atype, model, sn, loc, crit, stat, interval = item
            last_maint = today - datetime.timedelta(days=interval - 10)
            next_maint = today + datetime.timedelta(days=10)
            
            # Specifically for AST-10042 as per Master Prompt Section 17 & 55:
            # Interval: 180 days, Last maintenance: 01-Mar-2026, Next maintenance: 28-Aug-2026 (OVERDUE in Sept 2026!)
            if aid == "AST-10042":
                last_maint = datetime.date(2026, 3, 1)
                next_maint = datetime.date(2026, 8, 28)
            
            asset = Asset(
                id=aid,
                name=name,
                asset_type=atype,
                model=model,
                serial_number=sn,
                location=loc,
                criticality=crit,
                status=stat,
                installation_date=datetime.date(2023, 1, 15),
                last_maintenance_date=last_maint,
                next_maintenance_date=next_maint,
                specifications=f"Industrial grade {atype}. Rated voltage/power per OEM specifications. Certified for continuous factory duty."
            )
            assets.append(asset)

            # Preventive maintenance schedule
            sched = PreventiveMaintenanceSchedule(
                id=f"PM-SCH-{aid}",
                asset_id=aid,
                maintenance_type=f"Routine Preventive {atype} Diagnostic",
                interval_days=interval,
                last_performed_date=last_maint,
                next_due_date=next_maint,
                responsible_team="Electrical Maintenance Team" if "Electrical" in atype else "Mechanical Maintenance Team",
                status=PMScheduleStatus.ACTIVE
            )
            schedules.append(sched)

        db.add_all(assets)
        db.add_all(schedules)
        db.commit()

        # 4. Master Demonstration Maintenance Request (MR-2026-00482)
        # As per Master Prompt Section 8 & 55:
        # Request ID: MR-2026-00482
        # Asset: AST-10042
        # Problem: Abnormal temperature detected
        # Priority: HIGH
        # Reported by: Operator (Vikram Patel)
        # Status: OPEN
        opr_user = db.query(User).filter_by(employee_id="EMP-OPR01").first()
        demo_request = MaintenanceRequest(
            id="MR-2026-00482",
            asset_id="AST-10042",
            reporter_id=opr_user.id,
            title="Abnormal temperature detected",
            description="During shift thermal imaging inspection, cooling bay transformer module exhibited abnormal temperature rise exceeding 85°C threshold under nominal load.",
            category="Electrical",
            priority=RequestPriority.HIGH,
            status=RequestStatus.OPEN
        )
        db.add(demo_request)
        db.commit()

        # 5. Baseline Audit Log
        audit = AuditLog(
            actor_id=admin_user.id,
            actor_name=admin_user.name,
            actor_role=admin_user.role.value,
            action="SYSTEM_INIT_SEED",
            entity="SYSTEM",
            entity_id="MASTER_DATA_SEED",
            previous_state=None,
            new_state="INITIALIZED",
            metadata_info="Initialized 50+ master assets, technicians, parts inventory, and baseline demonstration scenario.",
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(audit)
        db.commit()

        print("Master data seeded successfully with >50 assets, parts, users, and demonstration request!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
