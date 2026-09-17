from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.work_order import WorkOrderStatus, WorkOrderPriority
from app.schemas.work_order import (
    WorkOrderCreate,
    WorkOrderAssign,
    WorkOrderStatusUpdate,
    WorkOrderActivityCreate,
    WorkOrderPartConsume,
    WorkOrderResponse,
    WorkOrderDetailResponse,
    WorkOrderListResponse,
    WorkOrderPartResponse,
    WorkOrderActivityResponse
)
from app.services.work_order_service import WorkOrderService
from app.services.inventory_service import InventoryService
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/work-orders", tags=["Work Orders"])

@router.get("", response_model=WorkOrderListResponse)
def list_work_orders(
    search: Optional[str] = None,
    status: Optional[WorkOrderStatus] = None,
    priority: Optional[WorkOrderPriority] = None,
    technician_id: Optional[int] = None,
    asset_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skip = (page - 1) * page_size
    items, total = WorkOrderService.get_work_orders(
        db=db,
        search=search,
        status_filter=status,
        priority_filter=priority,
        technician_id=technician_id,
        asset_id=asset_id,
        skip=skip,
        limit=page_size
    )

    out_items = []
    for wo in items:
        out_items.append(
            WorkOrderResponse(
                id=wo.id,
                request_id=wo.request_id,
                asset_id=wo.asset_id,
                asset_name=wo.asset.name if wo.asset else None,
                asset_criticality=wo.asset.criticality.value if wo.asset else None,
                created_by_id=wo.created_by_id,
                created_by_name=wo.created_by.name if wo.created_by else None,
                assigned_technician_id=wo.assigned_technician_id,
                assigned_technician_name=wo.assigned_technician.name if wo.assigned_technician else None,
                title=wo.title,
                description=wo.description,
                priority=wo.priority,
                status=wo.status,
                estimated_cost=wo.estimated_cost,
                actual_cost=round(wo.actual_cost, 2),
                planned_start=wo.planned_start,
                planned_end=wo.planned_end,
                actual_start=wo.actual_start,
                actual_end=wo.actual_end,
                completion_notes=wo.completion_notes,
                validation_notes=wo.validation_notes,
                validated_by_id=wo.validated_by_id,
                validated_by_name=wo.validated_by.name if wo.validated_by else None,
                created_at=wo.created_at,
                updated_at=wo.updated_at
            )
        )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return WorkOrderListResponse(
        items=out_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{work_order_id}", response_model=WorkOrderDetailResponse)
def get_work_order_by_id(
    work_order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wo = WorkOrderService.get_work_order_by_id(db, work_order_id)
    
    parts = [
        WorkOrderPartResponse(
            id=p.id,
            part_id=p.part_id,
            part_number=p.part.part_number,
            part_name=p.part.name,
            quantity=p.quantity,
            unit_cost=p.unit_cost,
            total_cost=round(p.total_cost, 2),
            consumed_at=p.consumed_at
        ) for p in wo.parts_consumed
    ]

    activities = [
        WorkOrderActivityResponse(
            id=a.id,
            technician_id=a.technician_id,
            technician_name=a.technician.name if a.technician else "Unknown",
            activity_type=a.activity_type,
            description=a.description,
            hours_spent=a.hours_spent,
            logged_at=a.logged_at
        ) for a in wo.activities
    ]

    return WorkOrderDetailResponse(
        id=wo.id,
        request_id=wo.request_id,
        asset_id=wo.asset_id,
        asset_name=wo.asset.name if wo.asset else None,
        asset_criticality=wo.asset.criticality.value if wo.asset else None,
        created_by_id=wo.created_by_id,
        created_by_name=wo.created_by.name if wo.created_by else None,
        assigned_technician_id=wo.assigned_technician_id,
        assigned_technician_name=wo.assigned_technician.name if wo.assigned_technician else None,
        title=wo.title,
        description=wo.description,
        priority=wo.priority,
        status=wo.status,
        estimated_cost=wo.estimated_cost,
        actual_cost=round(wo.actual_cost, 2),
        planned_start=wo.planned_start,
        planned_end=wo.planned_end,
        actual_start=wo.actual_start,
        actual_end=wo.actual_end,
        completion_notes=wo.completion_notes,
        validation_notes=wo.validation_notes,
        validated_by_id=wo.validated_by_id,
        validated_by_name=wo.validated_by.name if wo.validated_by else None,
        created_at=wo.created_at,
        updated_at=wo.updated_at,
        parts_consumed=parts,
        activities=activities
    )

@router.post("", response_model=WorkOrderResponse)
def create_work_order(
    wo_in: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER]))
):
    wo = WorkOrderService.create_work_order(db, wo_in, current_user)
    return WorkOrderResponse.model_validate(wo)

