from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.pm import PMScheduleResponse, PMAutoGenerateResult
from app.services.pm_service import PreventiveMaintenanceService
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/pm", tags=["Preventive Maintenance"])

@router.get("/schedules", response_model=List[PMScheduleResponse])
def get_pm_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    schedules = PreventiveMaintenanceService.get_schedules(db)
    return schedules

@router.post("/auto-generate", response_model=PMAutoGenerateResult)
def run_pm_auto_generation(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER]))
):
    result = PreventiveMaintenanceService.run_pm_generator(db, current_user)
    return result
