import React, { useState } from 'react';
import { BookOpen, Code2, Copy, Check, Layers, GitCompare, Cpu, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ABAP_CODE = `*&---------------------------------------------------------------------*
*& Report ZASSETFLOW_MAINT_REP
*& Title: AssetFlow Enterprise Maintenance & Work Order Execution Report
*& Target Role: Associate Systems Engineer / SAP S/4HANA ABAP Developer
*&---------------------------------------------------------------------*
REPORT zassetflow_maint_rep NO STANDARD PAGE HEADING
                           LINE-SIZE 132
                           LINE-COUNT 65.

*----------------------------------------------------------------------*
* 1. Data Dictionary Types & Internal Structures
*----------------------------------------------------------------------*
TYPES: BEGIN OF ty_work_order,
         aufnr TYPE c LENGTH 12,       " Work Order ID (AssetFlow WO-*)
         qmnum TYPE c LENGTH 12,       " Notification ID (AssetFlow MR-*)
         equnr TYPE c LENGTH 18,       " Equipment ID (AssetFlow AST-*)
         eqktx TYPE c LENGTH 40,       " Equipment Description
         ernam TYPE c LENGTH 12,       " Created By
         pernr TYPE n LENGTH 8,        " Assigned Technician Personnel #
         iphas TYPE c LENGTH 2,        " Phase (0=Created, 2=In Progress, 3=Completed)
         cost  TYPE p LENGTH 8 DECIMALS 2, " Actual Cost
         erdat TYPE d,                 " Created Date
       END OF ty_work_order.

DATA: gt_orders TYPE STANDARD TABLE OF ty_work_order,
      gs_order  TYPE ty_work_order.

*----------------------------------------------------------------------*
* 2. Selection Screen (Parameters & Select-Options)
*----------------------------------------------------------------------*
SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.
  SELECT-OPTIONS: s_equnr FOR gs_order-equnr,
                  s_pernr FOR gs_order-pernr,
                  s_erdat FOR gs_order-erdat.
  PARAMETERS:     p_phase TYPE c LENGTH 2 DEFAULT '2' OBLIGATORY.
SELECTION-SCREEN END OF BLOCK b1.

*----------------------------------------------------------------------*
* 3. Initialization & Authorization Check
*----------------------------------------------------------------------*
INITIALIZATION.
  s_erdat-sign   = 'I'.
  s_erdat-option = 'BT'.
  s_erdat-low    = sy-datum - 30.
  s_erdat-high   = sy-datum.
  APPEND s_erdat.

AT SELECTION-SCREEN.
  AUTHORITY-CHECK OBJECT 'I_TCODE'
    ID 'TCD' FIELD 'IW33'.
  IF sy-subrc <> 0.
    MESSAGE 'User unauthorized for Plant Maintenance display.' TYPE 'E'.
  ENDIF.

*----------------------------------------------------------------------*
* 4. Data Retrieval (Simulating S/4HANA CDS / Open SQL from AFIH/AFKO)
*----------------------------------------------------------------------*
START-OF-SELECTION.
  PERFORM fetch_maintenance_orders.
  PERFORM display_alv_report.

*&---------------------------------------------------------------------*
*& Form fetch_maintenance_orders
*&---------------------------------------------------------------------*
FORM fetch_maintenance_orders.
  " In a live SAP system, this queries AUFK / AFIH / ILOA / VIAUFKS
  " Example Open SQL:
  " SELECT a~aufnr, b~qmnum, b~equnr, c~eqktx, a~ernam, b~pernr
  "   FROM aufk AS a
  "   INNER JOIN afih AS b ON a~aufnr = b~aufnr
  "   LEFT JOIN v_equi AS c ON b~equnr = c~equnr
  "   INTO TABLE @gt_orders
  "   WHERE b~equnr IN @s_equnr
  "     AND a~erdat IN @s_erdat.
ENDFORM.

*&---------------------------------------------------------------------*
*& Form display_alv_report
*&---------------------------------------------------------------------*
FORM display_alv_report.
  WRITE: / 'AssetFlow Enterprise Maintenance Execution Report' COLOR COL_HEADING.
  ULINE.
ENDFORM.`;

export const SapAlignmentPage: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(ABAP_CODE);
    setCopied(true);
    showToast('ABAP source code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const mappings = [
    {
      concept: 'Equipment / Asset Master',
      assetflow: 'Asset (e.g. AST-10042, specs, serial, status, location)',
      sap: 'Equipment Master (T-Code IE01 / IE03, Table EQUI, EQUZ)',
      description: 'Central master data object representing physical machines and rotating gear.',
    },
    {
      concept: 'Maintenance Problem Notification',
      assetflow: 'MaintenanceRequest (e.g. MR-2026-00482, priority, category)',
      sap: 'Maintenance Notification (T-Code IW21 / IW23, Table QMEL)',
      description: 'Operator notification reporting equipment malfunction, thermal spike, or defect.',
    },
    {
      concept: 'Work Order Planning',
      assetflow: 'WorkOrder (e.g. WO-2026-00982, status, technician, estimated cost)',
      sap: 'Maintenance Order (T-Code IW31 / IW32, Table AUFK, AFIH)',
      description: 'Authorized transactional object detailing scope, assigned personnel, and planned dates.',
    },
    {
      concept: 'Spare Parts Consumption',
      assetflow: 'consumeWorkOrderPart (P-20481 deducted, InventoryTransaction)',
      sap: 'Goods Issue Movement 261 (T-Code MIGO, Table MSEG, RESB)',
      description: 'Atomic reduction of warehouse stock assigned against the maintenance order.',
    },
    {
      concept: 'Technician Labor Confirmation',
      assetflow: 'WorkOrderActivity (technician, hours spent, rate calculation)',
      sap: 'Time & Activity Confirmation (T-Code IW41 / IW42, Table AFRU)',
      description: 'Recording actual labor hours and activity notes against operations.',
    },
    {
      concept: 'Technical Completion & Close',
      assetflow: 'COMPLETED -> VALIDATION_PENDING -> VALIDATED -> CLOSED',
      sap: 'Technical Completion (TECO) -> Business Close (CLSD)',
      description: 'Managerial sign-off, restoring equipment to service, and freezing cost updates.',
    },
    {
      concept: 'Preventive Maintenance',
      assetflow: 'PreventiveMaintenanceSchedule & Auto-Generation Engine',
      sap: 'Maintenance Plan / Strategy (T-Code IP01 / IP10 / IP30)',
      description: 'Calendar/cycle-based scheduling triggering recurring preventive maintenance orders.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">SAP S/4HANA Enterprise Conceptual Alignment</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Explicit mapping of AssetFlow architecture to SAP Plant Maintenance (PM / EAM) standards and ABAP enterprise concepts.
        </p>
      </div>

      {/* Conceptual Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
            <GitCompare className="w-4 h-4 text-brand-600" />
            <span>Master & Transactional Data Mapping</span>
          </div>
          <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            SAP S/4HANA PM Alignment
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-2xs border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Enterprise Concept</th>
                <th className="py-3 px-4">AssetFlow Implementation</th>
                <th className="py-3 px-4">SAP ERP / S/4HANA Equivalent</th>
                <th className="py-3 px-4">Business Architecture Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mappings.map((m) => (
                <tr key={m.concept} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{m.concept}</td>
                  <td className="py-3 px-4 font-mono text-2xs font-semibold text-brand-700">{m.assetflow}</td>
                  <td className="py-3 px-4 font-mono text-2xs font-semibold text-slate-800">{m.sap}</td>
                  <td className="py-3 px-4 text-slate-600 leading-relaxed">{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ABAP Reference Code Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-brand-600" />
            <div>
              <h2 className="text-xs font-bold text-slate-900">ABAP Business Report: ZASSETFLOW_MAINT_REP</h2>
              <p className="text-2xs text-slate-500">
                Demonstrates Open SQL, internal tables, structures, selection screens, and authorization objects.
              </p>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
        <div className="p-4 bg-slate-900 overflow-x-auto text-xs font-mono text-slate-200 rounded-b-xl leading-relaxed">
          <pre>{ABAP_CODE}</pre>
        </div>
      </div>
    </div>
  );
};
