import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  LayoutDashboard,
  Cpu,
  FileSpreadsheet,
  ClipboardList,
  Users,
  Package,
  CalendarClock,
  BarChart3,
  RefreshCw,
  ShieldCheck,
  BookOpen,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Factory,
} from 'lucide-react';
import { UserRole } from '../../types';

export const AppLayout: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleRoleSwitch = async (role: UserRole) => {
    try {
      setSwitching(true);
      await switchDemoRole(role);
      showToast(`Switched active session to ${role.replace(/_/g, ' ')}`, 'info');
    } catch (err) {
      showToast('Failed to switch role', 'error');
    } finally {
      setSwitching(false);
    }
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/assets', label: 'Assets Master', icon: Cpu },
    { to: '/requests', label: 'Maintenance Requests', icon: FileSpreadsheet },
    { to: '/work-orders', label: 'Work Orders', icon: ClipboardList },
    { to: '/technicians', label: 'Technicians', icon: Users },
    { to: '/inventory', label: 'Parts & Inventory', icon: Package },
    { to: '/preventive-maintenance', label: 'Preventive Maint.', icon: CalendarClock },
    { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/integrations', label: 'Legacy ERP Sync', icon: RefreshCw },
    { to: '/audit-logs', label: 'Audit Trail', icon: ShieldCheck },
    { to: '/sap-alignment', label: 'SAP PM & ABAP Guide', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">Enterprise Asset Maintenance</span>
                <span className="hidden sm:inline-block ml-2 text-2xs px-2 py-0.5 rounded-sm bg-brand-50 text-brand-700 font-semibold border border-brand-200">
                  Work Order System
                </span>
              </div>
            </div>
          </div>

          {/* Quick Demo Role Switcher Bar */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 text-xs">
            <span className="text-slate-500 px-2 font-medium">Demo Persona:</span>
            <button
              disabled={switching}
              onClick={() => handleRoleSwitch('OPERATOR')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                user?.role === 'OPERATOR'
                  ? 'bg-white text-brand-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Operator
            </button>
            <button
              disabled={switching}
              onClick={() => handleRoleSwitch('MAINTENANCE_MANAGER')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                user?.role === 'MAINTENANCE_MANAGER'
                  ? 'bg-white text-brand-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manager
            </button>
            <button
              disabled={switching}
              onClick={() => handleRoleSwitch('TECHNICIAN')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                user?.role === 'TECHNICIAN'
                  ? 'bg-white text-brand-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Technician (EMP-1029)
            </button>
            <button
              disabled={switching}
              onClick={() => handleRoleSwitch('ADMIN')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                user?.role === 'ADMIN'
                  ? 'bg-white text-brand-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
          </div>

          {/* User Profile info & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name}</p>
              <p className="text-2xs font-medium text-slate-500 mt-0.5">
                {user?.employee_id} • {user?.role.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Body layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed md:sticky top-16 z-20 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Enterprise Asset Maintenance</p>
            <p className="text-2xs mt-0.5">Work Order System • Release 2026.1</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
