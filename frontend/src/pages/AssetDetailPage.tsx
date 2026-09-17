import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { AssetDetail } from '../types';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Cpu,
  ArrowLeft,
  Calendar,
  MapPin,
  Barcode,
  Wrench,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';

export const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'work-orders' | 'requests' | 'pm'>('work-orders');

  // Quick report modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportPrio, setReportPrio] = useState('HIGH');
  const [reportCat, setReportCat] = useState('Electrical');

  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadAssetDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await apiService.getAssetDetail(id);
      setAsset(res);
    } catch (err) {
      showToast('Failed to load asset details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssetDetail();
  }, [id]);

  const handleReportProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    try {
      const res = await apiService.createRequest({
        asset_id: asset.id,
        title: reportTitle,
        description: reportDesc,
        category: reportCat,
        priority: reportPrio,
      });
      showToast(`Maintenance Request ${res.id} submitted!`, 'success');
      setIsReportModalOpen(false);
      loadAssetDetail();
      navigate('/requests');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to submit request', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Asset not found.</p>
        <Link to="/assets" className="text-xs text-brand-600 font-semibold mt-2 inline-block">
          Return to Assets Master
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div>
        <Link
          to="/assets"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assets Master
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-50 text-brand-600 border border-brand-100 rounded-xl">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{asset.name}</h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {asset.id}
                </span>
                {getStatusBadge(asset.status)}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {asset.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5 text-slate-400" /> SN: {asset.serial_number}
                </span>
                <span>•</span>
                <span>Model: {asset.model}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Maintenance Problem</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-2xs font-semibold uppercase text-slate-400 tracking-wider">Criticality</p>
          <div className="mt-1">
            <Badge
              variant={
                asset.criticality === 'CRITICAL'
                  ? 'danger'
                  : asset.criticality === 'HIGH'
                  ? 'warning'
                  : 'neutral'
              }
              size="md"
            >
              {asset.criticality}
            </Badge>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-2xs font-semibold uppercase text-slate-400 tracking-wider">Active Work Orders</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{asset.active_work_orders_count}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-2xs font-semibold uppercase text-slate-400 tracking-wider">Open Requests</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{asset.open_requests_count}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-2xs font-semibold uppercase text-slate-400 tracking-wider">Total Maint. Cost</p>
          <p className="text-xl font-bold text-slate-900 mt-1">${asset.total_maintenance_cost.toLocaleString()}</p>
        </div>
      </div>

      {/* Specifications & Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Specifications */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Technical Specification
          </h2>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Asset Category:</span>
              <span className="font-semibold text-slate-800">{asset.asset_type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Installation Date:</span>
              <span className="font-semibold text-slate-800">{asset.installation_date}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Last Maintenance:</span>
              <span className="font-semibold text-slate-800">{asset.last_maintenance_date || 'No record'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Next Scheduled PM:</span>
              <span className="font-semibold text-slate-800">{asset.next_maintenance_date || 'Not scheduled'}</span>
            </div>
          </div>
          {asset.specifications && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed border border-slate-100">
              {asset.specifications}
            </div>
          )}
        </div>

        {/* Tabbed Activity / Work Orders / Requests */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="flex border-b border-slate-200 bg-slate-50/60 px-4 pt-2">
            <button
              onClick={() => setActiveTab('work-orders')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'work-orders'
                  ? 'border-brand-600 text-brand-700 bg-white rounded-t'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Work Orders ({asset.work_orders.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'requests'
                  ? 'border-brand-600 text-brand-700 bg-white rounded-t'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Maintenance Requests ({asset.maintenance_requests.length})
            </button>
            <button
              onClick={() => setActiveTab('pm')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'pm'
                  ? 'border-brand-600 text-brand-700 bg-white rounded-t'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              PM Schedules ({asset.pm_schedules.length})
            </button>
          </div>

          <div className="p-4 flex-1">
            {activeTab === 'work-orders' && (
              <div className="divide-y divide-slate-100 text-xs">
                {asset.work_orders.length === 0 ? (
                  <p className="text-slate-400 py-6 text-center">No work orders recorded for this asset.</p>
                ) : (
                  asset.work_orders.map((wo) => (
                    <div key={wo.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/work-orders/${wo.id}`} className="font-mono font-bold text-brand-700 hover:underline">
                            {wo.id}
                          </Link>
                          <span className="font-medium text-slate-800">{wo.title}</span>
                        </div>
                        <p className="text-2xs text-slate-500 mt-0.5">
                          Cost: ${wo.actual_cost} • Logged: {new Date(wo.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(wo.status)}
                        <Link to={`/work-orders/${wo.id}`} className="text-slate-400 hover:text-brand-600 p-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="divide-y divide-slate-100 text-xs">
                {asset.maintenance_requests.length === 0 ? (
                  <p className="text-slate-400 py-6 text-center">No maintenance requests logged for this asset.</p>
                ) : (
                  asset.maintenance_requests.map((req) => (
                    <div key={req.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-700">{req.id}</span>
                          <span className="font-medium text-slate-800">{req.title}</span>
                        </div>
                        <p className="text-2xs text-slate-500 mt-0.5">
                          Logged: {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={req.priority === 'HIGH' ? 'warning' : 'neutral'}>{req.priority}</Badge>
                        {getStatusBadge(req.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'pm' && (
              <div className="divide-y divide-slate-100 text-xs">
                {asset.pm_schedules.length === 0 ? (
                  <p className="text-slate-400 py-6 text-center">No preventive maintenance schedules defined.</p>
                ) : (
                  asset.pm_schedules.map((pm) => (
                    <div key={pm.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{pm.maintenance_type}</p>
                        <p className="text-2xs text-slate-500 mt-0.5">
                          Interval: {pm.interval_days} days • Next due: {pm.next_due_date}
                        </p>
                      </div>
                      <div>
                        <Badge variant="success">{pm.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Problem Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={`Report Maintenance Problem on ${asset.id}`}
        subtitle={`Creates a formal maintenance notification for ${asset.name}`}
      >
        <form onSubmit={handleReportProblem} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Problem Summary / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Abnormal temperature detected or vibration spike"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category</label>
              <select
                value={reportCat}
                onChange={(e) => setReportCat(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Electrical">Electrical</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Hydraulic">Hydraulic</option>
                <option value="HVAC">HVAC</option>
                <option value="Safety">Safety</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Priority</label>
              <select
                value={reportPrio}
                onChange={(e) => setReportPrio(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Detailed Symptoms / Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Describe observations, error codes, temperature readings, abnormal noises..."
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold"
            >
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
