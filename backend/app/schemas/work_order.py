from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from app.models.work_order import WorkOrderPriority, WorkOrderStatus

class WorkOrderCreate(BaseModel):
    asset_id: str
    request_id: Optional[str] = None
    title: str
    description: str
    priority: WorkOrderPriority = WorkOrderPriority.MEDIUM
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    assigned_technician_id: Optional[int] = None

class WorkOrderAssign(BaseModel):
    technician_id: int
    override_skill_warning: bool = False

class WorkOrderStatusUpdate(BaseModel):
    new_status: WorkOrderStatus
    notes: Optional[str] = None

class WorkOrderActivityCreate(BaseModel):
    activity_type: str
    description: str
    hours_spent: float

class WorkOrderPartConsume(BaseModel):
    part_id: str
    quantity: int
    notes: Optional[str] = None

class WorkOrderPartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    part_id: str
    part_number: str
    part_name: str
    quantity: int
    unit_cost: float
    total_cost: float
    consumed_at: datetime

class WorkOrderActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    technician_id: int
    technician_name: str
    activity_type: str
    description: str
    hours_spent: float
    logged_at: datetime

class WorkOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    request_id: Optional[str] = None
    asset_id: str
    asset_name: Optional[str] = None
    asset_criticality: Optional[str] = None
    created_by_id: int
    created_by_name: Optional[str] = None
    assigned_technician_id: Optional[int] = None
    assigned_technician_name: Optional[str] = None
    title: str
    description: str
    priority: WorkOrderPriority
    status: WorkOrderStatus
    estimated_cost: float
    actual_cost: float
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    completion_notes: Optional[str] = None
    validation_notes: Optional[str] = None
    validated_by_id: Optional[int] = None
    validated_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class WorkOrderDetailResponse(WorkOrderResponse):
    parts_consumed: List[WorkOrderPartResponse] = []
    activities: List[WorkOrderActivityResponse] = []

class WorkOrderListResponse(BaseModel):
    items: List[WorkOrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
