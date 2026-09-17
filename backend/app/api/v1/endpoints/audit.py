from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse, AuditLogListResponse
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    entity: Optional[str] = None,
    action: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER]))
):
    query = db.query(AuditLog)
    if entity:
        query = query.filter(AuditLog.entity.ilike(f"%{entity}%"))
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    total = query.count()
    skip = (page - 1) * page_size
    items = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(a) for a in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
