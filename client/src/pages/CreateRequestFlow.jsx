import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  HELP_CATEGORIES,
  COMPANIONSHIP_CATEGORIES,
  CITIES_AND_COMMUNITIES,
  getAgeGroup,
} from '../data/communities';

export default function CreateRequestFlow() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialFlow = searchParams.get('flow') || 'help';
  const [activeFlow, setActiveFlow] = useState(initialFlow); // 'help' | 'company' | 'emergency'

  const userAgeGroup = profile?.ageGroup || getAgeGroup(profile?.age || 25);
  const categoriesList = activeFlow === 'company'
    ? (COMPANIONSHIP_CATEGORIES[userAgeGroup] || COMPANIONSHIP_CATEGORIES.adult)
    : (HELP_CATEGORIES[userAgeGroup] || HELP_CATEGORIES.adult);

  const [selectedCategory, setSelectedCategory] = useState(categoriesList[0]?.title || '');
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '5:00 PM',
    urgency: 'Normal',
    city: profile?.city || 'Chennai',
    community: profile?.community || profile?.neighborhood || 'Anna Nagar',
  });

  const [showSummary, setShowSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(null);

  useEffect(() => {
    if (activeFlow === 'emergency') {
      setForm((f) => ({ ...f, urgency: 'Urgent', title: 'Emergency Assistance Needed' }));
      setSelectedCategory('Emergency Help');
    } else {
      setSelectedCategory(categoriesList[0]?.title || '');
    }
  }, [activeFlow, userAgeGroup]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat.title);
    if (!form.title || form.title.startsWith('Help with') || form.title.startsWith('Company for')) {
      const prefix = activeFlow === 'company' ? 'Company for ' : 'Help with ';
      setForm((f) => ({ ...f, title: `${prefix}${cat.title}` }));
    }
  };

  const handleOpenSummary = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter a request title.');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Please describe what you need.');
      return;
    }
    setShowSummary(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        type: activeFlow === 'company' ? 'companionship' : activeFlow === 'emergency' ? 'emergency' : 'help',
        category: selectedCategory,
        location: profile?.location || {
          address: `${form.community}, ${form.city}`,
        },
      };

      const { data } = await api.post('/requests', payload);
      setPostedSuccess(data.data);
      setShowSummary(false);
      toast.success(
        activeFlow === 'emergency'
          ? '🚨 Emergency broadcast activated across your community!'
          : 'Request posted successfully!'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Post-submission success state
  if (postedSuccess) {
    return (
      <div className="page" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="form-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>
            {activeFlow === 'emergency' ? '🚨' : '✅'}
          </div>
          <h1>Request Posted Successfully</h1>
          <p style={{ fontSize: '1.05rem', color: '#0f766e', fontWeight: 600 }}>
            {postedSuccess.title}
          </p>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', margin: '20px 0', textAlign: 'left', border: '1px solid #e2e8f0' }}>
            <p><strong>Status:</strong> <span className="badge badge-pending">{postedSuccess.status}</span></p>
            <p><strong>Category:</strong> {postedSuccess.category}</p>
            <p><strong>Community Visibility:</strong> All eligible members in 📍 {postedSuccess.community}</p>
            <p><strong>Matching Status:</strong> Active rule-based matching engine is calculating compatibility and notifying best-matched neighbors.</p>
            {activeFlow === 'emergency' && (
              <p style={{ color: '#dc2626', fontWeight: 600, margin: 0 }}>
                🚨 Emergency persistent alert is now active on community member dashboards until accepted.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/requests/${postedSuccess._id}`)}
            >
              View Request Page
            </button>
            <Link to="/dashboard" className="btn btn-ghost">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Create a Request</h1>
        <p>NeighborLink connects you with nearby community members for mutual aid and connection.</p>
      </div>

      {/* Main Mode Tabs */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeFlow === 'help' ? 'active' : ''}`}
          onClick={() => setActiveFlow('help')}
        >
          🤝 Need Help
        </button>
        <button
          className={`tab-btn ${activeFlow === 'company' ? 'active' : ''}`}
          onClick={() => setActiveFlow('company')}
        >
          🧑🤝🧑 Company (Companionship)
        </button>
        <button
          className={`tab-btn ${activeFlow === 'emergency' ? 'active' : ''}`}
          onClick={() => setActiveFlow('emergency')}
          style={{ color: activeFlow === 'emergency' ? '#dc2626' : undefined }}
        >
          🚨 Emergency Help
        </button>
      </div>

      {/* Emergency Disclaimer Banner */}
      {activeFlow === 'emergency' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
          <h3 style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚨</span> Important Safety Advisory
          </h3>
          <p style={{ color: '#7f1d1d', margin: '4px 0 0', fontSize: '0.9rem' }}>
            This emergency alert will appear prominently across every neighbor’s dashboard in {form.community}.
            For life-threatening or medical emergencies, please <strong>immediately call emergency services (112 or local ambulance)</strong> before or alongside posting here.
          </p>
        </div>
      )}

      {/* Category Picker (if not emergency) */}
      {activeFlow !== 'emergency' && (
        <div>
          <label style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            Choose a Category (Tailored for {userAgeGroup.replace('_', ' ')})
          </label>
          <div className="category-picker-grid">
            {categoriesList.map((cat) => (
              <div
                key={cat.title}
                className={`category-pick-card ${selectedCategory === cat.title ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat)}
              >
                <div className="category-pick-header">
                  <span className="category-pick-icon">{cat.icon}</span>
                  <span className="category-pick-title">{cat.title}</span>
                </div>
                <p className="category-pick-desc">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Details Form */}
      <form className="form-card" onSubmit={handleOpenSummary} style={{ maxWidth: '100%' }}>
        <h3>Request Details</h3>

        <div className="form-group">
          <label htmlFor="reqTitle">Request Title</label>
          <input
            id="reqTitle"
            required
            maxLength={160}
            placeholder={
              activeFlow === 'company'
                ? 'e.g. Evening Walk in Tower Park'
                : 'e.g. Need BP medicine picked up from pharmacy'
            }
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="reqDesc">
            {activeFlow === 'company' ? 'Activity Details' : 'Description & Context'}
          </label>
          <textarea
            id="reqDesc"
            required
            rows={4}
            maxLength={1500}
            placeholder={
              activeFlow === 'company'
                ? 'Describe what you would like to do, how long, and any preferences...'
                : 'Describe what help you need, specific requirements, or instructions...'
            }
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="time">Time</label>
            <input
              id="time"
              placeholder="e.g. 5:30 PM or Morning"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </div>

          {activeFlow !== 'emergency' && (
            <div className="form-group">
              <label htmlFor="urgency">Urgency</label>
              <select
                id="urgency"
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">City</label>
            <select
              id="city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value, community: CITIES_AND_COMMUNITIES[e.target.value]?.[0] || 'Other' })}
            >
              {Object.keys(CITIES_AND_COMMUNITIES).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="community">Community / Area</label>
            <select
              id="community"
              value={form.community}
              onChange={(e) => setForm({ ...form, community: e.target.value })}
            >
              {(CITIES_AND_COMMUNITIES[form.city] || ['Other']).map((comm) => (
                <option key={comm} value={comm}>{comm}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          className={`btn ${activeFlow === 'emergency' ? 'btn-emergency' : 'btn-primary'} btn-lg`}
          type="submit"
          style={{ width: '100%', marginTop: '14px' }}
        >
          Review Request Summary →
        </button>
      </form>

      {/* Pre-submission Request Summary Modal */}
      {showSummary && (
        <div className="modal-overlay" onClick={() => setShowSummary(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h2>📋 Request Summary</h2>
            <p>Please review your details before broadcasting to the community:</p>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', margin: '16px 0', border: '1px solid #e2e8f0' }}>
              <p><strong>Type:</strong> {activeFlow === 'company' ? '🧑🤝🧑 Companionship (Company)' : activeFlow === 'emergency' ? '🚨 Emergency Help' : '🤝 Need Help'}</p>
              <p><strong>Category:</strong> {selectedCategory}</p>
              <p><strong>Title:</strong> {form.title}</p>
              <p><strong>Description:</strong> {form.description}</p>
              <p><strong>Date & Time:</strong> {form.date} at {form.time}</p>
              <p><strong>Community:</strong> {form.community}, {form.city}</p>
              <p><strong>Urgency:</strong> {form.urgency}</p>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              ℹ️ Visibility: This request will be visible to eligible community members in {form.community}.
              Your contact details (mobile & email) will stay private until a member formally accepts.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowSummary(false)}
                disabled={submitting}
              >
                Back to Edit
              </button>
              <button
                type="button"
                className={`btn ${activeFlow === 'emergency' ? 'btn-emergency' : 'btn-primary'}`}
                onClick={handleConfirmSubmit}
                disabled={submitting}
              >
                {submitting ? 'Posting…' : 'Confirm & Post Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
