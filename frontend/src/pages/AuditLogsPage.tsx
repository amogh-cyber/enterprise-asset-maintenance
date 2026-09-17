import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { AuditLog } from '../types';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = { page, page_size: 25 };
      if (entityFilter) params.entity = entityFilter;
      if (actionFilter) params.action = actionFilter;

      const res = await apiService.getAuditLogs(params);
      setLogs(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      showToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, entityFilter, actionFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Audit Trail & Compliance Log</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable regulatory record of all logins, master data modifications, work-order status transitions, and inventory deductions ({total} events).
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-700"
          >
            <option value="">All Entities</option>
            <option value="ASSET">ASSET</option>
            <option value="MAINTENANCE_REQUEST">MAINTENANCE REQUEST</option>
            <option value="WORK_ORDER">WORK ORDER</option>
            <option value="INVENTORY">INVENTORY</option>
            <option value="USER">USER</option>
            <option value="INTEGRATION">INTEGRATION</option>
          </select>

          <input
            type="text"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by action (e.g. CONSUME, APPROVE)..."
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white min-w-[200px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Event #</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">Previous State</th>
                <th className="py-3 px-4">New State</th>
                <th className="py-3 px-4">Audit Metadata</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading compliance audit log...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No matching audit events recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-400">#{log.id}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-800">{log.actor_name || 'System'}</div>
                      <div className="text-2xs text-slate-400">{log.actor_role}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-2xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-600">{log.entity}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-brand-700">{log.entity_id}</td>
                    <td className="py-2.5 px-4 font-mono text-2xs text-slate-500 max-w-[120px] truncate">
                      {log.previous_state || '-'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-2xs font-semibold text-slate-800 max-w-[120px] truncate">
                      {log.new_state || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">{log.metadata_info || '-'}</td>
                    <td className="py-2.5 px-4 font-mono text-2xs text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
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
            Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, total)} of {total} audit records
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
