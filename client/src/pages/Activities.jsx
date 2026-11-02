import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Activities() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('active'); // 'active' | 'completed' | 'cancelled'
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/requests/activities/mine');
        setActivities(data.data || { active: [], completed: [], cancelled: [] });
      } catch (err) {
        setActivities({ active: [], completed: [], cancelled: [] });
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  if (loading) return <LoadingSpinner />;

  const currentList = activities ? activities[tab] || [] : [];
  const currentUserId = String(profile?.id || profile?._id);

  return (
    <div className="page">
      <div style={{ marginBottom: '24px' }}>
        <h1>Activity History</h1>
        <p>Track your neighborhood interactions, both where you requested help and where you helped others.</p>
      </div>

      {/* Tabs */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${tab === 'active' ? 'active' : ''}`}
          onClick={() => setTab('active')}
        >
          🔄 Active Activities ({activities?.active?.length || 0})
        </button>
        <button
          className={`tab-btn ${tab === 'completed' ? 'active' : ''}`}
          onClick={() => setTab('completed')}
        >
          ✅ Completed Activities ({activities?.completed?.length || 0})
        </button>
        <button
          className={`tab-btn ${tab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setTab('cancelled')}
        >
          ❌ Cancelled ({activities?.cancelled?.length || 0})
        </button>
      </div>

      {/* Activity List */}
      {currentList.length === 0 ? (
        <EmptyState
          message={
            tab === 'active'
              ? 'You have no active activities right now.'
              : tab === 'completed'
              ? 'You have no completed activities yet. Helping a neighbor will show up here!'
              : 'No cancelled activities.'
          }
          icon={tab === 'completed' ? '🏆' : '📋'}
        />
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {currentList.map((item) => {
            const isRequester = String(item.requester?._id || item.requester) === currentUserId;
            const partner = isRequester ? item.acceptedMember : item.requester;

            return (
              <Link
                key={item._id}
                to={`/requests/${item._id}`}
                className="request-card"
                style={{ textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="community-badge" style={{ fontSize: '0.72rem' }}>
                        {isRequester ? 'You Requested' : 'You Helped'}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#0f766e', fontWeight: 600 }}>
                        {item.type === 'companionship' ? '🧑🤝🧑 Company · ' : '🤝 Help · '}
                        {item.category}
                      </span>
                    </div>
                    <h3 style={{ margin: '4px 0', fontSize: '1.15rem' }}>{item.title}</h3>
                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#64748b' }}>
                      {partner ? (
                        <>Connected with: <strong>{partner.fullName}</strong> ({partner.community || item.community})</>
                      ) : (
                        'Awaiting community member acceptance'
                      )}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <StatusBadge status={item.status} />
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>
                      {item.date ? `${item.date} ${item.time || ''}` : new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
