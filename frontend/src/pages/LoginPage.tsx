import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Factory,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Wrench,
  HardHat,
  Cpu,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('manager@assetflow.com');
  const [password, setPassword] = useState('AssetFlow@2026');
  const [loading, setLoading] = useState(false);
  const { login, switchDemoRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
      showToast('Logged in successfully', 'success');
      navigate('/');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    try {
      setLoading(true);
      await switchDemoRole(role);
      showToast(`Signed in as ${role.replace(/_/g, ' ')}`, 'success');
      navigate('/');
    } catch (err: any) {
      showToast('Demo login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-x-hidden">
      {/* Light background subtle accent grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(#cbd5e1 1px, transparent 1px), radial-gradient(#e2e8f0 1px, #f8fafc 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px',
        }}
      />

      <div className="relative max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Enterprise Presentation & System Highlights */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Production Node Operational</span>
            <span className="text-slate-300">•</span>
            <span className="text-brand-600 font-medium">Enterprise Edition</span>
          </div>

          {/* Main Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Enterprise Asset Maintenance &amp; Work Order System
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              An industrial-grade platform engineered for mission-critical equipment lifecycle tracking,
              skill-verified technician dispatch, atomic inventory control, and end-to-end operational compliance.
            </p>
          </div>

          {/* Key Capabilities Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-brand-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Asset 360° View</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                52+ industrial machines, runtime telemetry, and preventive schedule tracking.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-brand-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Governed Workflow</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                8-stage order lifecycle with skill verification and managerial QA sign-off.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-brand-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <PackageCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Atomic Stock Ledger</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Strict stock-out validation, zero negative-stock tolerance, and audit logs.
              </p>
            </div>
          </div>

          {/* Enterprise Operational Metrics */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-center">
            <div className="pt-2 sm:pt-0">
              <div className="text-xl font-bold text-slate-900">52</div>
              <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Active Assets
              </div>
            </div>
            <div className="pt-2 sm:pt-0 sm:pl-4">
              <div className="text-xl font-bold text-slate-900">99.8%</div>
              <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Target Uptime
              </div>
            </div>
            <div className="pt-2 sm:pt-0 sm:pl-4">
              <div className="text-xl font-bold text-slate-900">0 Var</div>
              <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Stock Variance
              </div>
            </div>
            <div className="pt-2 sm:pt-0 sm:pl-4">
              <div className="text-xl font-bold text-slate-900">100%</div>
              <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Audit Trail
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Portal Login Container */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-8">
            {/* Form Header */}
            <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100">
              <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Portal Authentication</h2>
                <p className="text-xs text-slate-500 mt-0.5">Sign in to access your operational dashboard</p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* 1-Click Demo Login Personas */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                  1-Click Demo Personas
                </span>
                <span className="text-2xs text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                  Instant Access
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('OPERATOR')}
                  className="p-2.5 text-left border border-slate-200 rounded-lg hover:border-brand-400 hover:bg-brand-50/50 transition-all text-xs font-medium text-slate-700 flex items-center gap-2.5 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                    <HardHat className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 leading-none">Operator</div>
                    <div className="text-2xs text-slate-500 mt-0.5">Report Problems</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('MAINTENANCE_MANAGER')}
                  className="p-2.5 text-left border border-slate-200 rounded-lg hover:border-brand-400 hover:bg-brand-50/50 transition-all text-xs font-medium text-slate-700 flex items-center gap-2.5 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 leading-none">Manager</div>
                    <div className="text-2xs text-slate-500 mt-0.5">Approve &amp; Assign</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('TECHNICIAN')}
                  className="p-2.5 text-left border border-slate-200 rounded-lg hover:border-brand-400 hover:bg-brand-50/50 transition-all text-xs font-medium text-slate-700 flex items-center gap-2.5 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 leading-none">Technician</div>
                    <div className="text-2xs text-slate-500 mt-0.5">EMP-1029 (Rajesh)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('ADMIN')}
                  className="p-2.5 text-left border border-slate-200 rounded-lg hover:border-brand-400 hover:bg-brand-50/50 transition-all text-xs font-medium text-slate-700 flex items-center gap-2.5 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 leading-none">Admin</div>
                    <div className="text-2xs text-slate-500 mt-0.5">Full System Control</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom note */}
            <div className="mt-5 text-center">
              <p className="text-2xs text-slate-400">
                Enterprise Role-Based Access Control • 256-bit Token Security
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
