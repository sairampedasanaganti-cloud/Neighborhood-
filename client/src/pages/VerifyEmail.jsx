import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const { firebaseUser, checkEmailVerified, resendVerificationEmail, logout } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [notVerifiedNotice, setNotVerifiedNotice] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const email = firebaseUser?.email || 'your email';

  const handleCheckVerification = async () => {
    setChecking(true);
    setNotVerifiedNotice(false);
    try {
      const isVerified = await checkEmailVerified();
      if (isVerified) {
        toast.success('Email verified successfully! Let’s complete your profile.');
        navigate('/profile-setup');
      } else {
        setNotVerifiedNotice(true);
        toast.error('Email is not verified yet. Please check your inbox and click the link.');
      }
    } catch (err) {
      toast.error('Could not check verification status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);
    try {
      await resendVerificationEmail();
      setResendSuccess(true);
      toast.success('A new verification email has been sent! Please check your inbox.');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('too-many-requests')) {
        toast.error('Too many requests. Please wait a minute before requesting another verification email.');
      } else {
        toast.error(msg.replace('Firebase: ', '') || 'Could not resend email. Try again shortly.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = async () => {
    await logout();
    navigate('/register');
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center', maxWidth: '520px' }}>
        <div style={{ fontSize: '3.8rem', lineHeight: 1, marginBottom: '16px' }}>
          ✉️
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.03em', color: '#0f172a', marginBottom: '10px' }}>
          VERIFY YOUR EMAIL
        </h1>

        <p style={{ fontSize: '1rem', color: '#475569', margin: '0 0 6px' }}>
          We've sent a verification link to:
        </p>

        <div style={{
          background: '#f1f5f9',
          border: '1px solid #cbd5e1',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 700,
          color: '#0f766e',
          fontSize: '1.05rem',
          display: 'inline-block',
          marginBottom: '16px',
          wordBreak: 'break-all',
        }}>
          {email}
        </div>

        <p style={{ fontSize: '0.94rem', color: '#475569', lineHeight: 1.5, margin: '0 0 24px' }}>
          Please check your inbox and click the verification link to complete your NeighborLink account.
        </p>

        {notVerifiedNotice && (
          <div style={{
            background: '#fff7ed',
            border: '1px solid #fdba74',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#c2410c',
            fontSize: '0.9rem',
            textAlign: 'left',
            marginBottom: '20px',
            lineHeight: 1.45,
          }}>
            ⚠️ <strong>Verification pending:</strong> We haven’t detected your verification yet.
            If you just clicked the email link, wait a few seconds and click <em>"I've Verified My Email"</em> again.
            Also check your spam or junk folder.
          </div>
        )}

        {resendSuccess && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#166534',
            fontSize: '0.88rem',
            marginBottom: '18px',
          }}>
            ✓ A fresh verification link has been dispatched to <strong>{email}</strong>.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleCheckVerification}
            disabled={checking}
            style={{ width: '100%' }}
          >
            {checking ? 'Checking Status…' : "I've Verified My Email"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResend}
            disabled={resending}
            style={{ width: '100%' }}
          >
            {resending ? 'Sending Email…' : 'Resend Verification Email'}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleChangeEmail}
            style={{ width: '100%', color: '#64748b' }}
          >
            Change Email
          </button>
        </div>

        <p style={{ marginTop: '24px', fontSize: '0.82rem', color: '#94a3b8' }}>
          🔒 Didn’t receive an email? Check your Promotions or Spam tabs, or ensure the address above is spelled correctly.
        </p>
      </div>
    </div>
  );
}
