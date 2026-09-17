from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.work_order import WorkOrder, WorkOrderStatus
from app.schemas.user import UserResponse, TechnicianWorkloadResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users & Technicians"])

@router.get("/technicians", response_model=List[UserResponse])
def get_all_technicians(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    technicians = db.query(User).filter(User.role == UserRole.TECHNICIAN).all()
    return technicians

@router.get("/technicians/workload", response_model=List[TechnicianWorkloadResponse])
def get_technicians_workload(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    technicians = db.query(User).filter(User.role == UserRole.TECHNICIAN).all()
    results = []

    for tech in technicians:
        active_count = db.query(WorkOrder).filter(
            WorkOrder.assigned_technician_id == tech.id,
            WorkOrder.status.in_([WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.WAITING_FOR_PARTS])
        ).count()

        completed_count = db.query(WorkOrder).filter(
            WorkOrder.assigned_technician_id == tech.id,
            WorkOrder.status.in_([WorkOrderStatus.COMPLETED, WorkOrderStatus.VALIDATED, WorkOrderStatus.CLOSED])
        ).count()

        open_count = db.query(WorkOrder).filter(
            WorkOrder.assigned_technician_id == tech.id,
            WorkOrder.status.notin_([WorkOrderStatus.CLOSED])
        ).count()

        profile = tech.technician_profile
        results.append(
            TechnicianWorkloadResponse(
                id=tech.id,
                employee_id=tech.employee_id,
                name=tech.name,
                specialty=profile.specialty if profile else "General",
                skills=profile.skills if profile else "Mechanical",
                availability_status=profile.availability_status if profile else "AVAILABLE",
                active_work_orders_count=active_count,
                completed_work_orders_count=completed_count,
                open_work_orders_count=open_count
            )
        )

    return results
