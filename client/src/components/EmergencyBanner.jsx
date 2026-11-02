import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EmergencyBanner() {
  const { profile } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchEmergencies = async () => {
    if (!profile) return;
    try {
      const { data } = await api.get('/requests/emergency/active');
      setEmergencies(data.data || []);
    } catch (err) {
      // ignore poll errors
    }
  };

  useEffect(() => {
    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [profile, location.pathname]);

  if (!emergencies || emergencies.length === 0) return null;

  const currentEmergency = emergencies[0];
  const isOwner = String(currentEmergency.requester?._id) === String(profile?.id || profile?._id);

  return (
    <div className="emergency-banner-global" role="alert">
      <div className="emergency-banner-content">
        <div>
          <div className="emergency-alert-title">
            <span>🚨</span>
            <span>ACTIVE EMERGENCY IN {currentEmergency.community || profile?.community || 'YOUR AREA'}</span>
          </div>
          <p className="emergency-alert-desc">
            <strong>{currentEmergency.requester?.fullName}:</strong> {currentEmergency.title}
          </p>
          <p className="emergency-disclaimer">
            ⚠️ Life-safety note: For life-threatening emergencies, immediately dial emergency services (112/911).
          </p>
        </div>

        <div className="emergency-btn-group">
          <button
            className="btn btn-emergency btn-sm"
            onClick={() => navigate(`/requests/${currentEmergency._id}`)}
          >
            {isOwner ? 'View My Emergency Request' : '🚨 Offer Urgent Help'}
          </button>
        </div>
      </div>
    </div>
  );
}
