from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.inventory import InventoryTransaction
from app.schemas.inventory import (
    PartCreate,
    PartUpdate,
    PartResponse,
    PartListResponse,
    StockAdjustmentRequest,
    InventoryTransactionResponse
)
from app.services.inventory_service import InventoryService
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/parts", tags=["Inventory & Spare Parts"])

@router.get("", response_model=PartListResponse)
def list_parts(
    search: Optional[str] = None,
    category: Optional[str] = None,
    low_stock_only: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skip = (page - 1) * page_size
    items, total = InventoryService.get_parts(
        db=db,
        search=search,
        category_filter=category,
        low_stock_only=low_stock_only,
        skip=skip,
        limit=page_size
    )

    out_items = []
    for p in items:
        out_items.append(
            PartResponse(
                id=p.id,
                part_number=p.part_number,
                name=p.name,
                description=p.description,
                category=p.category,
                stock_quantity=p.stock_quantity,
                reorder_level=p.reorder_level,
                unit_cost=p.unit_cost,
                warehouse_location=p.warehouse_location,
                status=p.status,
                created_at=p.created_at,
                is_low_stock=(p.stock_quantity <= p.reorder_level)
            )
        )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PartListResponse(
        items=out_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/transactions", response_model=List[InventoryTransactionResponse])
def list_inventory_transactions(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transactions = db.query(InventoryTransaction).order_by(InventoryTransaction.timestamp.desc()).limit(limit).all()
    results = []
    for t in transactions:
        results.append(
            InventoryTransactionResponse(
                id=t.id,
                part_id=t.part_id,
                part_name=t.part.name if t.part else None,
                part_number=t.part.part_number if t.part else None,
                work_order_id=t.work_order_id,
                transaction_type=t.transaction_type,
                quantity=t.quantity,
                unit_cost=t.unit_cost,
                total_cost=round(t.total_cost, 2),
                performed_by_id=t.performed_by_id,
                performed_by_name=t.performed_by.name if t.performed_by else "System",
                notes=t.notes,
                timestamp=t.timestamp
            )
        )
    return results

@router.get("/{part_id}", response_model=PartResponse)
def get_part_by_id(
    part_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = InventoryService.get_part_by_id(db, part_id)
    return PartResponse(
        id=p.id,
        part_number=p.part_number,
        name=p.name,
        description=p.description,
        category=p.category,
        stock_quantity=p.stock_quantity,
        reorder_level=p.reorder_level,
        unit_cost=p.unit_cost,
        warehouse_location=p.warehouse_location,
        status=p.status,
        created_at=p.created_at,
        is_low_stock=(p.stock_quantity <= p.reorder_level)
    )

@router.post("", response_model=PartResponse)
def create_part(
    part_in: PartCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER]))
):
    p = InventoryService.create_part(db, part_in, current_user)
    return PartResponse.model_validate(p)

@router.post("/{part_id}/adjust", response_model=InventoryTransactionResponse)
def adjust_part_stock(
    part_id: str,
    adj_in: StockAdjustmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER]))
):
    txn = InventoryService.adjust_stock(db, part_id, adj_in, current_user)
    return InventoryTransactionResponse(
        id=txn.id,
        part_id=txn.part_id,
        part_name=txn.part.name if txn.part else None,
        part_number=txn.part.part_number if txn.part else None,
        work_order_id=txn.work_order_id,
        transaction_type=txn.transaction_type,
        quantity=txn.quantity,
        unit_cost=txn.unit_cost,
        total_cost=round(txn.total_cost, 2),
        performed_by_id=txn.performed_by_id,
        performed_by_name=current_user.name,
        notes=txn.notes,
        timestamp=txn.timestamp
    )
