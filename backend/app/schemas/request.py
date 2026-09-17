from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.maintenance_request import RequestPriority, RequestStatus

class MaintenanceRequestCreate(BaseModel):
    asset_id: str
    title: str
    description: str
    category: str = "General"
    priority: RequestPriority = RequestPriority.MEDIUM

class MaintenanceRequestReview(BaseModel):
    action: str  # "APPROVE" or "REJECT"
    rejection_reason: Optional[str] = None
    target_priority: Optional[RequestPriority] = None

class MaintenanceRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    asset_id: str
    asset_name: Optional[str] = None
    reporter_id: int
    reporter_name: Optional[str] = None
    title: str
    description: str
    category: str
    priority: RequestPriority
    status: RequestStatus
    reviewed_by_id: Optional[int] = None
    reviewed_by_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    work_order_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class MaintenanceRequestListResponse(BaseModel):
    items: List[MaintenanceRequestResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
