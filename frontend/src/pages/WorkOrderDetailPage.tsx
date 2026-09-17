import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { WorkOrder, WorkOrderDetail, User, Part } from '../types';
import { Badge, getStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  ArrowLeft,
  UserCheck,
  Play,
  CheckCircle,
  ShieldCheck,
  Package,
  Clock,
  AlertCircle,
  Plus,
  Lock,
  Pause,
  RotateCcw,
} from 'lucide-react';

const LIFECYCLE_STEPS = [
  'CREATED',
  'APPROVED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'VALIDATION_PENDING',
  'VALIDATED',
  'CLOSED',
];

export const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [wo, setWo] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<number>(0);
  const [overrideSkill, setOverrideSkill] = useState(false);

  const [isPartOpen, setIsPartOpen] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPartId, setSelectedPartId] = useState('P-20481');
  const [partQty, setPartQty] = useState(1);
  const [partNotes, setPartNotes] = useState('');

  const [isActOpen, setIsActOpen] = useState(false);
  const [actType, setActType] = useState('Component Replacement');
  const [actHours, setActHours] = useState(2.5);
  const [actDesc, setActDesc] = useState('Replaced damaged cooling fan, torqued mounting hardware, ran thermal test.');

  const { user } = useAuth();
  const { showToast } = useToast();

  const loadDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await apiService.getWorkOrderById(id);
      setWo(res as any);
    } catch (err) {
      showToast('Failed to load work order', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  // Handle State Transitions
  const handleTransition = async (newStatus: string, notes?: string) => {
    if (!wo) return;
    try {
      await apiService.updateWorkOrderStatus(wo.id, { new_status: newStatus, notes });
      showToast(`Work order transitioned to ${newStatus.replace(/_/g, ' ')}`, 'success');
      loadDetail();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'State transition rejected by business rule engine', 'error');
    }
  };

  // Open Assign Modal
  const handleOpenAssign = async () => {
    try {
      const techList = await apiService.getTechnicians();
      setTechnicians(techList);
      if (techList.length > 0) setSelectedTechId(techList[0].id);
      setIsAssignOpen(true);
    } catch (err) {
      showToast('Failed to load technicians', 'error');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wo) return;
    try {
      await apiService.assignTechnician(wo.id, {
        technician_id: Number(selectedTechId),
        override_skill_warning: overrideSkill,
      });
      showToast('Technician assigned successfully', 'success');
      setIsAssignOpen(false);
      loadDetail();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to assign technician', 'error');
    }
  };

  // Open Part Consumption Modal
  const handleOpenPart = async () => {
    try {
      const partList = await apiService.getParts({ page_size: 50 });
      setParts(partList.items);
      setIsPartOpen(true);
    } catch (err) {
      showToast('Failed to load inventory parts', 'error');
    }
  };

  const handlePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wo) return;
    try {
      await apiService.consumeWorkOrderPart(wo.id, {
        part_id: selectedPartId,
        quantity: Number(partQty),
        notes: partNotes || 'Replaced during maintenance execution',
      });
      showToast(`Consumed ${partQty}x spare part and updated inventory transaction`, 'success');
      setIsPartOpen(false);
      loadDetail();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to consume spare part', 'error');
    }
  };

  // Log Activity
  const handleActSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wo) return;
    try {
      await apiService.logWorkOrderActivity(wo.id, {
        activity_type: actType,
        hours_spent: Number(actHours),
        description: actDesc,
      });
      showToast(`Logged ${actHours} labor hours to work order`, 'success');
      setIsActOpen(false);
      loadDetail();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to log activity', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="text-center py-12 text-slate-500">
        Work Order not found.
      </div>
    );
  }

  const currentStepIndex = LIFECYCLE_STEPS.indexOf(wo.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/work-orders"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Work Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-base font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded border border-brand-200">
                {wo.id}
              </span>
              <h1 className="text-xl font-bold text-slate-900">{wo.title}</h1>
              {getStatusBadge(wo.status)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Target Equipment:{' '}
              <Link to={`/assets/${wo.asset_id}`} className="font-mono font-semibold text-brand-600 hover:underline">
                {wo.asset_id}
              </Link>{' '}
              ({wo.asset_name}) • Priority: <span className="font-semibold text-slate-700">{wo.priority}</span>
            </p>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center gap-2">
            {wo.status === 'CREATED' && (
              <button
                onClick={() => handleTransition('APPROVED', 'Approved by manager')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Approve Order
              </button>
            )}

            {(wo.status === 'CREATED' || wo.status === 'APPROVED') && (
              <button
                onClick={handleOpenAssign}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" /> Assign Technician
              </button>
            )}

            {wo.status === 'ASSIGNED' && (
              <button
                onClick={() => handleTransition('IN_PROGRESS', 'Technician initiated maintenance execution')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Play className="w-4 h-4" /> Start Work
              </button>
            )}

            {wo.status === 'IN_PROGRESS' && (
              <>
                <button
                  onClick={handleOpenPart}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Package className="w-4 h-4 text-brand-600" /> Consume Part
                </button>
                <button
                  onClick={() => setIsActOpen(true)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4 text-brand-600" /> Log Labor Hours
                </button>
                <button
                  onClick={() => handleTransition('WAITING_FOR_PARTS', 'Awaiting delivery of specialized component')}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Pause className="w-4 h-4" /> Hold for Parts
                </button>
                <button
                  onClick={() => handleTransition('COMPLETED', 'Work finished and tested under load')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Mark Completed
                </button>
              </>
            )}

            {wo.status === 'WAITING_FOR_PARTS' && (
              <button
                onClick={() => handleTransition('IN_PROGRESS', 'Parts arrived; resumed maintenance work')}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Resume Work
              </button>
            )}

            {wo.status === 'COMPLETED' && (
              <button
                onClick={() => handleTransition('VALIDATION_PENDING', 'Submitted for Manager QA review')}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" /> Submit for QA Validation
              </button>
            )}

            {wo.status === 'VALIDATION_PENDING' && (
              <button
                onClick={() => handleTransition('VALIDATED', 'Manager inspected and validated post-maintenance operational integrity')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Manager: Validate Work
              </button>
            )}

            {wo.status === 'VALIDATED' && (
              <button
                onClick={() => handleTransition('CLOSED', 'Technical and business closure complete; equipment back in service')}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4" /> Finalize & Close Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visual State Machine Stepper */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <p className="text-2xs font-semibold uppercase text-slate-400 tracking-wider mb-4">
          Strict Enterprise Lifecycle State Machine
        </p>
        <div className="flex items-center min-w-[700px] justify-between relative">
          {/* Connecting bar */}
          <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-slate-200 z-0"></div>
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isDone = currentStepIndex >= idx;
            const isCurrent = currentStepIndex === idx;
            return (
              <div key={step} className="flex flex-col items-center z-10">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    isCurrent
                      ? 'bg-brand-600 border-brand-600 text-white shadow-md ring-4 ring-brand-100'
                      : isDone
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-2xs font-semibold mt-1.5 uppercase tracking-wider ${
                    isCurrent ? 'text-brand-700 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {step.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details & Live Cost Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Order Information</h2>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Origin Request:</span>
              <span className="font-mono font-semibold text-slate-800">{wo.request_id || 'Direct / PM Generated'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Assigned Technician:</span>
              <span className="font-semibold text-slate-800">{wo.assigned_technician_name || 'Not assigned'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Created By:</span>
              <span className="font-semibold text-slate-800">{wo.created_by_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Execution Start:</span>
              <span className="font-mono text-slate-700">
                {wo.actual_start ? new Date(wo.actual_start).toLocaleString() : 'Pending start'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Execution End:</span>
              <span className="font-mono text-slate-700">
                {wo.actual_end ? new Date(wo.actual_end).toLocaleString() : 'In progress'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <p className="font-semibold text-slate-700 mb-1">Description / Scope of Work:</p>
            <p className="p-3 bg-slate-50 rounded-lg text-slate-600 leading-relaxed border border-slate-100">
              {wo.description}
            </p>
          </div>

          {wo.completion_notes && (
            <div className="pt-2">
              <p className="font-semibold text-emerald-800 mb-1">Technician Completion Notes:</p>
              <p className="p-3 bg-emerald-50/60 rounded-lg text-emerald-900 border border-emerald-100">
                {wo.completion_notes}
              </p>
            </div>
          )}

          {wo.validation_notes && (
            <div className="pt-2">
              <p className="font-semibold text-purple-800 mb-1">Manager QA Validation Notes:</p>
              <p className="p-3 bg-purple-50/60 rounded-lg text-purple-900 border border-purple-100">
                {wo.validation_notes}
              </p>
            </div>
          )}
        </div>

        {/* Consumed Spare Parts & Real-Time Costs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cost Summary Banner */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-2xs font-semibold uppercase text-slate-400 tracking-wider">Total Accumulated Cost</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                ${wo.actual_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-2xs text-slate-500 mt-0.5">Calculated atomically from consumed spare parts + labor hours</p>
            </div>
            {wo.status === 'IN_PROGRESS' && (
              <div className="flex gap-2">
                <button
                  onClick={handleOpenPart}
                  className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Consume Part
                </button>
                <button
                  onClick={() => setIsActOpen(true)}
                  className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Activity
                </button>
              </div>
            )}
          </div>

          {/* Consumed Spare Parts Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Consumed Spare Parts ({wo.parts_consumed?.length || 0})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold text-2xs">
                  <tr>
                    <th className="py-2.5 px-4">Part #</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Qty</th>
                    <th className="py-2.5 px-4">Unit Cost</th>
                    <th className="py-2.5 px-4">Total Cost</th>
                    <th className="py-2.5 px-4">Consumed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!wo.parts_consumed || wo.parts_consumed.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No spare parts consumed yet.
                      </td>
                    </tr>
                  ) : (
                    wo.parts_consumed.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-mono font-semibold text-brand-700">{p.part_number}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{p.part_name}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{p.quantity}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">${p.unit_cost.toLocaleString()}</td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">${p.total_cost.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono text-2xs">
                          {new Date(p.consumed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maintenance Activities Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Maintenance Activity Logs ({wo.activities?.length || 0})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold text-2xs">
                  <tr>
                    <th className="py-2.5 px-4">Technician</th>
                    <th className="py-2.5 px-4">Activity Type</th>
                    <th className="py-2.5 px-4">Hours</th>
                    <th className="py-2.5 px-4">Activity Notes</th>
                    <th className="py-2.5 px-4">Logged At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!wo.activities || wo.activities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No labor activities recorded yet.
                      </td>
                    </tr>
                  ) : (
                    wo.activities.map((act) => (
                      <tr key={act.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-medium text-slate-800">{act.technician_name}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {act.activity_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{act.hours_spent} hrs</td>
                        <td className="py-2.5 px-4 text-slate-600 max-w-sm truncate">{act.description}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono text-2xs">
                          {new Date(act.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Technician Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Technician to Work Order"
        subtitle={`Asset category: ${wo.asset_criticality || 'Equipment'} • Checks skills & availability`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Select Technician *</label>
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(Number(e.target.value))}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.employee_id}) - {t.department}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Skill-Based Assignment Engine</span>
            </div>
            <p className="text-2xs text-amber-800">
              The system verifies technician certifications against the equipment type. If the technician does not possess the matching skill, check the override checkbox below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="override"
              checked={overrideSkill}
              onChange={(e) => setOverrideSkill(e.target.checked)}
              className="rounded text-brand-600"
            />
            <label htmlFor="override" className="text-xs text-slate-700 font-medium cursor-pointer">
              Manager Override: Authorize assignment even if skill mismatch warning occurs
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold">
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Consume Spare Part Modal */}
      <Modal
        isOpen={isPartOpen}
        onClose={() => setIsPartOpen(false)}
        title="Consume Spare Part for Maintenance"
        subtitle="Deducts physical warehouse inventory atomically and creates a stock transaction"
      >
        <form onSubmit={handlePartSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Select Spare Part *</label>
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            >
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.part_number} - {p.name} (Stock: {p.stock_quantity}, ${p.unit_cost}/ea)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Quantity to Consume *</label>
            <input
              type="number"
              min={1}
              required
              value={partQty}
              onChange={(e) => setPartQty(Number(e.target.value))}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Notes / Reason *</label>
            <input
              type="text"
              placeholder="e.g. Replaced damaged inverter cooling fan assembly"
              value={partNotes}
              onChange={(e) => setPartNotes(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPartOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold">
              Consume Part & Deduct Inventory
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Activity Modal */}
      <Modal
        isOpen={isActOpen}
        onClose={() => setIsActOpen(false)}
        title="Log Maintenance Labor Activity"
        subtitle="Records technician activity, hours spent, and updates order actual labor cost"
      >
        <form onSubmit={handleActSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Activity Type *</label>
              <select
                value={actType}
                onChange={(e) => setActType(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Component Replacement">Component Replacement</option>
                <option value="Inspection & Diagnostics">Inspection & Diagnostics</option>
                <option value="Calibration & Testing">Calibration & Testing</option>
                <option value="Cleaning & Servicing">Cleaning & Servicing</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hours Spent *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={actHours}
                onChange={(e) => setActHours(Number(e.target.value))}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Activity Notes *</label>
            <textarea
              rows={3}
              required
              value={actDesc}
              onChange={(e) => setActDesc(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsActOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold">
              Save Activity
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
