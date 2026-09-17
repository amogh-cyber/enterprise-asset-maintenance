import enum
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Integer, Enum, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class PMScheduleStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    RETIRED = "RETIRED"

class PreventiveMaintenanceSchedule(Base):
    __tablename__ = "pm_schedules"

    id = Column(String(50), primary_key=True, index=True)  # e.g., PM-2026-001
    asset_id = Column(String(50), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    maintenance_type = Column(String(100), nullable=False)  # Inspection, Servicing, Overhaul, Calibration
    interval_days = Column(Integer, nullable=False, default=90)
    last_performed_date = Column(Date, nullable=True)
    next_due_date = Column(Date, nullable=False)
    responsible_team = Column(String(100), nullable=False, default="Electrical Maintenance Team")
    status = Column(Enum(PMScheduleStatus), default=PMScheduleStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    asset = relationship("Asset", back_populates="pm_schedules")