@router.post("/{work_order_id}/assign", response_model=WorkOrderResponse)
def assign_technician(
    work_order_id: str,
    assign_in: WorkOrderAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER]))
):
    wo = WorkOrderService.assign_technician(db, work_order_id, assign_in, current_user)
    return WorkOrderResponse(
        id=wo.id,
        request_id=wo.request_id,
        asset_id=wo.asset_id,
        asset_name=wo.asset.name if wo.asset else None,
        asset_criticality=wo.asset.criticality.value if wo.asset else None,
        created_by_id=wo.created_by_id,
        created_by_name=wo.created_by.name if wo.created_by else None,
        assigned_technician_id=wo.assigned_technician_id,
        assigned_technician_name=wo.assigned_technician.name if wo.assigned_technician else None,
        title=wo.title,
        description=wo.description,
        priority=wo.priority,
        status=wo.status,
        estimated_cost=wo.estimated_cost,
        actual_cost=round(wo.actual_cost, 2),
        planned_start=wo.planned_start,
        planned_end=wo.planned_end,
        actual_start=wo.actual_start,
        actual_end=wo.actual_end,
        completion_notes=wo.completion_notes,
        validation_notes=wo.validation_notes,
        validated_by_id=wo.validated_by_id,
        validated_by_name=wo.validated_by.name if wo.validated_by else None,
        created_at=wo.created_at,
        updated_at=wo.updated_at
    )

@router.post("/{work_order_id}/status", response_model=WorkOrderResponse)
def update_work_order_status(
    work_order_id: str,
    update_in: WorkOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wo = WorkOrderService.update_status(db, work_order_id, update_in, current_user)
    return WorkOrderResponse(
        id=wo.id,
        request_id=wo.request_id,
        asset_id=wo.asset_id,
        asset_name=wo.asset.name if wo.asset else None,
        asset_criticality=wo.asset.criticality.value if wo.asset else None,
        created_by_id=wo.created_by_id,
        created_by_name=wo.created_by.name if wo.created_by else None,
        assigned_technician_id=wo.assigned_technician_id,
        assigned_technician_name=wo.assigned_technician.name if wo.assigned_technician else None,
        title=wo.title,
        description=wo.description,
        priority=wo.priority,
        status=wo.status,
        estimated_cost=wo.estimated_cost,
        actual_cost=round(wo.actual_cost, 2),
        planned_start=wo.planned_start,
        planned_end=wo.planned_end,
        actual_start=wo.actual_start,
        actual_end=wo.actual_end,
        completion_notes=wo.completion_notes,
        validation_notes=wo.validation_notes,
        validated_by_id=wo.validated_by_id,
        validated_by_name=wo.validated_by.name if wo.validated_by else None,
        created_at=wo.created_at,
        updated_at=wo.updated_at
    )

@router.post("/{work_order_id}/activities", response_model=WorkOrderActivityResponse)
def log_work_order_activity(
    work_order_id: str,
    act_in: WorkOrderActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER, UserRole.TECHNICIAN]))
):
    activity = WorkOrderService.log_activity(db, work_order_id, act_in, current_user)
    return WorkOrderActivityResponse(
        id=activity.id,
        technician_id=activity.technician_id,
        technician_name=current_user.name,
        activity_type=activity.activity_type,
        description=activity.description,
        hours_spent=activity.hours_spent,
        logged_at=activity.logged_at
    )

@router.post("/{work_order_id}/parts", response_model=WorkOrderPartResponse)
def consume_part_for_work_order(
    work_order_id: str,
    consume_in: WorkOrderPartConsume,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER, UserRole.TECHNICIAN]))
):
    wo_part = InventoryService.consume_part_for_work_order(db, work_order_id, consume_in, current_user)
    return WorkOrderPartResponse(
        id=wo_part.id,
        part_id=wo_part.part_id,
        part_number=wo_part.part.part_number,
        part_name=wo_part.part.name,
        quantity=wo_part.quantity,
        unit_cost=wo_part.unit_cost,
        total_cost=round(wo_part.total_cost, 2),
        consumed_at=wo_part.consumed_at
    )
