from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.integration import IntegrationSyncResult, IntegrationLogResponse
from app.services.integration_service import IntegrationService
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/integrations", tags=["Legacy Integration"])

@router.get("/simulator/records", response_model=List[Dict[str, Any]])
def get_legacy_simulator_records(
    current_user: User = Depends(get_current_user)
):
    return IntegrationService.get_legacy_simulator_records()

@router.post("/sync-legacy", response_model=IntegrationSyncResult)
def trigger_legacy_sync(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER]))
):
    records = IntegrationService.get_legacy_simulator_records()
    result = IntegrationService.sync_legacy_assets(db, records, current_user)
    return result

@router.get("/logs", response_model=List[IntegrationLogResponse])
def get_integration_sync_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = IntegrationService.get_integration_logs(db)
    return logs
