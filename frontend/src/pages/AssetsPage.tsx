import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Asset, AssetCriticality, AssetStatus } from '../types';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Plus, Cpu, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [critFilter, setCritFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // New Asset Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    id: '',
    name: '',
    asset_type: 'Electrical Equipment',
    model: '',
    serial_number: '',
    location: '',
    criticality: 'MEDIUM' as AssetCriticality,
    status: 'OPERATIONAL' as AssetStatus,
    installation_date: new Date().toISOString().split('T')[0],
  });

  const { user } = useAuth();
  const { showToast } = useToast();

  const loadAssets = async () => {
    try {
      setLoading(true);
      const params: any = { page, page_size: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (critFilter) params.criticality = critFilter;

      const res = await apiService.getAssets(params);
      setAssets(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      showToast('Failed to load assets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [page, statusFilter, critFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAssets();
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createAsset(newAsset);
      showToast(`Asset ${newAsset.id} registered successfully`, 'success');
      setIsModalOpen(false);
      loadAssets();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create asset', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Asset Master Data</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of all plant machinery, converters, turbines, and facility equipment ({total} records).
          </p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_MANAGER') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register Asset</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, model, serial, or location..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-brand-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="OPERATIONAL">OPERATIONAL</option>
            <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
            <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
            <option value="RETIRED">RETIRED</option>
          </select>

          <select
            value={critFilter}
            onChange={(e) => {
              setCritFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-700"
          >
            <option value="">All Criticalities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Equipment Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Model & Serial</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Criticality</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading asset master records...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No matching assets found.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      <Link to={`/assets/${asset.id}`} className="hover:underline">
                        {asset.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-[200px] truncate">
                      {asset.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{asset.asset_type}</td>
                    <td className="py-3 px-4 font-mono text-2xs text-slate-500">
                      {asset.model} • {asset.serial_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{asset.location}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          asset.criticality === 'CRITICAL'
                            ? 'danger'
                            : asset.criticality === 'HIGH'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {asset.criticality}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(asset.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/assets/${asset.id}`}
                        className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-semibold p-1 hover:bg-brand-50 rounded"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
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
            Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, total)} of {total} assets
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

      {/* Register Asset Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Industrial Asset"
        subtitle="Adds new equipment master record to the relational database"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Asset ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. AST-10099"
                value={newAsset.id}
                onChange={(e) => setNewAsset({ ...newAsset, id: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Equipment Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Steam Turbine Unit 4"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Asset Category *</label>
              <select
                value={newAsset.asset_type}
                onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              >
                <option value="Electrical Equipment">Electrical Equipment</option>
                <option value="Mechanical Machinery">Mechanical Machinery</option>
                <option value="HVAC">HVAC</option>
                <option value="Hydraulic System">Hydraulic System</option>
                <option value="Robotics">Robotics</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Model Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. SIEMENS-SGT-400"
                value={newAsset.model}
                onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Serial Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. SN-998822"
                value={newAsset.serial_number}
                onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Plant Location *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bangalore Facility - Substation 2"
                value={newAsset.location}
                onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Criticality</label>
              <select
                value={newAsset.criticality}
                onChange={(e) => setNewAsset({ ...newAsset, criticality: e.target.value as AssetCriticality })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Installation Date</label>
              <input
                type="date"
                value={newAsset.installation_date}
                onChange={(e) => setNewAsset({ ...newAsset, installation_date: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold"
            >
              Register Asset
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
