from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.asset import AssetStatus, AssetCriticality
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse, AssetDetailResponse, AssetListResponse
from app.services.asset_service import AssetService
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("", response_model=AssetListResponse)
def list_assets(
    search: Optional[str] = None,
    status: Optional[AssetStatus] = None,
    criticality: Optional[AssetCriticality] = None,
    location: Optional[str] = None,
    asset_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skip = (page - 1) * page_size
    items, total = AssetService.get_assets(
        db=db,
        search=search,
        status_filter=status,
        criticality_filter=criticality,
        location_filter=location,
        asset_type_filter=asset_type,
        skip=skip,
        limit=page_size
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return AssetListResponse(
        items=[AssetResponse.model_validate(a) for a in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{asset_id}", response_model=AssetDetailResponse)
def get_asset_detail(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    detail = AssetService.get_asset_detail(db, asset_id)
    return detail

@router.post("", response_model=AssetResponse)
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER]))
):
    asset = AssetService.create_asset(db, asset_in, current_user)
    return AssetResponse.model_validate(asset)

@router.patch("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: str,
    asset_in: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER]))
):
    asset = AssetService.update_asset(db, asset_id, asset_in, current_user)
    return AssetResponse.model_validate(asset)
