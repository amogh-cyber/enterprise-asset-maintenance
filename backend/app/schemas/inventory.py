from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.inventory import PartStatus, InventoryTransactionType

class PartBase(BaseModel):
    id: str
    part_number: str
    name: str
    description: Optional[str] = None
    category: str = "Mechanical"
    stock_quantity: int = 0
    reorder_level: int = 5
    unit_cost: float = 0.0
    warehouse_location: str = "Main Warehouse"
    status: PartStatus = PartStatus.ACTIVE

class PartCreate(PartBase):
    pass

class PartUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    reorder_level: Optional[int] = None
    unit_cost: Optional[float] = None
    warehouse_location: Optional[str] = None
    status: Optional[PartStatus] = None

class PartResponse(PartBase):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime
    is_low_stock: bool = False

class StockAdjustmentRequest(BaseModel):
    transaction_type: InventoryTransactionType
    quantity: int
    notes: Optional[str] = None

class InventoryTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    part_id: str
    part_name: Optional[str] = None
    part_number: Optional[str] = None
    work_order_id: Optional[str] = None
    transaction_type: InventoryTransactionType
    quantity: int
    unit_cost: float
    total_cost: float
    performed_by_id: int
    performed_by_name: Optional[str] = None
    notes: Optional[str] = None
    timestamp: datetime

class PartListResponse(BaseModel):
    items: List[PartResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
