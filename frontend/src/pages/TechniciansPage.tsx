import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { TechnicianWorkload } from '../types';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { Users, Wrench, Award, CheckCircle, Clock } from 'lucide-react';

export const TechniciansPage: React.FC = () => {
  const [technicians, setTechnicians] = useState<TechnicianWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadTechnicians = async () => {
    try {
      setLoading(true);
      const res = await apiService.getTechnicianWorkload();
      setTechnicians(res);
    } catch (err) {
      showToast('Failed to load technicians', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechnicians();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Maintenance Technicians Directory</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Specialty skills, technical certifications, real-time assignment availability, and active workload.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-slate-400">Loading technicians...</div>
        ) : (
          technicians.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{t.name}</span>
                    <span className="font-mono text-2xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      {t.employee_id}
                    </span>
                  </div>
                  <p className="text-slate-500 text-2xs mt-0.5">Specialty: {t.specialty}</p>
                </div>
                <Badge variant={t.availability_status === 'AVAILABLE' ? 'success' : 'warning'}>
                  {t.availability_status}
                </Badge>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Wrench className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span className="font-medium text-slate-700">Skills:</span>
                  <span className="truncate">{t.skills}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold text-slate-900">{t.active_work_orders_count}</span>
                    <span className="text-2xs text-slate-500">Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-bold text-slate-900">{t.completed_work_orders_count}</span>
                    <span className="text-2xs text-slate-500">Completed</span>
                  </div>
                </div>
                <span className="font-mono text-2xs font-semibold text-brand-700">
                  {t.open_work_orders_count} Total Assigned
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
