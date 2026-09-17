import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { DashboardOverview } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge, getStatusBadge } from '../components/common/Badge';
import {
  Cpu,
  CheckCircle2,
  Wrench,
  FileSpreadsheet,
  ClipboardList,
  AlertTriangle,
  Package,
  CalendarClock,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiService.getDashboardOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Plant Maintenance Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time operational KPIs for equipment health, active work orders, inventory stock, and compliance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/requests"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <span>+ Report Problem</span>
          </Link>
          <Link
            to="/work-orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
          >
            <span>View Work Orders</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Plant Assets"
          value={kpis.total_assets}
          subtitle={`${kpis.operational_assets} operational`}
          icon={<Cpu className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Under Maintenance"
          value={kpis.assets_under_maintenance}
          subtitle="Currently undergoing servicing"
          icon={<Wrench className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          label="Open Requests"
          value={kpis.open_maintenance_requests}
          subtitle="Awaiting manager review"
          icon={<FileSpreadsheet className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Active Work Orders"
          value={kpis.active_work_orders}
          subtitle={`${kpis.overdue_work_orders} overdue orders`}
          icon={<ClipboardList className="w-5 h-5" />}
          color={kpis.overdue_work_orders > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Critical Assets"
          value={kpis.critical_assets_count}
          subtitle="High priority production machinery"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="rose"
        />
        <StatCard
          label="Low Stock Parts"
          value={kpis.low_stock_parts_count}
          subtitle="Below reorder threshold"
          icon={<Package className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          label="Overdue PM Tasks"
          value={kpis.overdue_pm_count}
          subtitle="Requires work order generation"
          icon={<CalendarClock className="w-5 h-5" />}
          color="rose"
        />
      </div>

      {/* Middle Visual Section: Work Order Distribution & Technician Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Orders by Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Work Orders by Lifecycle Status</h2>
            <Link to="/work-orders" className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.work_orders_by_status.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700">{item.name.replace(/_/g, ' ')}</span>
                  <span className="text-slate-500 font-mono">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.name === 'CLOSED'
                        ? 'bg-emerald-500'
                        : item.name === 'IN_PROGRESS'
                        ? 'bg-brand-500'
                        : item.name === 'WAITING_FOR_PARTS'
                        ? 'bg-amber-500'
                        : 'bg-indigo-400'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technician Active Workload */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Technician Execution Workload</h2>
            <Link to="/technicians" className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
              Directory <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.technician_workload.map((tech) => (
              <div key={tech.technician_name} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{tech.technician_name}</p>
                  <p className="text-2xs text-slate-500">{tech.completed_orders} completed maintenance tasks</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={tech.active_orders > 0 ? 'warning' : 'success'}>
                    {tech.active_orders} Active Order{tech.active_orders === 1 ? '' : 's'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audit Events */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900">Live Enterprise Audit Log Stream</h2>
          </div>
          <Link to="/audit-logs" className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
            Complete audit trail <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Actor</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">Entity ID</th>
                <th className="pb-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent_audit_events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 text-slate-500 font-mono">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 font-medium text-slate-800">{event.actor_name || 'System'}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-mono text-2xs font-semibold">
                      {event.action}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-brand-700">{event.entity_id}</td>
                  <td className="py-2.5 text-slate-600 truncate max-w-xs">{event.metadata_info || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
