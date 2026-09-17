from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    entity: str
    entity_id: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    metadata_info: Optional[str] = None
    timestamp: datetime

class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
