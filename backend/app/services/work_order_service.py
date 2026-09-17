import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models.work_order import WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderActivity
from app.models.asset import Asset, AssetStatus
from app.models.user import User, UserRole, UserStatus, TechnicianProfile
from app.schemas.work_order import WorkOrderCreate, WorkOrderAssign, WorkOrderStatusUpdate, WorkOrderActivityCreate
from app.services.audit_service import AuditService

# Strict State Machine Transition Map
VALID_TRANSITIONS = {
    WorkOrderStatus.CREATED: [WorkOrderStatus.APPROVED],
    WorkOrderStatus.APPROVED: [WorkOrderStatus.ASSIGNED],
    WorkOrderStatus.ASSIGNED: [WorkOrderStatus.IN_PROGRESS],
    WorkOrderStatus.IN_PROGRESS: [WorkOrderStatus.WAITING_FOR_PARTS, WorkOrderStatus.COMPLETED, WorkOrderStatus.VALIDATION_PENDING],
    WorkOrderStatus.WAITING_FOR_PARTS: [WorkOrderStatus.IN_PROGRESS],
    WorkOrderStatus.COMPLETED: [WorkOrderStatus.VALIDATION_PENDING, WorkOrderStatus.VALIDATED],
    WorkOrderStatus.VALIDATION_PENDING: [WorkOrderStatus.VALIDATED, WorkOrderStatus.IN_PROGRESS],  # In progress if rejected by QA
    WorkOrderStatus.VALIDATED: [WorkOrderStatus.CLOSED],
    WorkOrderStatus.CLOSED: []  # Terminal state
}

