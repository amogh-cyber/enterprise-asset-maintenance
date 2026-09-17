from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from fastapi import HTTPException, status
from app.models.asset import Asset, AssetStatus, AssetCriticality
from app.models.work_order import WorkOrder, WorkOrderStatus, WorkOrderPriority
from app.models.maintenance_request import MaintenanceRequest
from app.models.pm_schedule import PreventiveMaintenanceSchedule
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetUpdate
from app.services.audit_service import AuditService

class AssetService:
    @staticmethod
    def get_assets(
        db: Session,
        search: Optional[str] = None,
        status_filter: Optional[AssetStatus] = None,
        criticality_filter: Optional[AssetCriticality] = None,
        location_filter: Optional[str] = None,
        asset_type_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 15
    ) -> Tuple[List[Asset], int]:
        query = db.query(Asset)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Asset.id.ilike(search_pattern),
                    Asset.name.ilike(search_pattern),
                    Asset.model.ilike(search_pattern),
                    Asset.serial_number.ilike(search_pattern),
                    Asset.location.ilike(search_pattern)
                )
            )

        if status_filter:
            query = query.filter(Asset.status == status_filter)

        if criticality_filter:
            query = query.filter(Asset.criticality == criticality_filter)

        if location_filter:
            query = query.filter(Asset.location.ilike(f"%{location_filter}%"))

        if asset_type_filter:
            query = query.filter(Asset.asset_type.ilike(f"%{asset_type_filter}%"))

        total = query.count()
        items = query.order_by(Asset.id.asc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_asset_by_id(db: Session, asset_id: str) -> Asset:
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset '{asset_id}' not found."
            )
        return asset

    @staticmethod
    def get_asset_detail(db: Session, asset_id: str) -> dict:
        asset = AssetService.get_asset_by_id(db, asset_id)
        
        requests = db.query(MaintenanceRequest).filter(MaintenanceRequest.asset_id == asset_id).order_by(MaintenanceRequest.created_at.desc()).all()
        work_orders = db.query(WorkOrder).filter(WorkOrder.asset_id == asset_id).order_by(WorkOrder.created_at.desc()).all()
        schedules = db.query(PreventiveMaintenanceSchedule).filter(PreventiveMaintenanceSchedule.asset_id == asset_id).all()

        open_requests_count = sum(1 for r in requests if r.status.value in ["OPEN", "UNDER_REVIEW"])
        active_work_orders = [wo for wo in work_orders if wo.status.value not in ["CLOSED"]]
        total_maint_cost = sum(wo.actual_cost for wo in work_orders)

        return {
            "id": asset.id,
            "name": asset.name,
            "asset_type": asset.asset_type,
            "model": asset.model,
            "serial_number": asset.serial_number,
            "location": asset.location,
            "criticality": asset.criticality,
            "status": asset.status,
            "installation_date": asset.installation_date,
            "last_maintenance_date": asset.last_maintenance_date,
            "next_maintenance_date": asset.next_maintenance_date,
            "specifications": asset.specifications,
            "created_at": asset.created_at,
            "updated_at": asset.updated_at,
            "open_requests_count": open_requests_count,
            "active_work_orders_count": len(active_work_orders),
            "total_maintenance_cost": round(total_maint_cost, 2),
            "maintenance_requests": [
                {
                    "id": r.id,
                    "title": r.title,
                    "priority": r.priority.value,
                    "status": r.status.value,
                    "created_at": r.created_at.isoformat()
                } for r in requests[:10]
            ],
            "work_orders": [
                {
                    "id": wo.id,
                    "title": wo.title,
                    "priority": wo.priority.value,
                    "status": wo.status.value,
                    "actual_cost": wo.actual_cost,
                    "created_at": wo.created_at.isoformat()
                } for wo in work_orders[:10]
            ],
            "pm_schedules": [
                {
                    "id": s.id,
                    "maintenance_type": s.maintenance_type,
                    "interval_days": s.interval_days,
                    "next_due_date": str(s.next_due_date),
                    "status": s.status.value
                } for s in schedules
            ]
        }

    @staticmethod
    def create_asset(db: Session, asset_in: AssetCreate, actor: User) -> Asset:
        existing = db.query(Asset).filter(
            or_(Asset.id == asset_in.id, Asset.serial_number == asset_in.serial_number)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Asset with ID '{asset_in.id}' or serial number '{asset_in.serial_number}' already exists."
            )

        asset = Asset(**asset_in.model_dump())
        db.add(asset)
        
        AuditService.log_action(
            db=db,
            actor=actor,
            action="CREATE_ASSET",
            entity="ASSET",
            entity_id=asset.id,
            previous_state=None,
            new_state=asset.status.value,
            metadata_info=f"Created asset {asset.name} ({asset.id}) at {asset.location}"
        )

        db.commit()
        db.refresh(asset)
        return asset

    @staticmethod
    def update_asset(db: Session, asset_id: str, asset_in: AssetUpdate, actor: User) -> Asset:
        asset = AssetService.get_asset_by_id(db, asset_id)
        prev_status = asset.status.value

        # Business Rule 8: Cannot retire an asset while active critical work orders exist
        if asset_in.status == AssetStatus.RETIRED:
            active_critical_wo = db.query(WorkOrder).filter(
                WorkOrder.asset_id == asset_id,
                WorkOrder.priority == WorkOrderPriority.CRITICAL,
                WorkOrder.status != WorkOrderStatus.CLOSED
            ).first()
            if active_critical_wo:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Business Rule Violation: Cannot retire asset '{asset_id}' while active critical work order '{active_critical_wo.id}' is open."
                )

        update_data = asset_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(asset, field, value)

        AuditService.log_action(
            db=db,
            actor=actor,
            action="UPDATE_ASSET",
            entity="ASSET",
            entity_id=asset.id,
            previous_state=prev_status,
            new_state=asset.status.value,
            metadata_info=f"Updated asset attributes: {list(update_data.keys())}"
        )

        db.commit()
        db.refresh(asset)
        return asset
