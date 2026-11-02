import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

const TABS = [
  'Overview',
  'Members',
  'Requests',
  'Emergency Monitor',
  'Reports & Moderation',
  'Feedback',
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load members list.');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/requests');
      setRequests(data.data || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
      toast.error('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencies = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/emergencies');
      setEmergencies(data.data || []);
    } catch (err) {
      console.error('Failed to load emergencies:', err);
      toast.error('Failed to load emergencies.');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports');
      setReports(data.data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
      toast.error('Failed to load safety reports.');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/reviews');
      setReviews(data.data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      toast.error('Failed to load feedback reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    if (tab === 'Members') loadUsers();
    if (tab === 'Requests') loadRequests();
    if (tab === 'Emergency Monitor') loadEmergencies();
    if (tab === 'Reports & Moderation') loadReports();
    if (tab === 'Feedback') loadReviews();
  }, [tab]);

  const handleVerification = async (id, status) => {
    try {
      await api.patch(`/admin/users/${id}/verification`, { status });
      toast.success(`User verification status set to ${status}.`);
      loadUsers();
      loadStats();
    } catch (err) {
      toast.error('Action failed.');
    }
  };

  const handleSuspend = async (id) => {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;
    try {
      await api.patch(`/admin/users/${id}/suspend`, { reason });
      toast.success('Member has been suspended.');
      loadUsers();
    } catch (err) {
      toast.error('Suspension failed.');
    }
  };

  const handleReactivate = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/reactivate`);
      toast.success('Member suspension has been lifted.');
      loadUsers();
    } catch (err) {
      toast.error('Reactivation failed.');
    }
  };

  const handleModerateReport = async (reportId, status, adminAction) => {
    const adminNotes = prompt(`Action: ${adminAction}. Enter resolution note:`) || '';
    try {
      await api.patch(`/reports/${reportId}`, { status, adminAction, adminNotes });
      toast.success('Report updated and moderation action executed.');
      loadReports();
      loadStats();
    } catch (err) {
      toast.error('Moderation action failed.');
    }
  };

  return (
    <div className="page">
      <div style={{ marginBottom: '24px' }}>
        <h1>🛡️ Administration & Moderation Portal</h1>
        <p>Community oversight, member safety, emergency monitoring, and quality control.</p>
      </div>

      <div className="tab-nav">
        {TABS.map((t) => {
          let badgeCount = null;
          let badgeColor = null;
          if (t === 'Emergency Monitor' && stats?.activeEmergencies > 0) {
            badgeCount = stats.activeEmergencies;
            badgeColor = '#dc2626';
          } else if (t === 'Reports & Moderation' && stats?.openReports > 0) {
            badgeCount = stats.openReports;
            badgeColor = '#f59e0b';
          }

          return (
            <button
              key={t}
              className={`tab-btn ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {t}
              {badgeCount !== null && (
                <span style={{
                  background: badgeColor,
                  color: '#fff',
                  borderRadius: '9999px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'Overview' && (
        stats ? (
          <div>
            <div className="admin-metrics-grid">
              <div className="admin-metric-card">
                <div className="admin-metric-num">{stats.totalUsers}</div>
                <div className="admin-metric-label">Total Members</div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-num" style={{ color: '#16a34a' }}>{stats.verifiedUsers}</div>
                <div className="admin-metric-label">Verified Members</div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-num" style={{ color: '#0284c7' }}>{stats.activeRequests}</div>
                <div className="admin-metric-label">Active Requests</div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-num" style={{ color: '#0f766e' }}>{stats.acceptedRequests}</div>
                <div className="admin-metric-label">In Progress</div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-num" style={{ color: '#dc2626' }}>{stats.activeEmergencies}</div>
                <div className="admin-metric-label">Emergencies</div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-num" style={{ color: '#ea580c' }}>{stats.openReports}</div>
                <div className="admin-metric-label">Open Reports</div>
              </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '12px' }}>Operational Protocol & Guidelines</h3>
              <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: 1.8 }}>
                <li>Review all identity verifications within 24 hours of submission.</li>
                <li>Emergency broadcasts must be actively supervised until resolution by neighbor or local services.</li>
                <li>Reported content and conduct complaints require prompt investigation to protect community safety.</li>
                <li>Strict mutual privacy protocol active: Contact details withheld until formal acceptance.</li>
              </ul>
            </div>
          </div>
        ) : <LoadingSpinner />
      )}

      {/* MEMBERS TAB */}
      {tab === 'Members' && (
        loading ? <LoadingSpinner /> : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Registered Community Members</h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Manage membership access, verify profiles, and enforce conduct guidelines.</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={loadUsers}>
                🔄 Refresh
              </button>
            </div>

            {(!users || users.length === 0) ? (
              <EmptyState message="No members found." icon="👥" />
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member Name</th>
                      <th>Age & Group</th>
                      <th>Community</th>
                      <th>Status</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <strong>{u.fullName}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{u.email}</div>
                        </td>
                        <td>{u.age} ({u.ageGroup})</td>
                        <td>{u.community || u.neighborhood || 'Neighborhood'}, {u.city}</td>
                        <td>
                          {u.isSuspended ? (
                            <span className="badge badge-urgent">Suspended</span>
                          ) : (
                            <span className={`badge ${u.verificationStatus === 'Verified' ? 'badge-completed' : 'badge-pending'}`}>
                              {u.verificationStatus}
                            </span>
                          )}
                        </td>
                        <td>⭐ {u.ratingAverage?.toFixed(1) || '5.0'}</td>
                        <td>
                          {u.isSuspended ? (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleReactivate(u._id)}>
                              Reactivate
                            </button>
                          ) : u.role !== 'admin' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn btn-danger btn-sm" onClick={() => handleSuspend(u._id)}>
                                Suspend
                              </button>
                              {u.verificationStatus !== 'Verified' && (
                                <button className="btn btn-primary btn-sm" onClick={() => handleVerification(u._id, 'Verified')}>
                                  Verify
                                </button>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Admin</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}

      {/* REQUESTS TAB */}
      {tab === 'Requests' && (
        loading ? <LoadingSpinner /> : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Community Help Requests</h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>All active, in-progress, and historical mutual aid requests.</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={loadRequests}>
                🔄 Refresh
              </button>
            </div>

            {(!requests || requests.length === 0) ? (
              <EmptyState message="No requests recorded." icon="📋" />
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title & Category</th>
                      <th>Type</th>
                      <th>Community</th>
                      <th>Requester</th>
                      <th>Accepted Member</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests?.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <strong>{r.title}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#0f766e' }}>{r.category}</div>
                        </td>
                        <td>
                          {r.isEmergency ? (
                            <span className="badge badge-urgent">Emergency</span>
                          ) : (
                            <span className="badge badge-normal">{r.type}</span>
                          )}
                        </td>
                        <td>{r.community || r.neighborhood || 'Neighborhood'}, {r.city}</td>
                        <td>{r.requester?.fullName || 'Requester'}</td>
                        <td>{r.acceptedMember?.fullName || '—'}</td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}

      {/* EMERGENCY MONITOR TAB */}
      {tab === 'Emergency Monitor' && (
        loading ? <LoadingSpinner /> : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0 }}>🚨 Active & Historical Emergency Broadcasts</h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Real-time oversight of SOS and high-urgency mutual aid requests.</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={loadEmergencies}>
                🔄 Refresh
              </button>
            </div>

            {(!emergencies || emergencies.length === 0) ? (
              <EmptyState message="No active or past emergency broadcasts." icon="✅" />
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Alert Title</th>
                      <th>Requester</th>
                      <th>Community</th>
                      <th>Emergency Status</th>
                      <th>Accepted By</th>
                      <th>Posted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergencies.map((em) => (
                      <tr key={em._id}>
                        <td>
                          <strong style={{ color: '#dc2626' }}>🚨 {em.title}</strong>
                          {em.description && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              {em.description.slice(0, 100)}{em.description.length > 100 ? '…' : ''}
                            </div>
                          )}
                        </td>
                        <td>
                          <div><strong>{em.requester?.fullName || 'Requester'}</strong></div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>📞 {em.requester?.mobile || 'Private'}</div>
                        </td>
                        <td>{em.community || em.city || 'Neighborhood'}</td>
                        <td>
                          <span className={`badge ${em.emergencyStatus === 'ACTIVE' ? 'badge-urgent' : em.emergencyStatus === 'ACCEPTED' ? 'badge-accepted' : 'badge-completed'}`}>
                            {em.emergencyStatus || 'ACTIVE'}
                          </span>
                        </td>
                        <td>{em.acceptedMember?.fullName || 'Awaiting acceptance'}</td>
                        <td>{em.createdAt ? new Date(em.createdAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}

      {/* REPORTS & MODERATION TAB */}
      {tab === 'Reports & Moderation' && (
        loading ? <LoadingSpinner /> : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0 }}>🛡️ Member Complaints & Safety Reports</h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Review community reports, issue warnings, or suspend non-compliant accounts.</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={loadReports}>
                🔄 Refresh
              </button>
            </div>

            {(!reports || reports.length === 0) ? (
              <EmptyState message="No complaints filed. The community is healthy." icon="🛡️" />
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Reason</th>
                      <th>Details</th>
                      <th>Reporter</th>
                      <th>Reported Member</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((rep) => (
                      <tr key={rep._id}>
                        <td>
                          <strong>{rep.reason}</strong>
                          {rep.adminAction && rep.adminAction !== 'None' && (
                            <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '2px' }}>
                              Action: {rep.adminAction}
                            </div>
                          )}
                        </td>
                        <td style={{ maxWidth: '260px' }}>{rep.description}</td>
                        <td>
                          <div>{rep.reporter?.fullName || 'Anonymous'}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{rep.reporter?.email || ''}</div>
                        </td>
                        <td>
                          <div>{rep.reportedUser?.fullName || 'N/A'}</div>
                          {rep.reportedUser?.isSuspended && (
                            <span className="badge badge-urgent" style={{ fontSize: '0.7rem' }}>Suspended</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${rep.status === 'Open' ? 'badge-urgent' : rep.status === 'Resolved' ? 'badge-completed' : 'badge-normal'}`}>
                            {rep.status}
                          </span>
                        </td>
                        <td>
                          {rep.status === 'Open' || rep.status === 'Under Review' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleModerateReport(rep._id, 'Resolved', 'Warning')}
                              >
                                Warning
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleModerateReport(rep._id, 'Resolved', 'Suspend Member')}
                              >
                                Suspend
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleModerateReport(rep._id, 'Resolved', 'Close Report')}
                              >
                                Close
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}

      {/* FEEDBACK TAB */}
      {tab === 'Feedback' && (
        loading ? <LoadingSpinner /> : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0 }}>⭐ Member Feedback & Reviews</h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Ratings and mutual feedback submitted across completed neighborhood activities.</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={loadReviews}>
                🔄 Refresh
              </button>
            </div>

            {(!reviews || reviews.length === 0) ? (
              <EmptyState message="No reviews posted yet." icon="⭐" />
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Reviewer</th>
                      <th>Reviewee</th>
                      <th>Activity</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((rev) => {
                      const ratingVal = Math.max(0, Math.min(5, Math.round(Number(rev.rating) || 5)));
                      return (
                        <tr key={rev._id}>
                          <td style={{ color: '#f59e0b', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                            {'★'.repeat(ratingVal)}{'☆'.repeat(5 - ratingVal)}
                            <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '6px' }}>
                              ({ratingVal}/5)
                            </span>
                          </td>
                          <td style={{ maxWidth: '280px' }}>
                            "{rev.comment ? rev.comment : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No comment entered</span>}"
                          </td>
                          <td>
                            <div><strong>{rev.reviewer?.fullName || 'Neighbor'}</strong></div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{rev.reviewer?.email || ''}</div>
                          </td>
                          <td>
                            <div><strong>{rev.reviewee?.fullName || 'Neighbor'}</strong></div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{rev.reviewee?.email || ''}</div>
                          </td>
                          <td>{rev.request?.title || rev.request?.category || 'Community Activity'}</td>
                          <td>{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