class WorkOrderService:
    @staticmethod
    def get_work_orders(
        db: Session,
        search: Optional[str] = None,
        status_filter: Optional[WorkOrderStatus] = None,
        priority_filter: Optional[WorkOrderPriority] = None,
        technician_id: Optional[int] = None,
        asset_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 15
    ) -> Tuple[List[WorkOrder], int]:
        query = db.query(WorkOrder)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    WorkOrder.id.ilike(search_pattern),
                    WorkOrder.title.ilike(search_pattern),
                    WorkOrder.description.ilike(search_pattern),
                    WorkOrder.asset_id.ilike(search_pattern)
                )
            )

        if status_filter:
            query = query.filter(WorkOrder.status == status_filter)

        if priority_filter:
            query = query.filter(WorkOrder.priority == priority_filter)

        if technician_id:
            query = query.filter(WorkOrder.assigned_technician_id == technician_id)

        if asset_id:
            query = query.filter(WorkOrder.asset_id == asset_id)

        total = query.count()
        items = query.order_by(WorkOrder.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_work_order_by_id(db: Session, work_order_id: str) -> WorkOrder:
        wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
        if not wo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Work Order '{work_order_id}' not found."
            )
        return wo

    @staticmethod
    def create_work_order(db: Session, wo_in: WorkOrderCreate, creator: User) -> WorkOrder:
        asset = db.query(Asset).filter(Asset.id == wo_in.asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset '{wo_in.asset_id}' does not exist."
            )

        year = datetime.datetime.now().year
        count = db.query(WorkOrder).count() + 1
        wo_id = f"WO-{year}-{count:05d}"

        work_order = WorkOrder(
            id=wo_id,
            request_id=wo_in.request_id,
            asset_id=asset.id,
            created_by_id=creator.id,
            assigned_technician_id=wo_in.assigned_technician_id,
            title=wo_in.title,
            description=wo_in.description,
            priority=wo_in.priority,
            status=WorkOrderStatus.ASSIGNED if wo_in.assigned_technician_id else WorkOrderStatus.CREATED,
            planned_start=wo_in.planned_start or datetime.datetime.now(datetime.timezone.utc),
            planned_end=wo_in.planned_end or (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2))
        )
        db.add(work_order)

        AuditService.log_action(
            db=db,
            actor=creator,
            action="CREATE_WORK_ORDER",
            entity="WORK_ORDER",
            entity_id=wo_id,
            previous_state=None,
            new_state=work_order.status.value,
            metadata_info=f"Created Work Order '{wo_in.title}' on asset {asset.name} ({asset.id})"
        )

        db.commit()
        db.refresh(work_order)
        return work_order

    @staticmethod
    def assign_technician(db: Session, work_order_id: str, assign_in: WorkOrderAssign, manager: User) -> WorkOrder:
        wo = WorkOrderService.get_work_order_by_id(db, work_order_id)

        # Business Rule 2: Cannot assign an inactive technician
        technician = db.query(User).filter(User.id == assign_in.technician_id).first()
        if not technician or technician.role != UserRole.TECHNICIAN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User ID '{assign_in.technician_id}' is not a valid technician."
            )
        if technician.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Business Rule Violation: Cannot assign inactive technician '{technician.name}' ({technician.employee_id})."
            )

        # Business Rule 3: Skill-based verification
        asset = db.query(Asset).filter(Asset.id == wo.asset_id).first()
        tech_profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == technician.id).first()
        
        if asset and tech_profile and not assign_in.override_skill_warning:
            # Check skill match
            asset_keywords = [w.lower() for w in asset.asset_type.split()]
            tech_skills = tech_profile.skills.lower()
            match = any(kw in tech_skills for kw in asset_keywords)
            if not match and "general" not in tech_skills:
                # If electrical equipment and tech doesn't have electrical skill
                if "electrical" in asset.asset_type.lower() and "electrical" not in tech_skills:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Skill Rule Warning: Asset '{asset.name}' requires Electrical expertise, but technician '{technician.name}' has skills '{tech_profile.skills}'. Provide override_skill_warning=true to proceed."
                    )

        prev_status = wo.status.value
        wo.assigned_technician_id = technician.id
        
        # Advance status to ASSIGNED if CREATED or APPROVED
        if wo.status in [WorkOrderStatus.CREATED, WorkOrderStatus.APPROVED]:
            wo.status = WorkOrderStatus.ASSIGNED

        AuditService.log_action(
            db=db,
            actor=manager,
            action="ASSIGN_TECHNICIAN",
            entity="WORK_ORDER",
            entity_id=wo.id,
            previous_state=prev_status,
            new_state=wo.status.value,
            metadata_info=f"Assigned technician {technician.name} ({technician.employee_id}) to Work Order {wo.id}"
        )

        db.commit()
        db.refresh(wo)
        return wo

    @staticmethod
    def update_status(db: Session, work_order_id: str, update_in: WorkOrderStatusUpdate, actor: User) -> WorkOrder:
        wo = WorkOrderService.get_work_order_by_id(db, work_order_id)
        current_status = wo.status
        target_status = update_in.new_status

        # Validate transition using State Machine
        allowed_next = VALID_TRANSITIONS.get(current_status, [])
        if target_status not in allowed_next and target_status != current_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid State Transition: Cannot transition Work Order from '{current_status.value}' to '{target_status.value}'. Allowed transitions: {[s.value for s in allowed_next]}"
            )

        # Business Rule 5: Cannot close an unvalidated work order
        if target_status == WorkOrderStatus.CLOSED and current_status != WorkOrderStatus.VALIDATED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Business Rule Violation: Cannot close Work Order '{wo.id}' because it has not been validated by a Maintenance Manager."
            )

        now = datetime.datetime.now(datetime.timezone.utc)
        prev_status = current_status.value
        wo.status = target_status

        if target_status == WorkOrderStatus.IN_PROGRESS and not wo.actual_start:
            wo.actual_start = now
        elif target_status in [WorkOrderStatus.COMPLETED, WorkOrderStatus.VALIDATION_PENDING]:
            if not wo.actual_end:
                wo.actual_end = now
            if update_in.notes:
                wo.completion_notes = update_in.notes
        elif target_status == WorkOrderStatus.VALIDATED:
            wo.validated_by_id = actor.id
            if update_in.notes:
                wo.validation_notes = update_in.notes
        elif target_status == WorkOrderStatus.CLOSED:
            # Update asset state to OPERATIONAL and refresh last_maintenance_date
            asset = db.query(Asset).filter(Asset.id == wo.asset_id).first()
            if asset:
                asset.status = AssetStatus.OPERATIONAL
                asset.last_maintenance_date = now.date()

        AuditService.log_action(
            db=db,
            actor=actor,
            action="UPDATE_WORK_ORDER_STATUS",
            entity="WORK_ORDER",
            entity_id=wo.id,
            previous_state=prev_status,
            new_state=target_status.value,
            metadata_info=update_in.notes or f"Status transitioned to {target_status.value}"
        )

        db.commit()
        db.refresh(wo)
        return wo

    @staticmethod
    def log_activity(db: Session, work_order_id: str, act_in: WorkOrderActivityCreate, technician: User) -> WorkOrderActivity:
        wo = WorkOrderService.get_work_order_by_id(db, work_order_id)
        
        tech_profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == technician.id).first()
        hourly_rate = tech_profile.hourly_rate if tech_profile else 50.0
        labor_cost = round(act_in.hours_spent * hourly_rate, 2)

        activity = WorkOrderActivity(
            work_order_id=wo.id,
            technician_id=technician.id,
            activity_type=act_in.activity_type,
            description=act_in.description,
            hours_spent=act_in.hours_spent
        )
        db.add(activity)

        # Update work order actual cost
        wo.actual_cost += labor_cost

        AuditService.log_action(
            db=db,
            actor=technician,
            action="LOG_MAINTENANCE_ACTIVITY",
            entity="WORK_ORDER",
            entity_id=wo.id,
            previous_state=None,
            new_state=f"{act_in.hours_spent} hrs logged",
            metadata_info=f"Logged activity '{act_in.activity_type}': {act_in.description} (Labor cost: +${labor_cost})"
        )

        db.commit()
        db.refresh(activity)
        return activity
