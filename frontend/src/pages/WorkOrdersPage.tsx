import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { WorkOrder } from '../types';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { ClipboardList, Search, ChevronLeft, ChevronRight, Eye, User, Calendar } from 'lucide-react';

export const WorkOrdersPage: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      const params: any = { page, page_size: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await apiService.getWorkOrders(params);
      setWorkOrders(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      showToast('Failed to load work orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, [page, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Maintenance Work Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational orders execution, technician scheduling, and parts consumption ({total} orders).
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadWorkOrders()}
            placeholder="Search WO ID, Title, Asset ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="CREATED">CREATED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="WAITING_FOR_PARTS">WAITING FOR PARTS</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="VALIDATION_PENDING">VALIDATION PENDING</option>
          <option value="VALIDATED">VALIDATED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Equipment / Asset</th>
                <th className="py-3 px-4">Title / Scope</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Actual Cost</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading work orders...
                  </td>
                </tr>
              ) : workOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No work orders found.
                  </td>
                </tr>
              ) : (
                workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      <Link to={`/work-orders/${wo.id}`} className="hover:underline">
                        {wo.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      <Link to={`/assets/${wo.asset_id}`} className="hover:underline text-brand-600">
                        {wo.asset_id}
                      </Link>
                      <div className="text-2xs text-slate-400 truncate max-w-[130px]">{wo.asset_name}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">{wo.title}</td>
                    <td className="py-3 px-4">
                      <Badge variant={wo.priority === 'CRITICAL' ? 'danger' : wo.priority === 'HIGH' ? 'warning' : 'neutral'}>
                        {wo.priority}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(wo.status)}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {wo.assigned_technician_name ? (
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{wo.assigned_technician_name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      ${wo.actual_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/work-orders/${wo.id}`}
                        className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-semibold p-1 hover:bg-brand-50 rounded"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, total)} of {total} orders
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
