from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from app.models.pm_schedule import PMScheduleStatus

class PMScheduleBase(BaseModel):
    asset_id: str
    maintenance_type: str
    interval_days: int = 90
    last_performed_date: Optional[date] = None
    next_due_date: date
    responsible_team: str = "Maintenance Team A"
    status: PMScheduleStatus = PMScheduleStatus.ACTIVE

class PMScheduleCreate(PMScheduleBase):
    id: Optional[str] = None

class PMScheduleResponse(PMScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    asset_name: Optional[str] = None
    asset_location: Optional[str] = None
    is_overdue: bool = False
    days_until_due: int = 0
    created_at: datetime

class PMAutoGenerateResult(BaseModel):
    schedules_checked: int
    overdue_found: int
    work_orders_generated: int
    work_orders_skipped_existing: int
    details: List[str]
