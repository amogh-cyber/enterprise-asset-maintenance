import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models.inventory import Part, PartStatus, InventoryTransaction, InventoryTransactionType, WorkOrderPart
from app.models.work_order import WorkOrder, WorkOrderStatus
from app.models.user import User
from app.schemas.inventory import PartCreate, PartUpdate, StockAdjustmentRequest
from app.schemas.work_order import WorkOrderPartConsume
from app.services.audit_service import AuditService

class InventoryService:
    @staticmethod
    def get_parts(
        db: Session,
        search: Optional[str] = None,
        category_filter: Optional[str] = None,
        low_stock_only: bool = False,
        skip: int = 0,
        limit: int = 15
    ) -> Tuple[List[Part], int]:
        query = db.query(Part)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Part.id.ilike(search_pattern),
                    Part.part_number.ilike(search_pattern),
                    Part.name.ilike(search_pattern),
                    Part.category.ilike(search_pattern),
                    Part.warehouse_location.ilike(search_pattern)
                )
            )

        if category_filter:
            query = query.filter(Part.category.ilike(f"%{category_filter}%"))

        if low_stock_only:
            query = query.filter(Part.stock_quantity <= Part.reorder_level)

        total = query.count()
        items = query.order_by(Part.id.asc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_part_by_id(db: Session, part_id: str) -> Part:
        part = db.query(Part).filter(Part.id == part_id).first()
        if not part:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Part '{part_id}' not found in inventory catalog."
            )
        return part

    @staticmethod
    def create_part(db: Session, part_in: PartCreate, actor: User) -> Part:
        existing = db.query(Part).filter(
            or_(Part.id == part_in.id, Part.part_number == part_in.part_number)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Part with ID '{part_in.id}' or part number '{part_in.part_number}' already exists."
            )

        part = Part(**part_in.model_dump())
        db.add(part)

        AuditService.log_action(
            db=db,
            actor=actor,
            action="CREATE_PART",
            entity="INVENTORY",
            entity_id=part.id,
            previous_state=None,
            new_state=f"Stock: {part.stock_quantity}",
            metadata_info=f"Registered part {part.name} ({part.part_number}) in warehouse {part.warehouse_location}"
        )

        db.commit()
        db.refresh(part)
        return part

    @staticmethod
    def adjust_stock(db: Session, part_id: str, adj_in: StockAdjustmentRequest, actor: User) -> InventoryTransaction:
        part = InventoryService.get_part_by_id(db, part_id)
        prev_stock = part.stock_quantity

        if adj_in.transaction_type in [InventoryTransactionType.STOCK_OUT, InventoryTransactionType.RESERVED]:
            if part.stock_quantity < adj_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient Stock: Available {part.stock_quantity}, requested {adj_in.quantity}."
                )
            part.stock_quantity -= adj_in.quantity
        elif adj_in.transaction_type in [InventoryTransactionType.STOCK_IN, InventoryTransactionType.RETURN, InventoryTransactionType.RELEASED]:
            part.stock_quantity += adj_in.quantity
        elif adj_in.transaction_type == InventoryTransactionType.ADJUSTMENT:
            part.stock_quantity = adj_in.quantity

        year = datetime.datetime.now().year
        count = db.query(InventoryTransaction).count() + 1
        txn_id = f"TXN-{year}-{count:06d}"

        total_cost = adj_in.quantity * part.unit_cost
        txn = InventoryTransaction(
            id=txn_id,
            part_id=part.id,
            transaction_type=adj_in.transaction_type,
            quantity=adj_in.quantity,
            unit_cost=part.unit_cost,
            total_cost=total_cost,
            performed_by_id=actor.id,
            notes=adj_in.notes or f"Manual stock adjustment ({adj_in.transaction_type.value})"
        )
        db.add(txn)

        AuditService.log_action(
            db=db,
            actor=actor,
            action=f"INVENTORY_{adj_in.transaction_type.value}",
            entity="INVENTORY",
            entity_id=part.id,
            previous_state=str(prev_stock),
            new_state=str(part.stock_quantity),
            metadata_info=f"Adjusted stock by {adj_in.quantity} ({adj_in.transaction_type.value}). Notes: {adj_in.notes}"
        )

        db.commit()
        db.refresh(txn)
        return txn

    @staticmethod
    def consume_part_for_work_order(db: Session, work_order_id: str, consume_in: WorkOrderPartConsume, actor: User) -> WorkOrderPart:
        wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
        if not wo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Work Order '{work_order_id}' not found."
            )

        if wo.status in [WorkOrderStatus.CLOSED, WorkOrderStatus.VALIDATED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot consume parts for Work Order '{work_order_id}' in status '{wo.status.value}'."
            )

        part = InventoryService.get_part_by_id(db, consume_in.part_id)

        # Business Rule 4: Cannot consume more parts than available inventory
        if part.stock_quantity < consume_in.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Business Rule Violation: Insufficient inventory for part '{part.name}' ({part.id}). Available: {part.stock_quantity}, requested: {consume_in.quantity}."
            )

        prev_stock = part.stock_quantity
        # 1. Deduct quantity
        part.stock_quantity -= consume_in.quantity
        total_cost = round(consume_in.quantity * part.unit_cost, 2)

        # 2. Record Inventory Transaction (STOCK_OUT)
        year = datetime.datetime.now().year
        count = db.query(InventoryTransaction).count() + 1
        txn_id = f"TXN-{year}-{count:06d}"

        txn = InventoryTransaction(
            id=txn_id,
            part_id=part.id,
            work_order_id=wo.id,
            transaction_type=InventoryTransactionType.STOCK_OUT,
            quantity=consume_in.quantity,
            unit_cost=part.unit_cost,
            total_cost=total_cost,
            performed_by_id=actor.id,
            notes=consume_in.notes or f"Consumed {consume_in.quantity}x for maintenance on Work Order {wo.id}"
        )
        db.add(txn)

        # 3. Create WorkOrderPart record
        wo_part = WorkOrderPart(
            work_order_id=wo.id,
            part_id=part.id,
            quantity=consume_in.quantity,
            unit_cost=part.unit_cost,
            total_cost=total_cost
        )
        db.add(wo_part)

        # 4. Update Work Order actual cost
        wo.actual_cost += total_cost

        # 5. Audit log
        AuditService.log_action(
            db=db,
            actor=actor,
            action="CONSUME_WORK_ORDER_PART",
            entity="WORK_ORDER",
            entity_id=wo.id,
            previous_state=f"Stock was {prev_stock}",
            new_state=f"Stock now {part.stock_quantity}",
            metadata_info=f"Consumed {consume_in.quantity}x {part.name} ({part.part_number}) at ${part.unit_cost}/ea. Cost +${total_cost}"
        )

        db.commit()
        db.refresh(wo_part)
        return wo_part
