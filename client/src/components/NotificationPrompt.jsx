import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { isPushNotificationSupported, requestFcmPermissionAndToken } from '../services/fcm';

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      const supported = await isPushNotificationSupported();
      if (!supported) return;

      // Only show if user has not yet decided and hasn't dismissed in current session
      const dismissed = sessionStorage.getItem('nl_fcm_prompt_dismissed');
      if (!dismissed && Notification.permission === 'default') {
        setVisible(true);
      }
    }
    checkStatus();
  }, []);

  const handleEnable = async () => {
    setEnabling(true);
    try {
      const res = await requestFcmPermissionAndToken();
      if (res.success) {
        toast.success('Browser push notifications enabled! You will now receive neighborhood updates.', {
          icon: '🔔',
        });
        setVisible(false);
      } else if (res.reason === 'permission_denied') {
        toast('Push notifications were blocked in your browser settings.', { icon: 'ℹ️' });
        setVisible(false);
      } else {
        toast.error('Could not enable push notifications. You can try again later.');
      }
    } catch (err) {
      toast.error('Failed to enable notifications.');
    } finally {
      setEnabling(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('nl_fcm_prompt_dismissed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderLeft: '4px solid #0f766e',
        borderRadius: '8px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '1.6rem' }}>🔔</span>
        <div>
          <strong style={{ fontSize: '0.96rem', color: '#0f172a', display: 'block' }}>
            Enable Browser Push Notifications
          </strong>
          <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Receive real-time alerts when neighbors need emergency help or respond to your community requests.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          onClick={handleEnable}
          disabled={enabling}
        >
          {enabling ? 'Enabling…' : 'Enable Notifications'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          onClick={handleDismiss}
          disabled={enabling}
        >
          Later
        </button>
      </div>
    </div>
  );
}
