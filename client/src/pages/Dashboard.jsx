import React, { useEffect, useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RequestCard from '../components/RequestCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import NotificationPrompt from '../components/NotificationPrompt';

export default function Dashboard() {
  const { profile, isSenior } = useAuth();
  const navigate = useNavigate();

  const [communityRequests, setCommunityRequests] = useState([]);
  const [activities, setActivities] = useState({ active: [], completed: [] });
  const [communityFeed, setCommunityFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [reqRes, actRes, feedRes] = await Promise.all([
        api.get('/requests?sort=urgency'),
        api.get('/requests/activities/mine'),
        api.get('/requests?status=Completed'),
      ]);
      setCommunityRequests(reqRes.data.data || []);
      setActivities({
        active: actRes.data.data.active || [],
        completed: actRes.data.data.completed || [],
      });
      setCommunityFeed(feedRes.data.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const firstName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Neighbor';
  const communityName = profile?.community || profile?.neighborhood || 'Your Community';

  // --------------------------------------------------------------------------
  // SENIOR CITIZEN SIMPLIFIED INTERFACE (60+)
  // Exact layout from Specification Section 6:
  // NeighborLink
  // Hello, [Name]
  // [🤝 NEED HELP]
  // [🧑🤝🧑 COMPANY]
  // [🌱 HELP OTHERS]
  // [🔔 UPDATES]
  // [👤 PROFILE]
  // [🚨 EMERGENCY HELP]
  // --------------------------------------------------------------------------
  if (isSenior) {
    return (
      <div className="page senior-theme" style={{ maxWidth: '840px', margin: '0 auto' }}>
        <div style={{ padding: '16px 0 24px', borderBottom: '2px solid #cbd5e1' }}>
          <h1 style={{ fontSize: '2.4rem', color: '#020617', margin: 0 }}>
            Hello, {firstName} 👋
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#334155', marginTop: '6px' }}>
            📍 Community: <strong>{communityName}</strong>
          </p>
        </div>

        <NotificationPrompt />

        <div className="senior-actions-grid">
          <button
            type="button"
            className="senior-action-card"
            onClick={() => navigate('/requests/create?flow=help')}
          >
            <div className="senior-card-icon">🤝</div>
            <h2 className="senior-card-title">NEED HELP</h2>
            <p className="senior-card-desc">Ask a neighbor for medicine, doctor visit, or home assistance</p>
          </button>

          <button
            type="button"
            className="senior-action-card"
            onClick={() => navigate('/requests/create?flow=company')}
          >
            <div className="senior-card-icon">🧑‍🤝‍🧑</div>
            <h2 className="senior-card-title">COMPANY</h2>
            <p className="senior-card-desc">Find someone friendly to walk, talk, or share time with</p>
          </button>

          <button
            type="button"
            className="senior-action-card"
            onClick={() => navigate('/requests')}
          >
            <div className="senior-card-icon">🌱</div>
            <h2 className="senior-card-title">HELP OTHERS</h2>
            <p className="senior-card-desc">See what your neighbors in {communityName} need</p>
          </button>

          <button
            type="button"
            className="senior-action-card"
            onClick={() => navigate('/notifications')}
          >
            <div className="senior-card-icon">🔔</div>
            <h2 className="senior-card-title">UPDATES</h2>
            <p className="senior-card-desc">Check notifications, responses, and alerts</p>
          </button>

          <button
            type="button"
            className="senior-action-card"
            onClick={() => navigate('/profile')}
          >
            <div className="senior-card-icon">👤</div>
            <h2 className="senior-card-title">PROFILE</h2>
            <p className="senior-card-desc">Your details, skills, and community settings</p>
          </button>

          <button
            type="button"
            className="senior-action-card emergency"
            onClick={() => navigate('/requests/create?flow=emergency')}
          >
            <div className="senior-card-icon">🚨</div>
            <h2 className="senior-card-title emergency-title">EMERGENCY HELP</h2>
            <p className="senior-card-desc emergency-desc">Urgent help immediately broadcast to all neighbors</p>
          </button>
        </div>

        {activities.active.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h2 style={{ fontSize: '1.6rem' }}>Your Active Requests</h2>
            <div className="requests-grid">
              {activities.active.map((req) => (
                <RequestCard key={req._id} request={req} />
              ))}
            </div>
          </div>
        )}

        {/* Bottom Navigation for Seniors */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 0', borderTop: '2px solid #cbd5e1', marginTop: '40px', background: '#f8fafc', borderRadius: '12px' }}>
          <Link to="/dashboard" style={{ fontSize: '1.1rem', fontWeight: 700 }}>🏠 Home</Link>
          <Link to="/activities" style={{ fontSize: '1.1rem', fontWeight: 700 }}>📋 Activities</Link>
          <Link to="/notifications" style={{ fontSize: '1.1rem', fontWeight: 700 }}>🔔 Updates</Link>
          <Link to="/profile" style={{ fontSize: '1.1rem', fontWeight: 700 }}>👤 Profile</Link>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STANDARD INTERFACE (Ages 10–59)
  // Exact layout from Specification Section 5:
  // NeighborLink
  // Good Morning, [Name]
  // 📍 [Community]
  // What can we do for you?
  // [🤝 NEED HELP]
  // [🧑🤝🧑 COMPANY]
  // [🌱 OFFER HELP]
  // Around Your Community
  // Your Activities
  // Community Activity
  // 🚨 EMERGENCY HELP
  // Bottom navigation: Home, Activities, Notifications, Profile
  // --------------------------------------------------------------------------
  return (
    <div className="page">
      {/* Header Greeting */}
      <div className="dashboard-greeting-bar">
        <div>
          <h1>{getGreeting()}, {firstName} 👋</h1>
          <p style={{ margin: 0, fontSize: '1.02rem' }}>
            📍 <strong>{communityName}</strong> ({profile?.city || 'Local Area'})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/requests/create?flow=emergency" className="btn btn-emergency">
            🚨 EMERGENCY HELP
          </Link>
          <Link to="/requests/create?flow=help" className="btn btn-primary">
            + New Request
          </Link>
        </div>
      </div>

      <NotificationPrompt />

      {/* "What can we do for you?" Main Action Section */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#475569', marginBottom: '14px' }}>
          What can we do for you?
        </h2>

        <div className="dashboard-actions-grid">
          <Link to="/requests/create?flow=help" className="action-tile">
            <span className="action-tile-icon">🤝</span>
            <span className="action-tile-title">NEED HELP</span>
            <p className="action-tile-desc">
              Request everyday assistance, tutoring, healthcare visits, or household tasks.
            </p>
          </Link>

          <Link to="/requests/create?flow=company" className="action-tile">
            <span className="action-tile-icon">🧑🤝🧑</span>
            <span className="action-tile-title">COMPANY</span>
            <p className="action-tile-desc">
              Connect with friendly neighbors for walks, sports, study, or shared hobbies.
            </p>
          </Link>

          <Link to="/requests" className="action-tile">
            <span className="action-tile-icon">🌱</span>
            <span className="action-tile-title">OFFER HELP</span>
            <p className="action-tile-desc">
              Browse open requests in {communityName} and lend a helping hand.
            </p>
          </Link>

          <Link to="/requests/create?flow=emergency" className="action-tile tile-emergency">
            <span className="action-tile-icon">🚨</span>
            <span className="action-tile-title">EMERGENCY HELP</span>
            <p className="action-tile-desc">
              Urgent neighborhood alert for critical assistance (calls 112 for medical emergencies).
            </p>
          </Link>
        </div>
      </div>

      {/* Your Activities Section */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2>Your Activities</h2>
          <Link to="/activities" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
            View All ({activities.active.length + activities.completed.length}) →
          </Link>
        </div>

        {activities.active.length === 0 ? (
          <EmptyState
            message="No active requests right now. You can request help or find company above!"
            icon="🌱"
          />
        ) : (
          <div className="requests-grid">
            {activities.active.map((req) => (
              <RequestCard key={req._id} request={req} />
            ))}
          </div>
        )}
      </div>

      {/* Around Your Community Section */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2>Around Your Community</h2>
            <p style={{ margin: 0 }}>Open requests and mutual-aid opportunities from fellow members in {communityName}.</p>
          </div>
          <Link to="/requests" className="btn btn-secondary btn-sm">
            Browse All ({communityRequests.length})
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : communityRequests.length === 0 ? (
          <EmptyState
            message={`No open requests in ${communityName} right now. Everything is peaceful!`}
            icon="🏡"
          />
        ) : (
          <div className="requests-grid">
            {communityRequests.slice(0, 6).map((req) => (
              <RequestCard key={req._id} request={req} />
            ))}
          </div>
        )}
      </div>

      {/* Community Activity (Recent Completed Activities in Area) */}
      <div style={{ marginBottom: '40px' }}>
        <h2>Community Activity</h2>
        <p style={{ margin: '0 0 14px' }}>Recent neighborhood connections and completed mutual-aid in {communityName}.</p>

        {communityFeed.length === 0 ? (
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.92rem' }}>
            🤝 NeighborLink mutual aid is active in {communityName}. Connections made will appear here.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {communityFeed.slice(0, 4).map((feedItem) => (
              <div
                key={feedItem._id}
                style={{
                  background: '#ffffff',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: 600 }}>
                    {feedItem.type === 'companionship' ? '🧑🤝🧑 Company · ' : '🤝 Completed Help · '}
                    {feedItem.category}
                  </span>
                  <div style={{ fontWeight: 600, fontSize: '0.98rem', marginTop: '2px' }}>
                    {feedItem.title}
                  </div>
                </div>
                <span className="badge badge-completed">Completed</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-around', padding: '14px 20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '40px' }}>
        <NavLink to="/dashboard" style={({ isActive }) => ({ fontWeight: isActive ? 700 : 500, color: isActive ? '#0f766e' : '#64748b' })}>
          🏠 Home
        </NavLink>
        <NavLink to="/activities" style={({ isActive }) => ({ fontWeight: isActive ? 700 : 500, color: isActive ? '#0f766e' : '#64748b' })}>
          📋 Activities
        </NavLink>
        <NavLink to="/notifications" style={({ isActive }) => ({ fontWeight: isActive ? 700 : 500, color: isActive ? '#0f766e' : '#64748b' })}>
          🔔 Notifications
        </NavLink>
        <NavLink to="/profile" style={({ isActive }) => ({ fontWeight: isActive ? 700 : 500, color: isActive ? '#0f766e' : '#64748b' })}>
          👤 Profile
        </NavLink>
      </nav>
    </div>
  );
}
