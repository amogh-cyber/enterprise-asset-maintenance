import enum
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Enum, DateTime, Date, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class AssetCriticality(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AssetStatus(str, enum.Enum):
    OPERATIONAL = "OPERATIONAL"
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE"
    OUT_OF_SERVICE = "OUT_OF_SERVICE"
    RETIRED = "RETIRED"

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(50), primary_key=True, index=True)  # e.g., AST-10042
    name = Column(String(150), nullable=False)
    asset_type = Column(String(100), nullable=False)  # e.g. Electrical Equipment, Rotating Machinery
    model = Column(String(100), nullable=False)
    serial_number = Column(String(100), unique=True, index=True, nullable=False)
    location = Column(String(150), nullable=False)  # e.g. Bangalore Facility
    criticality = Column(Enum(AssetCriticality), default=AssetCriticality.MEDIUM, nullable=False)
    status = Column(Enum(AssetStatus), default=AssetStatus.OPERATIONAL, nullable=False)
    installation_date = Column(Date, nullable=False, default=date.today)
    last_maintenance_date = Column(Date, nullable=True)
    next_maintenance_date = Column(Date, nullable=True)
    specifications = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    maintenance_requests = relationship("MaintenanceRequest", back_populates="asset", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="asset", cascade="all, delete-orphan")
    pm_schedules = relationship("PreventiveMaintenanceSchedule", back_populates="asset", cascade="all, delete-orphan")
