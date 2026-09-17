import datetime
from typing import List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.pm_schedule import PreventiveMaintenanceSchedule, PMScheduleStatus
from app.models.work_order import WorkOrder, WorkOrderStatus, WorkOrderPriority
from app.models.asset import Asset
from app.models.user import User
from app.schemas.pm import PMAutoGenerateResult
from app.services.audit_service import AuditService

class PreventiveMaintenanceService:
    @staticmethod
    def get_schedules(db: Session) -> List[dict]:
        schedules = db.query(PreventiveMaintenanceSchedule).all()
        today = datetime.date.today()
        result = []

        for s in schedules:
            asset = db.query(Asset).filter(Asset.id == s.asset_id).first()
            is_overdue = s.next_due_date < today
            days_until = (s.next_due_date - today).days
            result.append({
                "id": s.id,
                "asset_id": s.asset_id,
                "asset_name": asset.name if asset else "Unknown",
                "asset_location": asset.location if asset else "Unknown",
                "maintenance_type": s.maintenance_type,
                "interval_days": s.interval_days,
                "last_performed_date": s.last_performed_date,
                "next_due_date": s.next_due_date,
                "responsible_team": s.responsible_team,
                "status": s.status,
                "is_overdue": is_overdue,
                "days_until_due": days_until,
                "created_at": s.created_at
            })
        return result

    @staticmethod
    def run_pm_generator(db: Session, actor: User) -> PMAutoGenerateResult:
        schedules = db.query(PreventiveMaintenanceSchedule).filter(
            PreventiveMaintenanceSchedule.status == PMScheduleStatus.ACTIVE
        ).all()
        today = datetime.date.today()
        
        overdue_found = 0
        generated = 0
        skipped = 0
        details = []

        for s in schedules:
            if s.next_due_date <= today:
                overdue_found += 1
                asset = db.query(Asset).filter(Asset.id == s.asset_id).first()
                if not asset:
                    continue

                # Business Rule 7: Duplicate Prevention
                # Check if there is already an active work order for this asset containing this PM type
                existing_active_wo = db.query(WorkOrder).filter(
                    WorkOrder.asset_id == s.asset_id,
                    WorkOrder.status.notin_([WorkOrderStatus.CLOSED]),
                    WorkOrder.title.ilike(f"%{s.maintenance_type}%")
                ).first()

                if existing_active_wo:
                    skipped += 1
                    details.append(f"Skipped {s.asset_id} ({s.maintenance_type}): Active Work Order '{existing_active_wo.id}' is already in progress.")
                    continue

                # Generate PM Work Order
                year = datetime.datetime.now().year
                base_count = db.query(WorkOrder).count()
                wo_id = f"WO-{year}-{(base_count + generated + 1):05d}"

                wo = WorkOrder(
                    id=wo_id,
                    asset_id=s.asset_id,
                    created_by_id=actor.id,
                    title=f"PM: {s.maintenance_type}",
                    description=f"Automated Preventive Maintenance order triggered for overdue schedule {s.id}. Target interval: {s.interval_days} days. Responsible: {s.responsible_team}",
                    priority=WorkOrderPriority.HIGH if "transformer" in s.maintenance_type.lower() or "hvdc" in asset.name.lower() else WorkOrderPriority.MEDIUM,
                    status=WorkOrderStatus.APPROVED,
                    planned_start=datetime.datetime.now(datetime.timezone.utc),
                    planned_end=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3)
                )
                db.add(wo)
                generated += 1
                details.append(f"Generated Work Order '{wo.id}' for Asset '{asset.name}' ({s.asset_id})")

                AuditService.log_action(
                    db=db,
                    actor=actor,
                    action="AUTO_GENERATE_PM_WO",
                    entity="WORK_ORDER",
                    entity_id=wo_id,
                    previous_state="OVERDUE_SCHEDULE",
                    new_state=wo.status.value,
                    metadata_info=f"Auto-generated PM order for {s.maintenance_type} on {s.asset_id}"
                )

        db.commit()
        return PMAutoGenerateResult(
            schedules_checked=len(schedules),
            overdue_found=overdue_found,
            work_orders_generated=generated,
            work_orders_skipped_existing=skipped,
            details=details
        )
