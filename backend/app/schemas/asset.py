from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import date, datetime
from app.models.asset import AssetCriticality, AssetStatus

class AssetBase(BaseModel):
    id: str
    name: str
    asset_type: str
    model: str
    serial_number: str
    location: str
    criticality: AssetCriticality = AssetCriticality.MEDIUM
    status: AssetStatus = AssetStatus.OPERATIONAL
    installation_date: date
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    specifications: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    location: Optional[str] = None
    criticality: Optional[AssetCriticality] = None
    status: Optional[AssetStatus] = None
    installation_date: Optional[date] = None
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    specifications: Optional[str] = None

class AssetResponse(AssetBase):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime
    updated_at: datetime

class AssetDetailResponse(AssetResponse):
    open_requests_count: int = 0
    active_work_orders_count: int = 0
    total_maintenance_cost: float = 0.0
    maintenance_requests: List[Any] = []
    work_orders: List[Any] = []
    pm_schedules: List[Any] = []

class AssetListResponse(BaseModel):
    items: List[AssetResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
