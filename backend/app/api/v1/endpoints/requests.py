from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.maintenance_request import RequestStatus, RequestPriority
from app.schemas.request import (
    MaintenanceRequestCreate,
    MaintenanceRequestReview,
    MaintenanceRequestResponse,
    MaintenanceRequestListResponse
)
from app.services.request_service import RequestService
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/requests", tags=["Maintenance Requests"])

@router.get("", response_model=MaintenanceRequestListResponse)
def list_requests(
    search: Optional[str] = None,
    status: Optional[RequestStatus] = None,
    priority: Optional[RequestPriority] = None,
    asset_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skip = (page - 1) * page_size
    items, total = RequestService.get_requests(
        db=db,
        search=search,
        status_filter=status,
        priority_filter=priority,
        asset_id=asset_id,
        skip=skip,
        limit=page_size
    )

    out_items = []
    for r in items:
        out_items.append(
            MaintenanceRequestResponse(
                id=r.id,
                asset_id=r.asset_id,
                asset_name=r.asset.name if r.asset else None,
                reporter_id=r.reporter_id,
                reporter_name=r.reporter.name if r.reporter else None,
                title=r.title,
                description=r.description,
                category=r.category,
                priority=r.priority,
                status=r.status,
                reviewed_by_id=r.reviewed_by_id,
                reviewed_by_name=r.reviewed_by.name if r.reviewed_by else None,
                rejection_reason=r.rejection_reason,
                work_order_id=r.work_order.id if r.work_order else None,
                created_at=r.created_at,
                updated_at=r.updated_at
            )
        )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return MaintenanceRequestListResponse(
        items=out_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{request_id}", response_model=MaintenanceRequestResponse)
def get_request_by_id(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = RequestService.get_request_by_id(db, request_id)
    return MaintenanceRequestResponse(
        id=r.id,
        asset_id=r.asset_id,
        asset_name=r.asset.name if r.asset else None,
        reporter_id=r.reporter_id,
        reporter_name=r.reporter.name if r.reporter else None,
        title=r.title,
        description=r.description,
        category=r.category,
        priority=r.priority,
        status=r.status,
        reviewed_by_id=r.reviewed_by_id,
        reviewed_by_name=r.reviewed_by.name if r.reviewed_by else None,
        rejection_reason=r.rejection_reason,
        work_order_id=r.work_order.id if r.work_order else None,
        created_at=r.created_at,
        updated_at=r.updated_at
    )

@router.post("", response_model=MaintenanceRequestResponse)
def create_request(
    req_in: MaintenanceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = RequestService.create_request(db, req_in, current_user)
    return MaintenanceRequestResponse(
        id=req.id,
        asset_id=req.asset_id,
        asset_name=req.asset.name if req.asset else None,
        reporter_id=req.reporter_id,
        reporter_name=current_user.name,
        title=req.title,
        description=req.description,
        category=req.category,
        priority=req.priority,
        status=req.status,
        reviewed_by_id=None,
        reviewed_by_name=None,
        rejection_reason=None,
        work_order_id=None,
        created_at=req.created_at,
        updated_at=req.updated_at
    )

@router.post("/{request_id}/review", response_model=MaintenanceRequestResponse)
def review_request(
    request_id: str,
    review_in: MaintenanceRequestReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER]))
):
    req = RequestService.review_request(db, request_id, review_in, current_user)
    return MaintenanceRequestResponse(
        id=req.id,
        asset_id=req.asset_id,
        asset_name=req.asset.name if req.asset else None,
        reporter_id=req.reporter_id,
        reporter_name=req.reporter.name if req.reporter else None,
        title=req.title,
        description=req.description,
        category=req.category,
        priority=req.priority,
        status=req.status,
        reviewed_by_id=req.reviewed_by_id,
        reviewed_by_name=current_user.name,
        rejection_reason=req.rejection_reason,
        work_order_id=req.work_order.id if req.work_order else None,
        created_at=req.created_at,
        updated_at=req.updated_at
    )
