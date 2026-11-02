import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import NotificationPrompt from '../components/NotificationPrompt';

const ICONS = {
  EMERGENCY_ALERT: '🚨',
  GOOD_MATCH: '🎯',
  NEW_MATCHING_REQUEST: '🤝',
  REQUEST_ACCEPTED: '🤝',
  STATUS_UPDATED: '🔄',
  REQUEST_COMPLETED: '✅',
  REQUEST_CANCELLED: '❌',
  FEEDBACK_REQUEST: '⭐',
  ADMIN_NOTICE: '⚠️',
  VERIFICATION_APPROVED: '✔️',
  VERIFICATION_REJECTED: '⚠️',
  NEW_REVIEW: '🌟',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (loading) return <LoadingSpinner />;

  const unreadCount = notifications ? notifications.filter((n) => !n.isRead).length : 0;
  const filteredList = notifications
    ? filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications
    : [];

  return (
    <div className="page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1>Notification Center</h1>
          <p>Updates on mutual-aid requests, neighborhood matches, and community alerts.</p>
        </div>

        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      <NotificationPrompt />

      <div className="tab-nav">
        <button
          className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Notifications ({notifications?.length || 0})
        </button>
        <button
          className={`tab-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {filteredList.length === 0 ? (
        <EmptyState
          message={filter === 'unread' ? 'No unread notifications.' : 'You have no notifications yet.'}
          icon="🔔"
        />
      ) : (
        <div>
          {filteredList.map((n) => {
            const isEmergency = n.type === 'EMERGENCY_ALERT' || n.priority === 'URGENT';
            return (
              <div
                key={n._id}
                className={`notification-card ${!n.isRead ? 'unread' : ''} ${isEmergency ? 'is-emergency' : ''}`}
              >
                <span className="notification-icon">{ICONS[n.type] || '🔔'}</span>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <strong style={{ fontSize: '0.98rem', color: isEmergency ? '#dc2626' : undefined }}>
                      {n.title || (isEmergency ? 'Urgent Alert' : 'Community Notification')}
                    </strong>
                    {!n.isRead && (
                      <span className="badge badge-normal" style={{ fontSize: '0.65rem' }}>NEW</span>
                    )}
                  </div>

                  <p style={{ margin: '4px 0 6px', fontSize: '0.92rem', color: '#334155' }}>
                    {n.message}
                  </p>

                  {n.matchReasons?.length > 0 && (
                    <div style={{ background: '#f0fdfa', padding: '6px 10px', borderRadius: '6px', fontSize: '0.82rem', color: '#0f766e', margin: '6px 0' }}>
                      {n.matchReasons.map((r, idx) => (
                        <div key={idx}>{r}</div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>

                    {n.relatedRequest && (
                      <Link
                        to={`/requests/${n.relatedRequest}`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                      >
                        {isEmergency ? 'View Emergency' : 'View Request'}
                      </Link>
                    )}
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    onClick={() => markRead(n._id)}
                  >
                    Dismiss
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
