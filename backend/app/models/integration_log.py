from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.db.base import Base

class IntegrationSyncLog(Base):
    __tablename__ = "integration_sync_logs"

    id = Column(String(50), primary_key=True, index=True)  # e.g., SYNC-2026-0001
    source_system = Column(String(100), nullable=False)  # Legacy ERP / Legacy CMMS
    batch_id = Column(String(100), nullable=False, index=True)
    operation = Column(String(100), nullable=False)  # ASSET_IMPORT, PARTS_SYNC
    records_received = Column(Integer, default=0, nullable=False)
    records_processed = Column(Integer, default=0, nullable=False)
    records_failed = Column(Integer, default=0, nullable=False)
    status = Column(String(50), nullable=False, default="SUCCESS")  # SUCCESS, PARTIAL_SUCCESS, FAILED
    error_details = Column(Text, nullable=True)
    synced_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
