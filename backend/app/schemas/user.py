from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.user import UserRole, UserStatus

class TechnicianProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    specialty: str
    skills: str
    certifications: Optional[str] = None
    availability_status: str
    hourly_rate: float

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: str
    name: str
    email: EmailStr
    department: str
    role: UserRole
    status: UserStatus
    created_at: datetime
    last_login: Optional[datetime] = None
    technician_profile: Optional[TechnicianProfileResponse] = None

class TechnicianWorkloadResponse(BaseModel):
    id: int
    employee_id: str
    name: str
    specialty: str
    skills: str
    availability_status: str
    active_work_orders_count: int
    completed_work_orders_count: int
    open_work_orders_count: int
