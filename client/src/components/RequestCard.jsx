import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

export default function RequestCard({ request, matchScore, showMatchReasons }) {
  const isEmergency = request.isEmergency || request.type === 'emergency';
  const displayScore = matchScore ?? request.matchScore;
  const isPending = request.status === 'Pending';

  const typeLabel = request.type === 'companionship'
    ? 'Companionship'
    : isEmergency
      ? 'Emergency Help'
      : 'Help';

  const typeIcon = request.type === 'companionship'
    ? '🧑🤝🧑'
    : isEmergency
      ? '🚨'
      : '🤝';

  return (
    <div className={`request-card ${isEmergency ? 'is-emergency' : ''}`}>
      <div>
        <div className="request-card-header">
          <h3 className="request-card-title">{request.title}</h3>
          <div>
            {isEmergency ? (
              <span className="badge badge-urgent">🚨 Emergency</span>
            ) : (
              <PriorityBadge priority={request.priority || request.urgency} />
            )}
          </div>
        </div>

        <div className="request-card-category" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <span className="request-type-badge" style={{ fontWeight: 600, color: request.type === 'companionship' ? '#6d28d9' : '#0f766e' }}>
            {typeIcon} {typeLabel}
          </span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span style={{ color: '#475569', fontWeight: 500 }}>{request.category}</span>
        </div>

        <p className="request-card-desc">
          {request.description?.length > 130
            ? `${request.description.slice(0, 130)}…`
            : request.description}
        </p>

        <div className="request-card-meta">
          {(request.community || request.city) && (
            <span>📍 {request.community || request.city}{request.city && request.community ? `, ${request.city}` : ''}</span>
          )}
          {request.date && <span>📅 {request.date}</span>}
          {request.time && <span>⏰ {request.time}</span>}
        </div>

        {showMatchReasons && request.matchReasons?.length > 0 && (
          <div style={{ margin: '8px 0', fontSize: '0.8rem', color: '#0f766e', background: '#f0fdf4', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
            {request.matchReasons.map((reason, i) => (
              <div key={i}>{reason}</div>
            ))}
          </div>
        )}
      </div>

      <div className="request-card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <StatusBadge status={request.status} />
          {typeof displayScore === 'number' && displayScore > 0 && (
            <span className="match-pill" title="Transparent rule-based matching score">
              🎯 {displayScore}% Match
            </span>
          )}
        </div>

        <div className="request-card-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link to={`/requests/${request._id}`} className="btn btn-secondary btn-sm" title="View details">
            View Request
          </Link>
          {isPending && (
            <Link to={`/requests/${request._id}`} className="btn btn-primary btn-sm" title="Offer help for this request">
              Offer Help
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
