export type UserRole = 'ADMIN' | 'MAINTENANCE_MANAGER' | 'TECHNICIAN' | 'OPERATOR';

export interface User {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  last_login?: string;
}

export type AssetCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AssetStatus = 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE' | 'RETIRED';

export interface Asset {
  id: string;
  name: string;
  asset_type: string;
  model: string;
  serial_number: string;
  location: string;
  criticality: AssetCriticality;
  status: AssetStatus;
  installation_date: string;
  last_maintenance_date?: string | null;
  next_maintenance_date?: string | null;
  specifications?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetDetail extends Asset {
  open_requests_count: number;
  active_work_orders_count: number;
  total_maintenance_cost: number;
  maintenance_requests: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    created_at: string;
  }>;
  work_orders: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    actual_cost: number;
    created_at: string;
  }>;
  pm_schedules: Array<{
    id: string;
    maintenance_type: string;
    interval_days: number;
    next_due_date: string;
    status: string;
  }>;
}

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RequestStatus = 'OPEN' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CONVERTED_TO_WORK_ORDER' | 'CLOSED';

export interface MaintenanceRequest {
  id: string;
  asset_id: string;
  asset_name?: string;
  reporter_id: number;
  reporter_name?: string;
  title: string;
  description: string;
  category: string;
  priority: RequestPriority;
  status: RequestStatus;
  reviewed_by_id?: number | null;
  reviewed_by_name?: string | null;
  rejection_reason?: string | null;
  work_order_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type WorkOrderStatus =
  | 'CREATED'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'COMPLETED'
  | 'VALIDATION_PENDING'
  | 'VALIDATED'
  | 'CLOSED';

export interface WorkOrderPart {
  id: number;
  part_id: string;
  part_number: string;
  part_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  consumed_at: string;
}

export interface WorkOrderActivity {
  id: number;
  technician_id: number;
  technician_name: string;
  activity_type: string;
  description: string;
  hours_spent: number;
  logged_at: string;
}

export interface WorkOrder {
  id: string;
  request_id?: string | null;
  asset_id: string;
  asset_name?: string;
  asset_criticality?: string;
  created_by_id: number;
  created_by_name?: string;
  assigned_technician_id?: number | null;
  assigned_technician_name?: string | null;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  estimated_cost: number;
  actual_cost: number;
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  completion_notes?: string | null;
  validation_notes?: string | null;
  validated_by_id?: number | null;
  validated_by_name?: string | null;
  created_at: string;
  updated_at: string;
  parts_consumed?: WorkOrderPart[];
  activities?: WorkOrderActivity[];
}

export interface WorkOrderDetail extends WorkOrder {
  parts_consumed: WorkOrderPart[];
  activities: WorkOrderActivity[];
}

export interface Part {
  id: string;
  part_number: string;
  name: string;
  description?: string | null;
  category: string;
  stock_quantity: number;
  reorder_level: number;
  unit_cost: number;
  warehouse_location: string;
  status: 'ACTIVE' | 'OBSOLETE' | 'DISCONTINUED';
  created_at: string;
  is_low_stock?: boolean;
}

export interface InventoryTransaction {
  id: string;
  part_id: string;
  part_name?: string;
  part_number?: string;
  work_order_id?: string | null;
  transaction_type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'RETURN' | 'RESERVED' | 'RELEASED';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  performed_by_id: number;
  performed_by_name?: string;
  notes?: string | null;
  timestamp: string;
}

export interface PMSchedule {
  id: string;
  asset_id: string;
  asset_name?: string;
  asset_location?: string;
  maintenance_type: string;
  interval_days: number;
  last_performed_date?: string | null;
  next_due_date: string;
  responsible_team: string;
  status: 'ACTIVE' | 'PAUSED' | 'RETIRED';
  is_overdue: boolean;
  days_until_due: number;
  created_at: string;
}

export interface TechnicianWorkload {
  id: number;
  employee_id: string;
  name: string;
  specialty: string;
  skills: string;
  availability_status: string;
  active_work_orders_count: number;
  completed_work_orders_count: number;
  open_work_orders_count: number;
}

export interface AuditLog {
  id: number;
  actor_id?: number | null;
  actor_name?: string | null;
  actor_role?: string | null;
  action: string;
  entity: string;
  entity_id: string;
  previous_state?: string | null;
  new_state?: string | null;
  metadata_info?: string | null;
  timestamp: string;
}

export interface IntegrationSyncLog {
  id: string;
  source_system: string;
  batch_id: string;
  operation: string;
  records_received: number;
  records_processed: number;
  records_failed: number;
  status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
  error_details?: string | null;
  synced_at: string;
}

export interface DashboardKPIs {
  total_assets: number;
  operational_assets: number;
  assets_under_maintenance: number;
  open_maintenance_requests: number;
  active_work_orders: number;
  overdue_work_orders: number;
  critical_assets_count: number;
  low_stock_parts_count: number;
  overdue_pm_count: number;
}

export interface DashboardOverview {
  kpis: DashboardKPIs;
  work_orders_by_status: Array<{ name: string; count: number; percentage: number }>;
  requests_by_priority: Array<{ name: string; count: number; percentage: number }>;
  assets_by_status: Array<{ name: string; count: number; percentage: number }>;
  technician_workload: Array<{ technician_name: string; active_orders: number; completed_orders: number }>;
  recent_audit_events: Array<{
    id: number;
    actor_name: string;
    action: string;
    entity: string;
    entity_id: string;
    timestamp: string;
    metadata_info?: string;
  }>;
}
