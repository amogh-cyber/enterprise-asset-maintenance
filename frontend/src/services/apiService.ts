import { api } from './api';
import {
  User,
  Asset,
  AssetDetail,
  MaintenanceRequest,
  WorkOrder,
  WorkOrderDetail,
  Part,
  InventoryTransaction,
  PMSchedule,
  TechnicianWorkload,
  AuditLog,
  IntegrationSyncLog,
  DashboardOverview,
} from '../types';

export const apiService = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; token_type: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  // Users & Technicians
  getTechnicians: async () => {
    const res = await api.get<User[]>('/users/technicians');
    return res.data;
  },
  getTechnicianWorkload: async () => {
    const res = await api.get<TechnicianWorkload[]>('/users/technicians/workload');
    return res.data;
  },

  // Assets
  getAssets: async (params?: any) => {
    const res = await api.get<{ items: Asset[]; total: number; page: number; total_pages: number }>('/assets', { params });
    return res.data;
  },
  getAssetDetail: async (id: string) => {
    const res = await api.get<AssetDetail>(`/assets/${id}`);
    return res.data;
  },
  createAsset: async (data: Partial<Asset>) => {
    const res = await api.post<Asset>('/assets', data);
    return res.data;
  },
  updateAsset: async (id: string, data: Partial<Asset>) => {
    const res = await api.patch<Asset>(`/assets/${id}`, data);
    return res.data;
  },

  // Maintenance Requests
  getRequests: async (params?: any) => {
    const res = await api.get<{ items: MaintenanceRequest[]; total: number; page: number; total_pages: number }>('/requests', { params });
    return res.data;
  },
  getRequestById: async (id: string) => {
    const res = await api.get<MaintenanceRequest>(`/requests/${id}`);
    return res.data;
  },
  createRequest: async (data: { asset_id: string; title: string; description: string; category: string; priority: string }) => {
    const res = await api.post<MaintenanceRequest>('/requests', data);
    return res.data;
  },
  reviewRequest: async (id: string, data: { action: 'APPROVE' | 'REJECT'; rejection_reason?: string; target_priority?: string }) => {
    const res = await api.post<MaintenanceRequest>(`/requests/${id}/review`, data);
    return res.data;
  },

  // Work Orders
  getWorkOrders: async (params?: any) => {
    const res = await api.get<{ items: WorkOrder[]; total: number; page: number; total_pages: number }>('/work-orders', { params });
    return res.data;
  },
  getWorkOrderById: async (id: string) => {
    const res = await api.get<WorkOrder & { parts_consumed: any[]; activities: any[] }>(`/work-orders/${id}`);
    return res.data;
  },
  createWorkOrder: async (data: any) => {
    const res = await api.post<WorkOrder>('/work-orders', data);
    return res.data;
  },
  assignTechnician: async (id: string, data: { technician_id: number; override_skill_warning?: boolean }) => {
    const res = await api.post<WorkOrder>(`/work-orders/${id}/assign`, data);
    return res.data;
  },
  updateWorkOrderStatus: async (id: string, data: { new_status: string; notes?: string }) => {
    const res = await api.post<WorkOrder>(`/work-orders/${id}/status`, data);
    return res.data;
  },
  logWorkOrderActivity: async (id: string, data: { activity_type: string; description: string; hours_spent: number }) => {
    const res = await api.post(`/work-orders/${id}/activities`, data);
    return res.data;
  },
  consumeWorkOrderPart: async (id: string, data: { part_id: string; quantity: number; notes?: string }) => {
    const res = await api.post(`/work-orders/${id}/parts`, data);
    return res.data;
  },

  // Parts & Inventory
  getParts: async (params?: any) => {
    const res = await api.get<{ items: Part[]; total: number; page: number; total_pages: number }>('/parts', { params });
    return res.data;
  },
  getPartById: async (id: string) => {
    const res = await api.get<Part>(`/parts/${id}`);
    return res.data;
  },
  createPart: async (data: any) => {
    const res = await api.post<Part>('/parts', data);
    return res.data;
  },
  adjustStock: async (id: string, data: { transaction_type: string; quantity: number; notes?: string }) => {
    const res = await api.post<InventoryTransaction>(`/parts/${id}/adjust`, data);
    return res.data;
  },
  getInventoryTransactions: async (limit = 50) => {
    const res = await api.get<InventoryTransaction[]>('/parts/transactions', { params: { limit } });
    return res.data;
  },

  // Preventive Maintenance
  getPMSchedules: async () => {
    const res = await api.get<PMSchedule[]>('/pm/schedules');
    return res.data;
  },
  runPMAutoGeneration: async () => {
    const res = await api.post<{
      schedules_checked: number;
      overdue_found: number;
      work_orders_generated: number;
      work_orders_skipped_existing: number;
      details: string[];
    }>('/pm/auto-generate');
    return res.data;
  },

  // Reports & Dashboard
  getDashboardOverview: async () => {
    const res = await api.get<DashboardOverview>('/reports/dashboard');
    return res.data;
  },
  getPerformanceReport: async () => {
    const res = await api.get<any>('/reports/performance');
    return res.data;
  },
  exportWorkOrdersCsvUrl: () => `${api.defaults.baseURL}/reports/export/work-orders-csv`,

  // Audit Logs
  getAuditLogs: async (params?: any) => {
    const res = await api.get<{ items: AuditLog[]; total: number; page: number; total_pages: number }>('/audit', { params });
    return res.data;
  },

  // Legacy Integration
  getLegacySimulatorRecords: async () => {
    const res = await api.get<any[]>('/integrations/simulator/records');
    return res.data;
  },
  triggerLegacySync: async () => {
    const res = await api.post<any>('/integrations/sync-legacy');
    return res.data;
  },
  getIntegrationLogs: async () => {
    const res = await api.get<IntegrationSyncLog[]>('/integrations/logs');
    return res.data;
  },
};
