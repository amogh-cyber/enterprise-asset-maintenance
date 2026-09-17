import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssetsPage } from './pages/AssetsPage';
import { AssetDetailPage } from './pages/AssetDetailPage';
import { RequestsPage } from './pages/RequestsPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { WorkOrderDetailPage } from './pages/WorkOrderDetailPage';
import { TechniciansPage } from './pages/TechniciansPage';
import { InventoryPage } from './pages/InventoryPage';
import { PreventiveMaintenancePage } from './pages/PreventiveMaintenancePage';
import { ReportsPage } from './pages/ReportsPage';
import { IntegrationPage } from './pages/IntegrationPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SapAlignmentPage } from './pages/SapAlignmentPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/assets" element={<AssetsPage />} />
                <Route path="/assets/:id" element={<AssetDetailPage />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/work-orders" element={<WorkOrdersPage />} />
                <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
                <Route path="/technicians" element={<TechniciansPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/preventive-maintenance" element={<PreventiveMaintenancePage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/integrations" element={<IntegrationPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/sap-alignment" element={<SapAlignmentPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
