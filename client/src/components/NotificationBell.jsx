import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/** Bell icon in navbar with unread-count badge, polls every 30s. */
export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;
    let mounted = true;
    const fetchCount = async () => {
      try {
        const { data } = await api.get('/notifications');
        if (mounted) setUnreadCount(data.unreadCount || 0);
      } catch (e) { /* silently ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [profile]);

  return (
    <Link to="/notifications" className="notification-bell">
      🔔
      {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
    </Link>
  );
}
