import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider }     from './context/AuthContext';
import ProtectedRoute       from './components/Auth/ProtectedRoute';
import AppLayout            from './layouts/AppLayout';
import LoginPage            from './pages/LoginPage';
import RegisterPage         from './pages/RegisterPage';
import DashboardPage        from './pages/DashboardPage';
import SendPage             from './pages/SendPage';
import SplitPage            from './pages/SplitPage';
import QRPage               from './pages/QRPage';
import HistoryPage          from './pages/HistoryPage';
import ProfilePage          from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected — layout wraps all inner pages via Outlet */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index          element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="send"      element={<SendPage />} />
            <Route path="split"     element={<SplitPage />} />
            <Route path="qr"        element={<QRPage />} />
            <Route path="history"   element={<HistoryPage />} />
            <Route path="profile"   element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
      />
    </AuthProvider>
  );
}
