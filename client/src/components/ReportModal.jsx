import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const REPORT_REASONS = [
  'Inappropriate Behaviour',
  'Misuse of Platform',
  'False Request',
  'Safety Concern',
  'Other',
];

export default function ReportModal({ isOpen, onClose, requestId, reportedUserId, reportedName }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please provide details for the report.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reports', {
        requestId,
        reportedUser: reportedUserId,
        reason,
        description,
      });
      toast.success('Report submitted. Our moderation team will investigate promptly.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <h2>⚠️ Report an Issue</h2>
        <p>Help keep NeighborLink safe and trustworthy for everyone in our community.</p>

        {reportedName && (
          <p className="hint">Reporting: <strong>{reportedName}</strong></p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Reason for reporting</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description & context</label>
            <textarea
              required
              rows={4}
              maxLength={1000}
              placeholder="Describe what happened or why this concerns you..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
