import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { PMSchedule } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { CalendarClock, Play, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const PreventiveMaintenancePage: React.FC = () => {
  const [schedules, setSchedules] = useState<PMSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Result modal
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [genResult, setGenResult] = useState<{
    schedules_checked: number;
    overdue_found: number;
    work_orders_generated: number;
    work_orders_skipped_existing: number;
    details: string[];
  } | null>(null);

  const { user } = useAuth();
  const { showToast } = useToast();

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const res = await apiService.getPMSchedules();
      setSchedules(res);
    } catch (err) {
      showToast('Failed to load preventive schedules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleRunGenerator = async () => {
    try {
      setGenerating(true);
      const res = await apiService.runPMAutoGeneration();
      setGenResult(res);
      setResultModalOpen(true);
      showToast(
        `PM Generator completed: ${res.work_orders_generated} orders generated, ${res.work_orders_skipped_existing} skipped (duplicate prevention)`,
        'success'
      );
      loadSchedules();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'PM generator execution failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const overdueCount = schedules.filter((s) => s.is_overdue).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Preventive Maintenance Schedules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Routine equipment servicing intervals and automated work-order generation engine.
          </p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_MANAGER') && (
          <button
            disabled={generating}
            onClick={handleRunGenerator}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{generating ? 'Running PM Engine...' : 'Run Auto PM Generator'}</span>
          </button>
        )}
      </div>

      {/* Summary Banner */}
      {overdueCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-900">
                {overdueCount} Preventive Maintenance Schedule{overdueCount === 1 ? '' : 's'} Currently Overdue
              </p>
              <p className="text-2xs text-rose-700 mt-0.5">
                Immediate maintenance orders are required. The auto PM generator will safely spawn orders with duplicate protection.
              </p>
            </div>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_MANAGER') && (
            <button
              onClick={handleRunGenerator}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Generate Orders Now
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Schedule ID</th>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Maintenance Task Type</th>
                <th className="py-3 px-4">Interval</th>
                <th className="py-3 px-4">Last Performed</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4">Overdue Status</th>
                <th className="py-3 px-4">Responsible Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading PM schedules...
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{s.id}</td>
                    <td className="py-3 px-4 font-mono">
                      <Link to={`/assets/${s.asset_id}`} className="text-brand-600 hover:underline font-semibold">
                        {s.asset_id}
                      </Link>
                      <div className="text-2xs text-slate-400 truncate max-w-[150px]">{s.asset_name}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{s.maintenance_type}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{s.interval_days} days</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{s.last_performed_date || 'Baseline'}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{s.next_due_date}</td>
                    <td className="py-3 px-4">
                      {s.is_overdue ? (
                        <Badge variant="danger">OVERDUE ({Math.abs(s.days_until_due)}d ago)</Badge>
                      ) : (
                        <Badge variant="success">In {s.days_until_due} days</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.responsible_team}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto Generation Result Modal */}
      <Modal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title="Automated PM Work Order Generation Results"
        subtitle="Business Rule 7 (Duplicate Prevention) & Order Generation Summary"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-2xs text-slate-400 uppercase font-semibold">Overdue Detected</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{genResult?.overdue_found}</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
              <p className="text-2xs uppercase font-semibold">Orders Generated</p>
              <p className="text-lg font-bold mt-1">+{genResult?.work_orders_generated}</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
              <p className="text-2xs uppercase font-semibold">Skipped (Active Orders Exist)</p>
              <p className="text-lg font-bold mt-1">{genResult?.work_orders_skipped_existing}</p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-800 mb-2">Detailed Generator Execution Log:</p>
            <div className="max-h-52 overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-2xs space-y-1">
              {genResult?.details.map((line, idx) => (
                <div key={idx} className="text-slate-700">
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={() => setResultModalOpen(false)}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
