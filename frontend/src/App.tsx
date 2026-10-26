import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './components/layouts/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { FileComplaintPage } from './pages/citizen/FileComplaintPage';
import { ComplaintTrackingPage } from './pages/citizen/ComplaintTrackingPage';

import { InvestigatorDashboard } from './pages/investigator/InvestigatorDashboard';
import { ComplaintDetailPage } from './pages/investigator/ComplaintDetailPage';
import { BlacklistPage } from './pages/investigator/BlacklistPage';
import { AnalyticsPage } from './pages/investigator/AnalyticsPage';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UsersManagementPage } from './pages/admin/UsersManagementPage';
import { CategoriesManagementPage } from './pages/admin/CategoriesManagementPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

import { ProfilePage } from './pages/ProfilePage';

// Route Guard Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="text-xs uppercase tracking-widest text-[#0C2038] font-bold">
          Verifying SAFECASE Authentication...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If investigator visits citizen dashboard, redirect to investigation
    if (user.role === 'INVESTIGATOR') return <Navigate to="/investigation" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Entry Points */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Application Shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Citizen Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/file"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                    <FileComplaintPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/complaints/:id"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                    <ComplaintTrackingPage />
                  </ProtectedRoute>
                }
              />

              {/* Investigator & Law Enforcement Routes */}
              <Route
                path="/investigation"
                element={
                  <ProtectedRoute allowedRoles={['INVESTIGATOR', 'ADMIN']}>
                    <InvestigatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investigation/complaints/:id"
                element={
                  <ProtectedRoute allowedRoles={['INVESTIGATOR', 'ADMIN']}>
                    <ComplaintDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investigation/blacklist"
                element={
                  <ProtectedRoute allowedRoles={['INVESTIGATOR', 'ADMIN']}>
                    <BlacklistPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investigation/analytics"
                element={
                  <ProtectedRoute allowedRoles={['INVESTIGATOR', 'ADMIN']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />

              {/* Super Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UsersManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <CategoriesManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Profile & Settings */}
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
