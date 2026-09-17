import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class RequestPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RequestStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CONVERTED_TO_WORK_ORDER = "CONVERTED_TO_WORK_ORDER"
    CLOSED = "CLOSED"

class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id = Column(String(50), primary_key=True, index=True)  # e.g., MR-2026-00482
    asset_id = Column(String(50), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, default="General")
    priority = Column(Enum(RequestPriority), default=RequestPriority.MEDIUM, nullable=False)
    status = Column(Enum(RequestStatus), default=RequestStatus.OPEN, nullable=False)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    asset = relationship("Asset", back_populates="maintenance_requests")
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reported_requests")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    work_order = relationship("WorkOrder", back_populates="maintenance_request", uselist=False)
