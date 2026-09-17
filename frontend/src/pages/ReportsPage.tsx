import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { StatCard } from '../components/common/StatCard';
import { useToast } from '../context/ToastContext';
import { BarChart3, Download, DollarSign, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await apiService.getPerformanceReport();
      setData(res);
    } catch (err) {
      showToast('Failed to load performance report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleExportCsv = () => {
    const url = apiService.exportWorkOrdersCsvUrl();
    window.open(url, '_blank');
    showToast('Work orders CSV export initiated', 'success');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Maintenance Performance & Cost Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational efficiency, equipment work-order completion rates, and parts vs labor expenditure.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Work Orders (CSV)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Maintenance Orders"
          value={data.total_orders}
          subtitle={`${data.closed_orders} completed & closed`}
          icon={<BarChart3 className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Order Completion Rate"
          value={`${data.completion_rate}%`}
          subtitle="Closed vs Total Work Orders"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          label="Total Maintenance Cost"
          value={`$${data.total_cost.toLocaleString()}`}
          subtitle="Parts + Recorded Labor"
          icon={<DollarSign className="w-5 h-5" />}
          color="slate"
        />
        <StatCard
          label="Parts vs Labor Ratio"
          value={`$${data.parts_cost.toLocaleString()}`}
          subtitle={`Labor: $${data.labor_cost.toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Cost Breakdown & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Maintenance Cost Distribution
          </h2>
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Spare Parts Consumed</span>
                <span className="font-mono font-bold">${data.parts_cost.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full"
                  style={{
                    width: `${data.total_cost > 0 ? (data.parts_cost / data.total_cost) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Labor Hours (Technician Rates)</span>
                <span className="font-mono font-bold">${data.labor_cost.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{
                    width: `${data.total_cost > 0 ? (data.labor_cost / data.total_cost) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Orders by Criticality & Priority
          </h2>
          <div className="space-y-2.5 text-xs">
            {Object.entries(data.orders_by_priority).map(([prio, cnt]: any) => (
              <div key={prio} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="font-semibold text-slate-700">{prio} Priority</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {cnt} orders
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
