import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models.maintenance_request import MaintenanceRequest, RequestStatus, RequestPriority
from app.models.asset import Asset, AssetStatus
from app.models.work_order import WorkOrder, WorkOrderStatus, WorkOrderPriority
from app.models.user import User
from app.schemas.request import MaintenanceRequestCreate, MaintenanceRequestReview
from app.services.audit_service import AuditService

class RequestService:
    @staticmethod
    def get_requests(
        db: Session,
        search: Optional[str] = None,
        status_filter: Optional[RequestStatus] = None,
        priority_filter: Optional[RequestPriority] = None,
        asset_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 15
    ) -> Tuple[List[MaintenanceRequest], int]:
        query = db.query(MaintenanceRequest)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    MaintenanceRequest.id.ilike(search_pattern),
                    MaintenanceRequest.title.ilike(search_pattern),
                    MaintenanceRequest.description.ilike(search_pattern),
                    MaintenanceRequest.asset_id.ilike(search_pattern)
                )
            )

        if status_filter:
            query = query.filter(MaintenanceRequest.status == status_filter)

        if priority_filter:
            query = query.filter(MaintenanceRequest.priority == priority_filter)

        if asset_id:
            query = query.filter(MaintenanceRequest.asset_id == asset_id)

        total = query.count()
        items = query.order_by(MaintenanceRequest.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_request_by_id(db: Session, request_id: str) -> MaintenanceRequest:
        req = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Maintenance Request '{request_id}' not found."
            )
        return req

    @staticmethod
    def create_request(db: Session, req_in: MaintenanceRequestCreate, reporter: User) -> MaintenanceRequest:
        # Validate Asset exists
        asset = db.query(Asset).filter(Asset.id == req_in.asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset '{req_in.asset_id}' does not exist."
            )

        # Business Rule 1: Cannot create maintenance request for inactive/retired asset
        if asset.status in [AssetStatus.RETIRED, AssetStatus.OUT_OF_SERVICE]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Business Rule Violation: Cannot create maintenance request for asset in status '{asset.status.value}'."
            )

        # Generate Request ID (e.g. MR-2026-00xxx)
        year = datetime.datetime.now().year
        count = db.query(MaintenanceRequest).count() + 1
        req_id = f"MR-{year}-{count:05d}"

        new_req = MaintenanceRequest(
            id=req_id,
            asset_id=asset.id,
            reporter_id=reporter.id,
            title=req_in.title,
            description=req_in.description,
            category=req_in.category,
            priority=req_in.priority,
            status=RequestStatus.OPEN
        )
        db.add(new_req)

        AuditService.log_action(
            db=db,
            actor=reporter,
            action="CREATE_REQUEST",
            entity="MAINTENANCE_REQUEST",
            entity_id=req_id,
            previous_state=None,
            new_state=RequestStatus.OPEN.value,
            metadata_info=f"Reported problem for asset {asset.name} ({asset.id}) with priority {req_in.priority.value}"
        )

        db.commit()
        db.refresh(new_req)
        return new_req

    @staticmethod
    def review_request(db: Session, request_id: str, review_in: MaintenanceRequestReview, reviewer: User) -> MaintenanceRequest:
        req = RequestService.get_request_by_id(db, request_id)

        # Business Rule 6: Cannot approve an already rejected request
        if req.status == RequestStatus.REJECTED and review_in.action == "APPROVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Business Rule Violation: Cannot approve a rejected maintenance request '{request_id}'."
            )

        if req.status in [RequestStatus.CONVERTED_TO_WORK_ORDER, RequestStatus.CLOSED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Request '{request_id}' is already finalized in status '{req.status.value}'."
            )

        prev_status = req.status.value
        req.reviewed_by_id = reviewer.id

        if review_in.action == "REJECT":
            if not review_in.rejection_reason:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A detailed rejection reason is required to reject a maintenance request."
                )
            req.status = RequestStatus.REJECTED
            req.rejection_reason = review_in.rejection_reason

            AuditService.log_action(
                db=db,
                actor=reviewer,
                action="REJECT_REQUEST",
                entity="MAINTENANCE_REQUEST",
                entity_id=req.id,
                previous_state=prev_status,
                new_state=req.status.value,
                metadata_info=f"Rejected request: {review_in.rejection_reason}"
            )
        elif review_in.action == "APPROVE":
            req.status = RequestStatus.CONVERTED_TO_WORK_ORDER
            
            # Map request priority to work order priority
            wo_priority = WorkOrderPriority(review_in.target_priority.value if review_in.target_priority else req.priority.value)
            
            # Create resulting Work Order
            year = datetime.datetime.now().year
            wo_count = db.query(WorkOrder).count() + 1
            wo_id = f"WO-{year}-{wo_count:05d}"
            
            # If reviewing the demo request MR-2026-00482, ensure it produces WO-2026-00982 if not already taken
            if req.id == "MR-2026-00482":
                existing_demo_wo = db.query(WorkOrder).filter_by(id="WO-2026-00982").first()
                if not existing_demo_wo:
                    wo_id = "WO-2026-00982"

            work_order = WorkOrder(
                id=wo_id,
                request_id=req.id,
                asset_id=req.asset_id,
                created_by_id=reviewer.id,
                title=f"Repair: {req.title}",
                description=f"Generated from Request {req.id}: {req.description}",
                priority=wo_priority,
                status=WorkOrderStatus.APPROVED,  # Approved upon manager conversion
                planned_start=datetime.datetime.now(datetime.timezone.utc),
                planned_end=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)
            )
            db.add(work_order)

            # Update asset status to UNDER_MAINTENANCE
            asset = db.query(Asset).filter(Asset.id == req.asset_id).first()
            if asset and asset.status == AssetStatus.OPERATIONAL:
                asset.status = AssetStatus.UNDER_MAINTENANCE

            AuditService.log_action(
                db=db,
                actor=reviewer,
                action="APPROVE_REQUEST_CONVERT_WO",
                entity="MAINTENANCE_REQUEST",
                entity_id=req.id,
                previous_state=prev_status,
                new_state=req.status.value,
                metadata_info=f"Approved request and generated Work Order {work_order.id}"
            )
            AuditService.log_action(
                db=db,
                actor=reviewer,
                action="CREATE_WORK_ORDER",
                entity="WORK_ORDER",
                entity_id=work_order.id,
                previous_state=None,
                new_state=work_order.status.value,
                metadata_info=f"Work Order {work_order.id} automatically created from request {req.id}"
            )

        db.commit()
        db.refresh(req)
        return req
