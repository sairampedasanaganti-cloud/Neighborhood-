import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ReviewForm from '../components/ReviewForm';
import ReportModal from '../components/ReportModal';

import AcceptedLocationMap from '../components/AcceptedLocationMap';

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [locationData, setLocationData] = useState(null);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/requests/${id}`);
      setRequest(data.data);
    } catch (err) {
      setRequest(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  const currentUserId = profile ? String(profile.id || profile._id) : '';
  const requesterId = request?.requester ? String(request.requester._id || request.requester) : '';
  const acceptedMemberId = request?.acceptedMember ? String(request.acceptedMember._id || request.acceptedMember) : null;

  const isRequester = !!(currentUserId && requesterId && requesterId === currentUserId);
  const isAcceptedMember = !!(currentUserId && acceptedMemberId && acceptedMemberId === currentUserId);
  const isPending = request?.status === 'Pending';
  const isAcceptedOrBeyond = ['Accepted', 'In Progress', 'Completed'].includes(request?.status);
  const canAccept = isPending && !isRequester;

  useEffect(() => {
    if (request && ['Accepted', 'In Progress'].includes(request.status) && (isRequester || isAcceptedMember)) {
      api.get(`/requests/${id}/location`)
        .then((res) => {
          if (res.data?.data) {
            setLocationData(res.data.data);
          }
        })
        .catch(() => {
          // Backend enforced: 403 for unauthorized users
        });
    } else {
      setLocationData(null);
    }
  }, [request?.status, id, isRequester, isAcceptedMember]);

  if (loading) return <LoadingSpinner />;
  if (request === false || !request) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Request Not Found</h2>
        <p>This request may have been removed or does not exist.</p>
        <Link to="/requests" className="btn btn-primary">Back to Open Requests</Link>
      </div>
    );
  }

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await api.post(`/requests/${id}/accept`);
      toast.success('You have accepted this request! Contact and location details are now available.');
      loadRequest();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept — another member may have accepted first.');
      loadRequest();
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (nextStatus) => {
    setActionLoading(true);
    try {
      await api.patch(`/requests/${id}/status`, { status: nextStatus });
      toast.success(`Activity marked as ${nextStatus}!`);
      loadRequest();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Please enter a cancellation reason:');
    if (reason === null) return;

    setActionLoading(true);
    try {
      await api.post(`/requests/${id}/cancel`, { reason });
      toast.success('Request has been cancelled.');
      loadRequest();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Determine who the other member is for reporting or contact
  const otherMember = isRequester ? request.acceptedMember : request.requester;

  return (
    <div className="page" style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="request-details-view">
        {/* Header */}
        <div className="details-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="community-badge">📍 {request.community}, {request.city}</span>
              {request.isEmergency && (
                <span className="badge badge-urgent">🚨 EMERGENCY HELP</span>
              )}
            </div>
            <h1>{request.title}</h1>
            <p style={{ fontSize: '0.95rem', color: '#0f766e', fontWeight: 600, margin: 0 }}>
              {request.type === 'companionship' ? '🧑🤝🧑 Companionship Activity · ' : '🤝 Help Request · '}
              {request.category}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority || request.urgency} />
          </div>
        </div>

        {/* Date, Time, Community info */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '12px 0', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>
          <span>📅 <strong>Date:</strong> {request.date || 'Flexible'}</span>
          <span>⏰ <strong>Time:</strong> {request.time || 'Flexible'}</span>
          <span>📍 <strong>Area:</strong> {request.community}</span>
          <span>🚨 <strong>Urgency:</strong> {request.urgency}</span>
        </div>

        {/* Description */}
        <div style={{ margin: '24px 0' }}>
          <h3>Description</h3>
          <p style={{ fontSize: '1.02rem', lineHeight: '1.6', color: '#1e293b', whiteSpace: 'pre-line' }}>
            {request.description}
          </p>
        </div>

        {/* Smart Matching Explanation (if user matches) */}
        {request.matchReasons?.length > 0 && isPending && (
          <div className="match-explain-box">
            <h4>🎯 Why This Matches You ({request.matchScore || 80}% Compatibility)</h4>
            <p style={{ fontSize: '0.85rem', color: '#0f766e', margin: '0 0 6px' }}>
              Our explainable matching engine evaluated your skills, availability, and community location:
            </p>
            <ul>
              {request.matchReasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ====================================================================
            CRITICAL LOCATION & CONTACT PRIVACY RULE:
            Before acceptance:
            - Location is PRIVATE: "Location details will be available after the request is accepted."
            - Contact details remain strictly private.
            After acceptance:
            - ONLY the Requester and Accepted Member can see each other's location and contact details.
            - Other community members cannot see either location.
           ==================================================================== */}
        {isPending && (
          <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', margin: '20px 0' }}>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>📍</span>
              <span><strong>Location:</strong> Location details will be available after the request is accepted.</span>
            </p>
            <p style={{ margin: '6px 0 0 30px', fontSize: '0.84rem', color: '#64748b' }}>
              🔒 <strong>Privacy Protected:</strong> Contact details (phone and email) and exact locations remain strictly private.
            </p>
          </div>
        )}

        {/* Accepted Member Contact Card (Revealed only to the 2 parties involved) */}
        {isAcceptedOrBeyond && (isRequester || isAcceptedMember) && (
          <div className="member-info-card">
            <h4>🤝 Connected Community Members</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Requester Profile */}
              <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Requester
                </span>
                <h3 style={{ margin: '4px 0' }}>{request.requester?.fullName}</h3>
                <p style={{ fontSize: '0.85rem', margin: '2px 0' }}>
                  Age Group: <strong>{request.requester?.ageGroup || 'Community Member'}</strong>
                </p>
                <p style={{ fontSize: '0.85rem', margin: '2px 0' }}>
                  Community: <strong>{request.requester?.community || request.community}</strong>
                </p>

                {request.requester?.mobile && (
                  <div className="contact-revealed">
                    <p style={{ margin: '2px 0', fontSize: '0.9rem', color: '#166534' }}>
                      📞 <strong>Mobile:</strong> <a href={`tel:${request.requester.mobile}`}>{request.requester.mobile}</a>
                    </p>
                    {request.requester.email && (
                      <p style={{ margin: '2px 0', fontSize: '0.9rem', color: '#166534' }}>
                        ✉️ <strong>Email:</strong> <a href={`mailto:${request.requester.email}`}>{request.requester.email}</a>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Accepted Member Profile */}
              <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Helping Member
                </span>
                <h3 style={{ margin: '4px 0' }}>{request.acceptedMember?.fullName}</h3>
                <p style={{ fontSize: '0.85rem', margin: '2px 0' }}>
                  Age Group: <strong>{request.acceptedMember?.ageGroup || 'Community Member'}</strong>
                </p>
                <p style={{ fontSize: '0.85rem', margin: '2px 0' }}>
                  Community: <strong>{request.acceptedMember?.community || request.community}</strong>
                </p>

                {request.acceptedMember?.mobile && (
                  <div className="contact-revealed">
                    <p style={{ margin: '2px 0', fontSize: '0.9rem', color: '#166534' }}>
                      📞 <strong>Mobile:</strong> <a href={`tel:${request.acceptedMember.mobile}`}>{request.acceptedMember.mobile}</a>
                    </p>
                    {request.acceptedMember.email && (
                      <p style={{ margin: '2px 0', fontSize: '0.9rem', color: '#166534' }}>
                        ✉️ <strong>Email:</strong> <a href={`mailto:${request.acceptedMember.email}`}>{request.acceptedMember.email}</a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 📍 LOCATION SECTION (Exclusively for Requester & Accepted Member) */}
            <div style={{ marginTop: '20px', background: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📍</span> LOCATION
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  🔒 Shared only between Requester &amp; Accepted Member
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                {/* Requester Location */}
                <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                    🏠 Requester Location
                  </span>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', margin: '4px 0 2px' }}>
                    {request.requester?.fullName}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                    📍 {request.requesterLocation?.address || request.location?.address || `${request.community}, ${request.city}`}
                  </div>
                </div>

                {/* Accepted Member Location */}
                <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                    🤝 Accepted Member Location
                  </span>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', margin: '4px 0 2px' }}>
                    {request.acceptedMember?.fullName}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                    📍 {request.acceptedMemberLocation?.address || `${request.acceptedMember?.community || request.community}, ${request.city}`}
                  </div>
                </div>
              </div>

              {/* Visual Map showing both locations */}
              <AcceptedLocationMap
                requesterLoc={
                  locationData?.requesterLocation ||
                  request.requesterLocation || {
                    name: request.requester?.fullName,
                    address: request.location?.address || `${request.community}, ${request.city}`,
                    community: request.community,
                    city: request.city,
                    lat: request.location?.lat,
                    lng: request.location?.lng,
                  }
                }
                helperLoc={
                  locationData?.acceptedMemberLocation ||
                  request.acceptedMemberLocation || {
                    name: request.acceptedMember?.fullName,
                    address: `${request.acceptedMember?.community || request.community}, ${request.city}`,
                    community: request.acceptedMember?.community || request.community,
                    city: request.city,
                    lat: request.acceptedMember?.location?.lat,
                    lng: request.acceptedMember?.location?.lng,
                  }
                }
                currentUserRole={isRequester ? 'requester' : isAcceptedMember ? 'helper' : null}
              />
            </div>
          </div>
        )}

        {/* Status Lifecycle Actions */}
        <div style={{ margin: '28px 0', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {canAccept && (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? 'Accepting…' : '🤝 Accept & Help This Neighbor'}
            </button>
          )}

          {isAcceptedMember && request.status === 'Accepted' && (
            <button
              className="btn btn-primary"
              onClick={() => handleStatusUpdate('In Progress')}
              disabled={actionLoading}
            >
              Mark In Progress →
            </button>
          )}

          {isAcceptedMember && request.status === 'In Progress' && (
            <button
              className="btn btn-primary"
              onClick={() => handleStatusUpdate('Completed')}
              disabled={actionLoading}
            >
              ✅ Mark Completed
            </button>
          )}

          {isRequester && request.status === 'In Progress' && (
            <button
              className="btn btn-secondary"
              onClick={() => handleStatusUpdate('Completed')}
              disabled={actionLoading}
            >
              Confirm Completed ✅
            </button>
          )}

          {(isRequester || isAcceptedMember) && !['Completed', 'Cancelled'].includes(request.status) && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              Cancel Request
            </button>
          )}

          {/* Report an Issue button */}
          {!isPending && otherMember && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto', color: '#dc2626' }}
              onClick={() => setReportModalOpen(true)}
            >
              ⚠️ Report Issue
            </button>
          )}
        </div>

        {/* Progress Timeline */}
        <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <h3>Activity Progress Timeline</h3>
          <ul className="timeline-list">
            {request.statusHistory?.map((step, idx) => (
              <li key={idx} className="timeline-step">
                <span className="timeline-dot" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong>{step.status}</strong>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {new Date(step.changedAt).toLocaleString()}
                  </span>
                </div>
                {step.note && <p style={{ fontSize: '0.85rem', margin: '2px 0 0' }}>{step.note}</p>}
              </li>
            ))}
          </ul>
        </div>

        {/* Post-Completion Rating & Review Form */}
        {request.status === 'Completed' && (isRequester || isAcceptedMember) && (
          <div style={{ marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <ReviewForm
              requestId={id}
              alreadyReviewed={isRequester ? request.requesterReviewed : request.helperReviewed}
              onDone={loadRequest}
            />
          </div>
        )}
      </div>

      {/* Issue Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        requestId={id}
        reportedUserId={otherMember?._id}
        reportedName={otherMember?.fullName}
      />
    </div>
  );
}
