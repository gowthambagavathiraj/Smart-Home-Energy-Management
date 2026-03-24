import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserDashboard from './pages/AdminUserDashboard';
import AdminTechnicianDashboard from './pages/AdminTechnicianDashboard';
import TechnicianDashboard from './pages/TechnicianDashboardNew';
import TechnicianUserDashboard from './pages/TechnicianUserDashboard';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DevicesPage from './pages/DevicesPage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/select-role" element={
            <ProtectedRoute>
              <RoleSelectionPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:userId/dashboard" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminUserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/technicians/:userId/dashboard" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminTechnicianDashboard />
            </ProtectedRoute>
          } />
          <Route path="/technician/dashboard" element={
            <ProtectedRoute requiredRole="TECHNICIAN">
              <TechnicianDashboard />
            </ProtectedRoute>
          } />
          <Route path="/technician/users/:userId/dashboard" element={
            <ProtectedRoute requiredRole="TECHNICIAN">
              <TechnicianUserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/devices" element={
            <ProtectedRoute>
              <DevicesPage />
            </ProtectedRoute>
          } />
          <Route path="/about" element={
            <ProtectedRoute>
              <AboutPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
