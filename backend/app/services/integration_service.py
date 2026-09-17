import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.asset import Asset, AssetCriticality, AssetStatus
from app.models.integration_log import IntegrationSyncLog
from app.models.user import User
from app.schemas.integration import LegacyAssetRecord, IntegrationSyncResult
from app.services.audit_service import AuditService

# Sample legacy records to simulate legacy ERP / CMMS export
LEGACY_SAMPLE_RECORDS = [
    {
        "legacy_id": "LEG-88291",  # Matches master prompt Section 21
        "plant_tag": "EQ-TURB-09A",
        "machine_description": "Industrial Gas Combustor Turbine 45MW",
        "category_code": "ROT-TURB",
        "mfg_serial": "SN-LEG-882910-X",
        "installed_year": 2019,
        "site_location": "Legacy Bay - Pune Plant",
        "rated_priority": "CRIT"
    },
    {
        "legacy_id": "LEG-88292",
        "plant_tag": "EQ-PUMP-SLURRY-3",
        "machine_description": "Heavy Slurry Transport Pump 75kW",
        "category_code": "HYD-PUMP",
        "mfg_serial": "SN-LEG-882920-Y",
        "installed_year": 2020,
        "site_location": "Legacy Slurry Yard - Pune Plant",
        "rated_priority": "HIGH"
    },
    {
        "legacy_id": "LEG-88293",
        "plant_tag": "EQ-XFRM-OIL-1",
        "machine_description": "Mineral Oil Immersed Auxiliary Transformer",
        "category_code": "ELEC-TR",
        "mfg_serial": "SN-LEG-882930-Z",
        "installed_year": 2018,
        "site_location": "Substation Aux Yard - Chennai Complex",
        "rated_priority": "HIGH"
    },
    {
        "legacy_id": "LEG-88294",
        "plant_tag": "EQ-COMP-RECIP-2",
        "machine_description": "Reciprocating Nitrogen Booster Compressor",
        "category_code": "PNEUM-COMP",
        "mfg_serial": "SN-LEG-882940-W",
        "installed_year": 2021,
        "site_location": "Gas Skid Bay - Mumbai Terminal",
        "rated_priority": "MED"
    },
    {
        "legacy_id": "LEG-88295",
        "plant_tag": "EQ-DUPLICATE-SN",
        "machine_description": "Faulty Legacy Entry (Duplicate Serial Test)",
        "category_code": "GEN-EQUIP",
        "mfg_serial": "SN-884920",  # Duplicate serial matching AST-10042 to test duplicate rejection!
        "installed_year": 2022,
        "site_location": "Scrap Yard",
        "rated_priority": "LOW"
    }
]

CATEGORY_MAPPING = {
    "ROT-TURB": "Rotating Equipment",
    "HYD-PUMP": "Hydraulic System",
    "ELEC-TR": "Electrical Equipment",
    "PNEUM-COMP": "Pneumatics",
    "GEN-EQUIP": "General Machinery"
}

PRIORITY_MAPPING = {
    "CRIT": AssetCriticality.CRITICAL,
    "HIGH": AssetCriticality.HIGH,
    "MED": AssetCriticality.MEDIUM,
    "LOW": AssetCriticality.LOW
}

class IntegrationService:
    @staticmethod
    def get_legacy_simulator_records() -> List[Dict[str, Any]]:
        """Simulates external legacy ERP API providing legacy asset records."""
        return LEGACY_SAMPLE_RECORDS

    @staticmethod
    def sync_legacy_assets(db: Session, records: List[Dict[str, Any]], actor: User) -> IntegrationSyncResult:
        now = datetime.datetime.now(datetime.timezone.utc)
        batch_id = f"BATCH-LEG-{int(now.timestamp())}"
        sync_log_id = f"SYNC-{int(now.timestamp())}"

        records_received = len(records)
        records_processed = 0
        records_failed = 0
        errors = []

        for item in records:
            try:
                legacy_id = item.get("legacy_id")
                mfg_serial = item.get("mfg_serial")
                
                # Check for duplicate serial number or asset ID in AssetFlow
                existing_asset = db.query(Asset).filter(
                    or_(Asset.id == f"AST-{legacy_id}", Asset.serial_number == mfg_serial)
                ).first()

                if existing_asset:
                    records_failed += 1
                    err_msg = f"Duplicate Error: Asset with serial '{mfg_serial}' or ID 'AST-{legacy_id}' already exists as '{existing_asset.id}'."
                    errors.append(err_msg)
                    continue

                # Data Transformation Adapter
                mapped_type = CATEGORY_MAPPING.get(item.get("category_code"), "General Industrial Equipment")
                mapped_crit = PRIORITY_MAPPING.get(item.get("rated_priority"), AssetCriticality.MEDIUM)
                inst_year = item.get("installed_year", 2020)

                new_asset = Asset(
                    id=f"AST-{legacy_id}",
                    name=item.get("machine_description"),
                    asset_type=mapped_type,
                    model=item.get("plant_tag"),
                    serial_number=mfg_serial,
                    location=item.get("site_location"),
                    criticality=mapped_crit,
                    status=AssetStatus.OPERATIONAL,
                    installation_date=datetime.date(inst_year, 1, 1),
                    specifications=f"Imported from Legacy CMMS ({legacy_id}). Plant Tag: {item.get('plant_tag')}, Original Code: {item.get('category_code')}"
                )
                db.add(new_asset)
                records_processed += 1

            except Exception as e:
                records_failed += 1
                errors.append(f"Processing error on record {item.get('legacy_id', 'UNKNOWN')}: {str(e)}")

        # Determine overall sync status
        if records_failed == 0 and records_processed > 0:
            sync_status = "SUCCESS"
        elif records_processed > 0 and records_failed > 0:
            sync_status = "PARTIAL_SUCCESS"
        else:
            sync_status = "FAILED"

        # Log to IntegrationSyncLog
        sync_log = IntegrationSyncLog(
            id=sync_log_id,
            source_system="Legacy SAP R/3 / Legacy CMMS Simulator",
            batch_id=batch_id,
            operation="LEGACY_ASSET_IMPORT",
            records_received=records_received,
            records_processed=records_processed,
            records_failed=records_failed,
            status=sync_status,
            error_details="\n".join(errors) if errors else None,
            synced_at=now
        )
        db.add(sync_log)

        AuditService.log_action(
            db=db,
            actor=actor,
            action="LEGACY_INTEGRATION_SYNC",
            entity="INTEGRATION",
            entity_id=batch_id,
            previous_state=None,
            new_state=sync_status,
            metadata_info=f"Imported {records_processed} assets from legacy system, {records_failed} failed/skipped."
        )

        db.commit()

        return IntegrationSyncResult(
            batch_id=batch_id,
            source_system="Legacy SAP R/3 / Legacy CMMS Simulator",
            records_received=records_received,
            records_processed=records_processed,
            records_failed=records_failed,
            status=sync_status,
            errors=errors
        )

    @staticmethod
    def get_integration_logs(db: Session) -> List[IntegrationSyncLog]:
        return db.query(IntegrationSyncLog).order_by(IntegrationSyncLog.synced_at.desc()).all()
