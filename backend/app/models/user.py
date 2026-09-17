import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MAINTENANCE_MANAGER = "MAINTENANCE_MANAGER"
    TECHNICIAN = "TECHNICIAN"
    OPERATOR = "OPERATOR"

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.OPERATOR, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    technician_profile = relationship("TechnicianProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    reported_requests = relationship("MaintenanceRequest", foreign_keys="[MaintenanceRequest.reporter_id]", back_populates="reporter")
    assigned_work_orders = relationship("WorkOrder", foreign_keys="[WorkOrder.assigned_technician_id]", back_populates="assigned_technician")

class TechnicianProfile(Base):
    __tablename__ = "technician_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialty = Column(String(100), nullable=False, default="General Maintenance")
    skills = Column(Text, nullable=False, default="Mechanical, Electrical")  # Comma-separated or JSON string
    certifications = Column(Text, nullable=True)
    availability_status = Column(String(50), default="AVAILABLE", nullable=False)  # AVAILABLE, ON_JOB, ON_LEAVE
    hourly_rate = Column(Float, default=50.0, nullable=False)

    user = relationship("User", back_populates="technician_profile")
