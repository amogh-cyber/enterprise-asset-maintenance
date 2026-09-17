from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class LegacyAssetRecord(BaseModel):
    legacy_id: str  # e.g. LEG-88291
    plant_tag: str
    machine_description: str
    category_code: str
    mfg_serial: str
    installed_year: int
    site_location: str
    rated_priority: str  # "1", "2", "3" or "CRIT", "HIGH", "MED"

class IntegrationSyncResult(BaseModel):
    batch_id: str
    source_system: str
    records_received: int
    records_processed: int
    records_failed: int
    status: str
    errors: List[str] = []

class IntegrationLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_system: str
    batch_id: str
    operation: str
    records_received: int
    records_processed: int
    records_failed: int
    status: str
    error_details: Optional[str] = None
    synced_at: datetime
