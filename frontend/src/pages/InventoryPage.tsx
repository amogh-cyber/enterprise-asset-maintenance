import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Part, InventoryTransaction } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Package, Search, Plus, AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, History } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'parts' | 'transactions'>('parts');
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [adjType, setAdjType] = useState('STOCK_IN');
  const [adjQty, setAdjQty] = useState(10);
  const [adjNotes, setAdjNotes] = useState('Scheduled restock shipment');

  const { user } = useAuth();
  const { showToast } = useToast();

  const loadParts = async () => {
    try {
      setLoading(true);
      const res = await apiService.getParts({ page, page_size: 15, search: search || undefined });
      setParts(res.items);
      setTotal(res.total);
    } catch (err) {
      showToast('Failed to load parts inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await apiService.getInventoryTransactions(50);
      setTransactions(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadParts();
    loadTransactions();
  }, [page]);

  const handleOpenAdjust = (part: Part) => {
    setSelectedPart(part);
    setIsAdjustOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;
    try {
      await apiService.adjustStock(selectedPart.id, {
        transaction_type: adjType,
        quantity: Number(adjQty),
        notes: adjNotes,
      });
      showToast(`Stock updated for ${selectedPart.name}`, 'success');
      setIsAdjustOpen(false);
      loadParts();
      loadTransactions();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to adjust stock', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Warehouse Spare Parts & Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock monitoring, reorder thresholds, and atomic transactional history.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('parts')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'parts'
              ? 'border-brand-600 text-brand-700 bg-white rounded-t'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Parts Catalog ({total})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'transactions'
              ? 'border-brand-600 text-brand-700 bg-white rounded-t'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Transaction History ({transactions.length})
        </button>
      </div>

      {activeTab === 'parts' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Part #</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading inventory parts...
                    </td>
                  </tr>
                ) : (
                  parts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand-700">{p.part_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono text-sm">{p.stock_quantity}</span>
                          {p.stock_quantity <= p.reorder_level && (
                            <Badge variant="danger">Low Stock (&le; {p.reorder_level})</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800">${p.unit_cost.toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-600">{p.warehouse_location}</td>
                      <td className="py-3 px-4 text-right">
                        {(user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_MANAGER') && (
                          <button
                            onClick={() => handleOpenAdjust(p)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition-colors"
                          >
                            Adjust Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Txn ID</th>
                  <th className="py-3 px-4">Part #</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Total Cost</th>
                  <th className="py-3 px-4">Related Order</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{txn.id}</td>
                    <td className="py-3 px-4 font-mono text-brand-700 font-semibold">{txn.part_number}</td>
                    <td className="py-3 px-4">
                      <Badge variant={txn.transaction_type === 'STOCK_IN' ? 'success' : 'warning'}>
                        {txn.transaction_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{txn.quantity}</td>
                    <td className="py-3 px-4 font-mono">${txn.total_cost.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-brand-600">{txn.work_order_id || '-'}</td>
                    <td className="py-3 px-4 text-slate-700">{txn.performed_by_name}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{txn.notes}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-2xs">
                      {new Date(txn.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title={`Adjust Stock: ${selectedPart?.name}`}
        subtitle={`Current stock: ${selectedPart?.stock_quantity} • ${selectedPart?.part_number}`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Transaction Type *</label>
            <select
              value={adjType}
              onChange={(e) => setAdjType(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            >
              <option value="STOCK_IN">STOCK_IN (Restock / Receiving)</option>
              <option value="STOCK_OUT">STOCK_OUT (Disposal / Scrap)</option>
              <option value="ADJUSTMENT">ADJUSTMENT (Audit Reconciliation)</option>
              <option value="RETURN">RETURN (Return to Inventory)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Quantity *</label>
            <input
              type="number"
              min={1}
              required
              value={adjQty}
              onChange={(e) => setAdjQty(Number(e.target.value))}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Audit Notes *</label>
            <input
              type="text"
              required
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdjustOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold">
              Post Inventory Transaction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
