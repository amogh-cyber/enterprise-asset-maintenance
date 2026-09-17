import csv
import io
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.work_order import WorkOrder
from app.schemas.report import DashboardOverviewResponse
from app.services.report_service import ReportService
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/dashboard", response_model=DashboardOverviewResponse)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = ReportService.get_dashboard_overview(db)
    return data

@router.get("/performance")
def get_maintenance_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ReportService.get_maintenance_performance_report(db)

@router.get("/export/work-orders-csv")
def export_work_orders_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    work_orders = db.query(WorkOrder).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Work Order ID", "Asset ID", "Asset Name", "Title", "Priority", 
        "Status", "Assigned Technician", "Actual Cost", "Planned Start", "Actual End", "Created At"
    ])

    for wo in work_orders:
        writer.writerow([
            wo.id,
            wo.asset_id,
            wo.asset.name if wo.asset else "",
            wo.title,
            wo.priority.value,
            wo.status.value,
            wo.assigned_technician.name if wo.assigned_technician else "Unassigned",
            wo.actual_cost,
            wo.planned_start.isoformat() if wo.planned_start else "",
            wo.actual_end.isoformat() if wo.actual_end else "",
            wo.created_at.isoformat()
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=assetflow_work_orders_export.csv"}
    )
