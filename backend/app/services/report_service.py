import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.asset import Asset, AssetStatus, AssetCriticality
from app.models.maintenance_request import MaintenanceRequest, RequestStatus, RequestPriority
from app.models.work_order import WorkOrder, WorkOrderStatus, WorkOrderPriority
from app.models.inventory import Part, InventoryTransaction, WorkOrderPart
from app.models.pm_schedule import PreventiveMaintenanceSchedule, PMScheduleStatus
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.schemas.report import DashboardOverviewResponse, DashboardKPIs, StatusDistribution, WorkloadItem

class ReportService:
    @staticmethod
    def get_dashboard_overview(db: Session) -> DashboardOverviewResponse:
        today = datetime.date.today()
        now = datetime.datetime.now(datetime.timezone.utc)

        total_assets = db.query(Asset).count()
        operational_assets = db.query(Asset).filter(Asset.status == AssetStatus.OPERATIONAL).count()
        under_maint_assets = db.query(Asset).filter(Asset.status == AssetStatus.UNDER_MAINTENANCE).count()
        critical_assets = db.query(Asset).filter(Asset.criticality == AssetCriticality.CRITICAL).count()

        open_requests = db.query(MaintenanceRequest).filter(
            MaintenanceRequest.status.in_([RequestStatus.OPEN, RequestStatus.UNDER_REVIEW])
        ).count()

        active_work_orders = db.query(WorkOrder).filter(
            WorkOrder.status.notin_([WorkOrderStatus.CLOSED])
        ).count()

        overdue_work_orders = db.query(WorkOrder).filter(
            WorkOrder.status.notin_([WorkOrderStatus.CLOSED]),
            WorkOrder.planned_end < now
        ).count()

        low_stock_parts = db.query(Part).filter(Part.stock_quantity <= Part.reorder_level).count()

        overdue_pm = db.query(PreventiveMaintenanceSchedule).filter(
            PreventiveMaintenanceSchedule.status == PMScheduleStatus.ACTIVE,
            PreventiveMaintenanceSchedule.next_due_date < today
        ).count()

        # Work orders by status
        wo_status_counts = db.query(WorkOrder.status, func.count(WorkOrder.id)).group_by(WorkOrder.status).all()
        total_wo = sum(c for _, c in wo_status_counts) or 1
        wo_distribution = [
            StatusDistribution(
                name=st.value,
                count=cnt,
                percentage=round((cnt / total_wo) * 100, 1)
            ) for st, cnt in wo_status_counts
        ]

        # Requests by priority
        req_prio_counts = db.query(MaintenanceRequest.priority, func.count(MaintenanceRequest.id)).group_by(MaintenanceRequest.priority).all()
        total_req = sum(c for _, c in req_prio_counts) or 1
        req_distribution = [
            StatusDistribution(
                name=pr.value,
                count=cnt,
                percentage=round((cnt / total_req) * 100, 1)
            ) for pr, cnt in req_prio_counts
        ]

        # Assets by status
        asset_status_counts = db.query(Asset.status, func.count(Asset.id)).group_by(Asset.status).all()
        total_ast = sum(c for _, c in asset_status_counts) or 1
        asset_distribution = [
            StatusDistribution(
                name=st.value,
                count=cnt,
                percentage=round((cnt / total_ast) * 100, 1)
            ) for st, cnt in asset_status_counts
        ]

        # Technician Workload
        technicians = db.query(User).filter(User.role == UserRole.TECHNICIAN).all()
        tech_workload = []
        for tech in technicians:
            active = db.query(WorkOrder).filter(
                WorkOrder.assigned_technician_id == tech.id,
                WorkOrder.status.notin_([WorkOrderStatus.CLOSED])
            ).count()
            completed = db.query(WorkOrder).filter(
                WorkOrder.assigned_technician_id == tech.id,
                WorkOrder.status == WorkOrderStatus.CLOSED
            ).count()
            tech_workload.append(
                WorkloadItem(
                    technician_name=tech.name,
                    active_orders=active,
                    completed_orders=completed
                )
            )

        # Recent Audit Events (last 8)
        recent_audits = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(8).all()
        recent_audit_data = [
            {
                "id": a.id,
                "actor_name": a.actor_name,
                "action": a.action,
                "entity": a.entity,
                "entity_id": a.entity_id,
                "timestamp": a.timestamp.isoformat(),
                "metadata_info": a.metadata_info
            } for a in recent_audits
        ]

        kpis = DashboardKPIs(
            total_assets=total_assets,
            operational_assets=operational_assets,
            assets_under_maintenance=under_maint_assets,
            open_maintenance_requests=open_requests,
            active_work_orders=active_work_orders,
            overdue_work_orders=overdue_work_orders,
            critical_assets_count=critical_assets,
            low_stock_parts_count=low_stock_parts,
            overdue_pm_count=overdue_pm
        )

        return DashboardOverviewResponse(
            kpis=kpis,
            work_orders_by_status=wo_distribution,
            requests_by_priority=req_distribution,
            assets_by_status=asset_distribution,
            technician_workload=tech_workload,
            recent_audit_events=recent_audit_data
        )

    @staticmethod
    def get_maintenance_performance_report(db: Session) -> Dict[str, Any]:
        work_orders = db.query(WorkOrder).all()
        total_orders = len(work_orders)
        closed_orders = [wo for wo in work_orders if wo.status == WorkOrderStatus.CLOSED]
        completion_rate = round((len(closed_orders) / total_orders * 100) if total_orders > 0 else 0.0, 1)
        
        total_cost = sum(wo.actual_cost for wo in work_orders)
        parts_cost = sum(p.total_cost for p in db.query(WorkOrderPart).all())
        labor_cost = round(total_cost - parts_cost, 2)

        return {
            "total_orders": total_orders,
            "closed_orders": len(closed_orders),
            "completion_rate": completion_rate,
            "total_cost": round(total_cost, 2),
            "parts_cost": round(parts_cost, 2),
            "labor_cost": max(0.0, labor_cost),
            "orders_by_priority": {
                "CRITICAL": sum(1 for wo in work_orders if wo.priority == WorkOrderPriority.CRITICAL),
                "HIGH": sum(1 for wo in work_orders if wo.priority == WorkOrderPriority.HIGH),
                "MEDIUM": sum(1 for wo in work_orders if wo.priority == WorkOrderPriority.MEDIUM),
                "LOW": sum(1 for wo in work_orders if wo.priority == WorkOrderPriority.LOW),
            }
        }
