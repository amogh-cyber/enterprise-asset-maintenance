import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class PartStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    OBSOLETE = "OBSOLETE"
    DISCONTINUED = "DISCONTINUED"

class InventoryTransactionType(str, enum.Enum):
    STOCK_IN = "STOCK_IN"
    STOCK_OUT = "STOCK_OUT"
    ADJUSTMENT = "ADJUSTMENT"
    RETURN = "RETURN"
    RESERVED = "RESERVED"
    RELEASED = "RELEASED"

class Part(Base):
    __tablename__ = "parts"

    id = Column(String(50), primary_key=True, index=True)  # e.g., P-20481
    part_number = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, default="Mechanical")
    stock_quantity = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=5, nullable=False)
    unit_cost = Column(Float, default=0.0, nullable=False)
    warehouse_location = Column(String(100), nullable=False, default="Main Warehouse")
    status = Column(Enum(PartStatus), default=PartStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    transactions = relationship("InventoryTransaction", back_populates="part", cascade="all, delete-orphan")
    work_order_usages = relationship("WorkOrderPart", back_populates="part")

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(String(50), primary_key=True, index=True)  # e.g., TXN-2026-0001
    part_id = Column(String(50), ForeignKey("parts.id", ondelete="CASCADE"), nullable=False, index=True)
    work_order_id = Column(String(50), ForeignKey("work_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    transaction_type = Column(Enum(InventoryTransactionType), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    performed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    part = relationship("Part", back_populates="transactions")
    work_order = relationship("WorkOrder", back_populates="inventory_transactions")
    performed_by = relationship("User")

class WorkOrderPart(Base):
    __tablename__ = "work_order_parts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    work_order_id = Column(String(50), ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    part_id = Column(String(50), ForeignKey("parts.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    consumed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    work_order = relationship("WorkOrder", back_populates="parts_consumed")
    part = relationship("Part", back_populates="work_order_usages")
