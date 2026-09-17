from pydantic import BaseModel
from typing import List, Dict, Any

class DashboardKPIs(BaseModel):
    total_assets: int
    operational_assets: int
    assets_under_maintenance: int
    open_maintenance_requests: int
    active_work_orders: int
    overdue_work_orders: int
    critical_assets_count: int
    low_stock_parts_count: int
    overdue_pm_count: int

class StatusDistribution(BaseModel):
    name: str
    count: int
    percentage: float

class WorkloadItem(BaseModel):
    technician_name: str
    active_orders: int
    completed_orders: int

class CostTrendItem(BaseModel):
    period: str
    parts_cost: float
    labor_cost: float
    total_cost: float

class DashboardOverviewResponse(BaseModel):
    kpis: DashboardKPIs
    work_orders_by_status: List[StatusDistribution]
    requests_by_priority: List[StatusDistribution]
    assets_by_status: List[StatusDistribution]
    technician_workload: List[WorkloadItem]
    recent_audit_events: List[Any]
