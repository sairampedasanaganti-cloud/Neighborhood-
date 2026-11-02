import React from 'react';

const COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };

export default function PriorityBadge({ priority }) {
  return <span className="badge badge-priority" style={{ backgroundColor: COLORS[priority] || '#999' }}>{priority}</span>;
}
