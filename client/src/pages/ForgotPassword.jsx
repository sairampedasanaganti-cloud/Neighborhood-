import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      toast.error('Please enter your email or registered mobile.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(emailOrPhone.trim());
      setSent(true);
      toast.success('Password reset link sent! Check your inbox.');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('user-not-found')) {
        toast.error('No account found with this email or mobile number.');
      } else if (msg.includes('invalid-email')) {
        toast.error('Please enter a valid email address.');
      } else if (msg.includes('too-many-requests')) {
        toast.error('Too many attempts. Please try again in a few minutes.');
      } else {
        toast.error(msg.replace('Firebase: ', '') || 'Could not send reset email. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-header" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🔑</div>
          <h1>Reset Password</h1>
          <p>We'll send you a secure link to reset your NeighborLink password.</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              padding: '16px',
              color: '#166534',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              marginBottom: '20px',
            }}>
              ✓ A password reset link has been dispatched to <strong>{emailOrPhone}</strong>.
              Please check your inbox and follow the instructions.
            </div>

            <Link to="/login" className="btn btn-primary" style={{ width: '100%', display: 'inline-block' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="resetIdentifier">Email or Registered Mobile</label>
              <input
                id="resetIdentifier"
                type="text"
                required
                placeholder="name@example.com or 9876543210"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={submitting}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {submitting ? 'Sending Link…' : 'Send Reset Link'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
              Remember your password? <Link to="/login"><strong>Back to login</strong></Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
