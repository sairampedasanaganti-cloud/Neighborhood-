import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import CreateRequestFlow from './pages/CreateRequestFlow';
import OfferHelp from './pages/OfferHelp';
import RequestDetails from './pages/RequestDetails';
import Activities from './pages/Activities';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import EmergencyBanner from './components/EmergencyBanner';
import { useAuth } from './context/AuthContext';
import { setupForegroundListener } from './services/fcm';

export default function App() {
  const navigate = useNavigate();
  const { firebaseUser, profile } = useAuth();

  useEffect(() => {
    // Only listen for push notifications if authenticated
    if (!firebaseUser && !profile && !localStorage.getItem('nl_auth_token')) return;

    const unsubPromise = setupForegroundListener((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'NeighborLink Alert';
      const body = payload.notification?.body || payload.data?.body || '';
      const targetUrl = payload.data?.url || (payload.data?.requestId ? `/requests/${payload.data.requestId}` : '/dashboard');
      const isEmergency = payload.data?.isEmergency === 'true' || payload.data?.type === 'EMERGENCY_ALERT';

      toast(
        (t) => (
          <div
            style={{ cursor: 'pointer', maxWidth: '340px' }}
            onClick={() => {
              toast.dismiss(t.id);
              navigate(targetUrl);
            }}
          >
            <strong style={{ display: 'block', fontSize: '0.96rem', color: isEmergency ? '#b91c1c' : '#0f172a' }}>
              {isEmergency ? '🚨 ' : '🔔 '}{title}
            </strong>
            <span style={{ fontSize: '0.85rem', color: '#334155', display: 'block', marginTop: '2px' }}>
              {body}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#0f766e', fontWeight: 600, display: 'block', marginTop: '4px' }}>
              Click to view request →
            </span>
          </div>
        ),
        {
          duration: isEmergency ? 12000 : 7000,
          style: isEmergency ? { border: '2px solid #ef4444', background: '#fef2f2' } : {},
        }
      );
    });

    return () => {
      unsubPromise.then((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [firebaseUser, profile, navigate]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Navbar />
      <EmergencyBanner />
      <main className="page-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Email Verification */}
          <Route
            path="/verify-email"
            element={
              <ProtectedRoute allowUnverifiedEmail>
                <VerifyEmail />
              </ProtectedRoute>
            }
          />

          {/* Onboarding Profile Setup */}
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute allowIncompleteProfile>
                <ProfileSetup />
              </ProtectedRoute>
            }
          />
          <Route path="/complete-profile" element={<Navigate to="/profile-setup" replace />} />

          {/* Authenticated Member Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <OfferHelp />
              </ProtectedRoute>
            }
          />
          <Route path="/volunteer" element={<Navigate to="/requests" replace />} />
          <Route
            path="/requests/create"
            element={
              <ProtectedRoute>
                <CreateRequestFlow />
              </ProtectedRoute>
            }
          />
          <Route path="/requests/new" element={<Navigate to="/requests/create" replace />} />
          <Route
            path="/requests/:id"
            element={
              <ProtectedRoute>
                <RequestDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute>
                <Activities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
