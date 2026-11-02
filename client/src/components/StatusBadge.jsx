import React from 'react';

const COLORS = {
  Pending: '#f59e0b', Accepted: '#3b82f6', 'On the Way': '#6366f1',
  'In Progress': '#8b5cf6', Completed: '#10b981', Cancelled: '#ef4444',
};

export default function StatusBadge({ status }) {
  return <span className="badge" style={{ backgroundColor: COLORS[status] || '#999' }}>{status}</span>;
}
