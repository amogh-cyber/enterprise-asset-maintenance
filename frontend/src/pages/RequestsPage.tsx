import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { MaintenanceRequest, Asset } from '../types';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { FileSpreadsheet, Plus, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Request Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [newRequest, setNewRequest] = useState({
    asset_id: 'AST-10042',
    title: '',
    description: '',
    category: 'Electrical',
    priority: 'HIGH',
  });

  // Review Request Modal (Manager)
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<MaintenanceRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [rejectionReason, setRejectionReason] = useState('');

  const { user } = useAuth();
  const { showToast } = useToast();

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params: any = { page, page_size: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await apiService.getRequests(params);
      setRequests(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      showToast('Failed to load maintenance requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [page, statusFilter]);

  const loadAssetOptions = async () => {
    try {
      const res = await apiService.getAssets({ page_size: 100 });
      setAssets(res.items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    loadAssetOptions();
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiService.createRequest(newRequest);
      showToast(`Request ${res.id} created successfully!`, 'success');
      setIsCreateOpen(false);
      setNewRequest({ asset_id: 'AST-10042', title: '', description: '', category: 'Electrical', priority: 'HIGH' });
      loadRequests();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to submit request', 'error');
    }
  };

  const handleOpenReview = (req: MaintenanceRequest) => {
    setSelectedReq(req);
    setReviewAction('APPROVE');
    setRejectionReason('');
    setIsReviewOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      const res = await apiService.reviewRequest(selectedReq.id, {
        action: reviewAction,
        rejection_reason: reviewAction === 'REJECT' ? rejectionReason : undefined,
      });
      showToast(
        reviewAction === 'APPROVE'
          ? `Request approved & converted to Work Order ${res.work_order_id}!`
          : `Request rejected.`,
        'success'
      );
      setIsReviewOpen(false);
      loadRequests();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Review action failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Maintenance Problem Requests</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operator defect reporting and manager validation workflow ({total} requests).
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Report Problem</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadRequests()}
            placeholder="Search request ID, problem title, asset..."
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
          <option value="OPEN">OPEN (Pending Review)</option>
          <option value="CONVERTED_TO_WORK_ORDER">CONVERTED TO WORK ORDER</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Problem Summary</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Reporter</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading maintenance requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">{req.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      <Link to={`/assets/${req.asset_id}`} className="hover:underline text-brand-600">
                        {req.asset_id}
                      </Link>
                      <div className="text-2xs text-slate-400 truncate max-w-[140px]">{req.asset_name}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">{req.title}</td>
                    <td className="py-3 px-4 text-slate-600">{req.category}</td>
                    <td className="py-3 px-4">
                      <Badge variant={req.priority === 'CRITICAL' ? 'danger' : req.priority === 'HIGH' ? 'warning' : 'neutral'}>
                        {req.priority}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{req.reporter_name || 'Operator'}</td>
                    <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'OPEN' && (user?.role === 'MAINTENANCE_MANAGER' || user?.role === 'ADMIN') ? (
                        <button
                          onClick={() => handleOpenReview(req)}
                          className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded text-xs transition-colors"
                        >
                          Review & Approve
                        </button>
                      ) : req.work_order_id ? (
                        <Link
                          to={`/work-orders/${req.work_order_id}`}
                          className="inline-flex items-center gap-1 font-mono text-brand-600 hover:underline font-semibold"
                        >
                          <span>{req.work_order_id}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-2xs">Completed</span>
                      )}
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
            Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, total)} of {total} requests
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

      {/* Report Problem Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Report Equipment Problem"
        subtitle="Operator initiates formal maintenance request"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Target Asset *</label>
            <select
              value={newRequest.asset_id}
              onChange={(e) => setNewRequest({ ...newRequest, asset_id: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} - {a.name} ({a.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Problem Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Abnormal temperature detected or motor vibration"
              value={newRequest.title}
              onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category</label>
              <select
                value={newRequest.category}
                onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              >
                <option value="Electrical">Electrical</option>
                <option value="Mechanical">Mechanical</option>
                <option value="HVAC">HVAC</option>
                <option value="Hydraulic">Hydraulic</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Priority</label>
              <select
                value={newRequest.priority}
                onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide exact observations..."
              value={newRequest.description}
              onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold">
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Request Modal */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title={`Review Request: ${selectedReq?.id}`}
        subtitle={`Asset: ${selectedReq?.asset_id} • Reported by: ${selectedReq?.reporter_name || 'Operator'}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <p className="font-semibold text-slate-900">{selectedReq?.title}</p>
            <p className="text-slate-600 leading-relaxed">{selectedReq?.description}</p>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">Decision Action *</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 border rounded-lg cursor-pointer flex items-center gap-2 ${
                  reviewAction === 'APPROVE'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="APPROVE"
                  checked={reviewAction === 'APPROVE'}
                  onChange={() => setReviewAction('APPROVE')}
                  className="text-emerald-600"
                />
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Approve & Convert to Work Order</span>
              </label>

              <label
                className={`p-3 border rounded-lg cursor-pointer flex items-center gap-2 ${
                  reviewAction === 'REJECT'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="REJECT"
                  checked={reviewAction === 'REJECT'}
                  onChange={() => setReviewAction('REJECT')}
                  className="text-rose-600"
                />
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Reject Request</span>
              </label>
            </div>
          </div>

          {reviewAction === 'REJECT' && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Rejection Reason *</label>
              <textarea
                required
                rows={3}
                placeholder="Specify justification for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg"
              ></textarea>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReviewOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-white rounded-lg font-semibold ${
                reviewAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Confirm Decision
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
