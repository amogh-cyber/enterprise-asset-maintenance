import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { IntegrationSyncLog } from '../types';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Server, CheckCircle2, AlertTriangle, ArrowRight, Database } from 'lucide-react';

export const IntegrationPage: React.FC = () => {
  const [simulatorRecords, setSimulatorRecords] = useState<any[]>([]);
  const [logs, setLogs] = useState<IntegrationSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [records, logList] = await Promise.all([
        apiService.getLegacySimulatorRecords(),
        apiService.getIntegrationLogs(),
      ]);
      setSimulatorRecords(records);
      setLogs(logList);
    } catch (err) {
      showToast('Failed to load integration data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      const res = await apiService.triggerLegacySync();
      showToast(
        `Sync completed (${res.status}): ${res.records_processed} imported, ${res.records_failed} failed/skipped`,
        res.status === 'SUCCESS' ? 'success' : 'warning'
      );
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Legacy ERP & CMMS System Integration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Adapter layer for legacy equipment data transformation, field mapping, duplicate rejection, and audit logging.
          </p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_MANAGER') && (
          <button
            disabled={syncing}
            onClick={handleTriggerSync}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Processing Adapter...' : 'Sync Legacy Assets'}</span>
          </button>
        )}
      </div>

      {/* Architecture Flow Diagram Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <p className="text-2xs font-semibold uppercase text-slate-400 tracking-wider mb-3">
          Enterprise Integration Architecture
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-200 text-slate-700 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Legacy Plant Maintenance</p>
              <p className="text-2xs text-slate-500 font-mono">Format: LEG-88291, raw tags</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-brand-600 font-semibold text-2xs uppercase">
            <ArrowRight className="w-4 h-4" />
            <span>Transform & Validate</span>
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">AssetFlow Master DB</p>
              <p className="text-2xs text-slate-500 font-mono">Format: AST-LEG-88291, clean schema</p>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Incoming Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Simulated Legacy Interface Records ({simulatorRecords.length})
          </h2>
          <span className="text-2xs text-slate-500">Live feed from legacy ERP simulator</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold text-2xs">
              <tr>
                <th className="py-2.5 px-4">Legacy ID</th>
                <th className="py-2.5 px-4">Plant Tag</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Legacy Code</th>
                <th className="py-2.5 px-4">Serial Number</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {simulatorRecords.map((rec) => (
                <tr key={rec.legacy_id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{rec.legacy_id}</td>
                  <td className="py-2.5 px-4 font-mono text-brand-700">{rec.plant_tag}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">{rec.machine_description}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">{rec.category_code}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{rec.mfg_serial}</td>
                  <td className="py-2.5 px-4 text-slate-600">{rec.site_location}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-700">{rec.rated_priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Execution History Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Integration Execution History ({logs.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold text-2xs">
              <tr>
                <th className="py-2.5 px-4">Batch ID</th>
                <th className="py-2.5 px-4">Source System</th>
                <th className="py-2.5 px-4">Received</th>
                <th className="py-2.5 px-4">Processed</th>
                <th className="py-2.5 px-4">Failed / Skipped</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Sync Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No synchronization batches run yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-brand-700">{log.batch_id}</td>
                    <td className="py-2.5 px-4 text-slate-700">{log.source_system}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{log.records_received}</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-600">+{log.records_processed}</td>
                    <td className="py-2.5 px-4 font-bold text-rose-600">{log.records_failed}</td>
                    <td className="py-2.5 px-4">{getStatusBadge(log.status)}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-2xs">
                      {new Date(log.synced_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
