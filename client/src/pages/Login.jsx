import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, demoLogin, firebaseUser, profile, loading, isEmailVerified, isProfileComplete } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ emailOrPhone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAuthenticated = !!firebaseUser || !!profile || !!localStorage.getItem('nl_auth_token');

  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      if (!isEmailVerified) navigate('/verify-email');
      else if (!isProfileComplete) navigate('/profile-setup');
      else navigate(profile?.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [loading, isAuthenticated, isEmailVerified, isProfileComplete, profile?.role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.emailOrPhone.trim()) {
      toast.error('Please enter your email or mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(form.emailOrPhone.trim(), form.password);
      toast.success(`Welcome back, ${user.fullName || 'Community Member'}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your email or mobile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (roleOrEmail) => {
    setSubmitting(true);
    try {
      const user = await demoLogin(roleOrEmail);
      toast.success(`Logged in as ${user.fullName} (${user.role === 'admin' ? 'Admin' : user.ageGroup})`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Demo login failed. Make sure database is seeded.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Member Login</h1>
          <p>Access your community dashboard and mutual-aid requests.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="emailOrPhone">Email or Mobile Number</label>
            <input
              id="emailOrPhone"
              type="text"
              required
              placeholder="e.g. name@example.com or 9876543210"
              value={form.emailOrPhone}
              onChange={(e) => setForm({ ...form, emailOrPhone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.82rem' }}>
                Forgot password?
              </Link>
            </div>
            <div className="form-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password (optional)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            type="submit"
            style={{ width: '100%', marginTop: '6px' }}
            disabled={submitting}
          >
            {submitting ? 'Logging In…' : 'Login'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem' }}>
            New to NeighborLink? <Link to="/register"><strong>Create an account</strong></Link>
          </p>
        </form>

        {/* Quick Demo Access for Evaluators / Testing */}
        <div className="demo-login-box">
          <h4>🚀 Evaluator Quick Demo Login</h4>
          <p style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
            Instant role test without manual credential entry:
          </p>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => handleQuickDemo('admin')}
              disabled={submitting}
            >
              🛡️ Admin (Asha)
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => handleQuickDemo('senior')}
              disabled={submitting}
            >
              👴 Senior 68y (Srinivasan)
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => handleQuickDemo('karthik@neighborlink.demo')}
              disabled={submitting}
            >
              🤝 Helping Member (Karthik)
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => handleQuickDemo('arjun@neighborlink.demo')}
              disabled={submitting}
            >
              🎒 Teenager 16y (Arjun)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
