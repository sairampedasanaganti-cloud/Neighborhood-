import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route protection enforcing the NeighborLink lifecycle:
 * - Unauthenticated -> /login
 * - Authenticated + email NOT verified -> /verify-email
 * - Authenticated + email verified + profile incomplete -> /profile-setup
 * - Authenticated + email verified + profile complete -> /dashboard
 * - requireAdmin: requires role === 'admin'
 */
export default function ProtectedRoute({
  children,
  requireAdmin = false,
  allowIncompleteProfile = false,
  allowUnverifiedEmail = false,
}) {
  const { firebaseUser, profile, loading, isAdmin, isEmailVerified, isProfileComplete } = useAuth();

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏡</div>
        <p>Loading your neighborhood community…</p>
      </div>
    );
  }

  const isAuthenticated = !!firebaseUser || !!profile || !!localStorage.getItem('nl_auth_token');
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // 1. Authenticated + email NOT verified -> Email Verification
  if (!isEmailVerified) {
    if (allowUnverifiedEmail) {
      return children;
    }
    return <Navigate to="/verify-email" replace />;
  }

  // 2. If already verified, do not allow staying on /verify-email
  if (allowUnverifiedEmail && isEmailVerified) {
    return <Navigate to={isProfileComplete ? '/dashboard' : '/profile-setup'} replace />;
  }

  // 3. Authenticated + email verified + profile incomplete -> Profile Setup
  if (!isProfileComplete) {
    if (allowIncompleteProfile) {
      return children;
    }
    return <Navigate to="/profile-setup" replace />;
  }

  // 4. If profile is already complete, do not force staying on /profile-setup
  if (allowIncompleteProfile && isProfileComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  // 5. Admin requirement
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}
