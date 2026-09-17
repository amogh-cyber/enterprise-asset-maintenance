import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class WorkOrderPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class WorkOrderStatus(str, enum.Enum):
    CREATED = "CREATED"
    APPROVED = "APPROVED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING_FOR_PARTS = "WAITING_FOR_PARTS"
    COMPLETED = "COMPLETED"
    VALIDATION_PENDING = "VALIDATION_PENDING"
    VALIDATED = "VALIDATED"
    CLOSED = "CLOSED"

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(String(50), primary_key=True, index=True)  # e.g., WO-2026-00982
    request_id = Column(String(50), ForeignKey("maintenance_requests.id", ondelete="SET NULL"), nullable=True, unique=True)
    asset_id = Column(String(50), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_technician_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Enum(WorkOrderPriority), default=WorkOrderPriority.MEDIUM, nullable=False)
    status = Column(Enum(WorkOrderStatus), default=WorkOrderStatus.CREATED, nullable=False)
    
    estimated_cost = Column(Float, default=0.0, nullable=False)
    actual_cost = Column(Float, default=0.0, nullable=False)
    
    planned_start = Column(DateTime(timezone=True), nullable=True)
    planned_end = Column(DateTime(timezone=True), nullable=True)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_end = Column(DateTime(timezone=True), nullable=True)
    
    completion_notes = Column(Text, nullable=True)
    validation_notes = Column(Text, nullable=True)
    validated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    maintenance_request = relationship("MaintenanceRequest", back_populates="work_order")
    asset = relationship("Asset", back_populates="work_orders")
    created_by = relationship("User", foreign_keys=[created_by_id])
    assigned_technician = relationship("User", foreign_keys=[assigned_technician_id], back_populates="assigned_work_orders")
    validated_by = relationship("User", foreign_keys=[validated_by_id])
    
    parts_consumed = relationship("WorkOrderPart", back_populates="work_order", cascade="all, delete-orphan")
    activities = relationship("WorkOrderActivity", back_populates="work_order", cascade="all, delete-orphan")
    inventory_transactions = relationship("InventoryTransaction", back_populates="work_order")

class WorkOrderActivity(Base):
    __tablename__ = "work_order_activities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    work_order_id = Column(String(50), ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String(100), nullable=False, default="Execution")  # Inspection, Repair, Testing, Replacement
    description = Column(Text, nullable=False)
    hours_spent = Column(Float, default=0.0, nullable=False)
    logged_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    work_order = relationship("WorkOrder", back_populates="activities")
    technician = relationship("User", foreign_keys=[technician_id])
