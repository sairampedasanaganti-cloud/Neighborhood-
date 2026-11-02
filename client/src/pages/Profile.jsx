import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  CITIES_AND_COMMUNITIES,
  INTEREST_OPTIONS,
  SKILL_OPTIONS,
  TIME_SLOTS,
  formatAgeGroupLabel,
  reverseGeocodeCoords,
} from '../data/communities';
import { GOOGLE_MAPS_API_KEY } from '../config';

export default function Profile() {
  const { profile, refreshProfile, logout, resetPassword } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'reviews'

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName || '',
        email: profile.email || '',
        mobile: profile.mobile || profile.phone || '',
        age: profile.age || 25,
        city: profile.city || 'Chennai',
        community: profile.community || profile.neighborhood || 'Anna Nagar',
        skills: profile.skills?.length ? profile.skills : profile.volunteerSkills || [],
        interests: profile.interests || [],
        availability: profile.availability || {
          weekdays: ['Evening'],
          weekends: ['Morning', 'Afternoon'],
          status: 'Available',
        },
      });

      api.get(`/reviews/user/${profile.id || profile._id}`)
        .then(({ data }) => setReviews(data.data || []))
        .catch(() => setReviews([]));
    }
  }, [profile]);

  if (!profile || !form) return <LoadingSpinner />;

  const handleCityChange = (newCity) => {
    const list = CITIES_AND_COMMUNITIES[newCity] || ['Other'];
    setForm({
      ...form,
      city: newCity,
      community: list[0],
      neighborhood: list[0],
    });
  };

  const handleAutoDetectArea = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    const toastId = toast.loading('📍 Detecting your exact area & neighborhood via GPS...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const detected = await reverseGeocodeCoords(lat, lng, GOOGLE_MAPS_API_KEY);

          const detectedCity = detected.city || form.city || 'Chennai';
          const detectedArea = detected.community || 'Other';

          setForm((prev) => ({
            ...prev,
            city: detectedCity,
            community: detectedArea,
            neighborhood: detectedArea,
            location: {
              address: detected.address || `${detectedArea}, ${detectedCity}`,
              lat,
              lng,
            },
          }));

          toast.success(`📍 Area auto-detected: ${detectedArea}, ${detectedCity}`, { id: toastId });
        } catch (e) {
          toast.error('Could not determine area name from GPS coordinates.', { id: toastId });
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        toast.error('Location permission was denied or unavailable. Please select your area manually.', { id: toastId });
        setDetectingLocation(false);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const toggleSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const toggleSlot = (period, slot) => {
    setForm((prev) => {
      const currentSlots = prev.availability[period] || [];
      const updated = currentSlots.includes(slot)
        ? currentSlots.filter((s) => s !== slot)
        : [...currentSlots, slot];
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [period]: updated,
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/me', form);
      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await resetPassword(profile.email);
      toast.success(`Password reset email dispatched to ${profile.email}`);
    } catch (err) {
      toast.error(err.message || 'Failed to send password reset email.');
    }
  };

  const baseCommunities = CITIES_AND_COMMUNITIES[form.city] || ['Other'];
  const availableCommunities = form.community && !baseCommunities.includes(form.community)
    ? [form.community, ...baseCommunities]
    : baseCommunities;

  return (
    <div className="page" style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Member Profile & Settings</h1>
          <p>Manage your neighborhood identity, skills, availability, and preferences.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile Information
        </button>
        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          ⭐ Feedback & Reviews ({reviews.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🔒 Security & Privacy
        </button>
      </div>

      {activeTab === 'profile' && (
        <form className="form-card" onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
          <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Age Category: </span>
              <strong>{formatAgeGroupLabel(profile.ageGroup)}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Community Standing: </span>
              <strong style={{ color: '#16a34a' }}>⭐ {profile.ratingAverage?.toFixed(1) || '5.0'} / 5.0</strong> ({profile.completedRequestsCount || 0} tasks)
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                min={10}
                max={120}
                required
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="10-digit mobile"
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                disabled
                value={form.email}
                title="Email is tied to your login account"
              />
            </div>
          </div>

          {/* City -> Community selection with Auto-Detect Button */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>📍 Neighborhood & Community Location</strong>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
                  Mutual aid requests and helpers are paired based on your local area.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAutoDetectArea}
                disabled={detectingLocation}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', fontWeight: 600 }}
              >
                {detectingLocation ? '📍 Detecting GPS…' : '📍 Auto-Detect My Area (GPS)'}
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <select
                  value={form.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                >
                  {!Object.keys(CITIES_AND_COMMUNITIES).includes(form.city) && (
                    <option value={form.city}>{form.city}</option>
                  )}
                  {Object.keys(CITIES_AND_COMMUNITIES).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Community / Area</label>
                <select
                  value={form.community}
                  onChange={(e) => setForm({ ...form, community: e.target.value, neighborhood: e.target.value })}
                >
                  {availableCommunities.map((comm) => (
                    <option key={comm} value={comm}>{comm}</option>
                  ))}
                </select>
              </div>
            </div>

            {form.community === 'Other' && (
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Specific Area / Neighborhood Name</label>
                <input
                  type="text"
                  required
                  value={form.neighborhood || ''}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  placeholder="Enter your specific neighborhood (e.g. Katpadi, Gandhi Nagar)"
                />
              </div>
            )}

            {form.location?.lat && (
              <div style={{ fontSize: '0.78rem', color: '#059669', background: '#ecfdf5', padding: '6px 10px', borderRadius: '6px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✓</span>
                <span>
                  <strong>GPS Coordinates Active:</strong> {form.location.lat.toFixed(4)}, {form.location.lng.toFixed(4)}
                  {form.location.address ? ` (${form.location.address.split(',').slice(0, 2).join(',')})` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="form-group">
            <label>Interests & Companionship</label>
            <div className="chips-grid">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  className={`chip-btn ${form.interests.includes(interest) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="form-group">
            <label>Skills / What You Can Help With</label>
            <div className="chips-grid">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  type="button"
                  key={skill}
                  className={`chip-btn ${form.skills.includes(skill) ? 'selected' : ''}`}
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="form-group">
            <label>Availability Slots</label>
            <table className="availability-table">
              <thead>
                <tr>
                  <th>Period</th>
                  {TIME_SLOTS.map((slot) => (
                    <th key={slot} style={{ textAlign: 'center' }}>{slot}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Weekdays</td>
                  {TIME_SLOTS.map((slot) => (
                    <td key={slot}>
                      <input
                        type="checkbox"
                        checked={(form.availability.weekdays || []).includes(slot)}
                        onChange={() => toggleSlot('weekdays', slot)}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Weekends</td>
                  {TIME_SLOTS.map((slot) => (
                    <td key={slot}>
                      <input
                        type="checkbox"
                        checked={(form.availability.weekends || []).includes(slot)}
                        onChange={() => toggleSlot('weekends', slot)}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile Changes'}
          </button>
        </form>
      )}

      {activeTab === 'reviews' && (
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3>Community Feedback Received</h3>
          {reviews.length === 0 ? (
            <p className="hint">No reviews yet. Fulfilling neighborhood requests will generate reviews here.</p>
          ) : (
            <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              {reviews.map((r) => (
                <div key={r._id} style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#f59e0b', fontSize: '1.1rem', marginBottom: '4px' }}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '0.92rem' }}>
                    "{r.comment || 'Smooth, courteous interaction.'}"
                  </p>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    — {r.reviewer?.fullName || 'Community Member'}, {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <div style={{ background: '#ffffff', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3>Security & Privacy Preferences</h3>
          <p>NeighborLink adheres to strict privacy safeguards: your contact information is never shared openly.</p>

          <div style={{ margin: '24px 0', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4>Password Management</h4>
            <p style={{ fontSize: '0.88rem', margin: '4px 0 14px' }}>
              Send an official password reset link to your registered email ({profile.email}).
            </p>
            <button className="btn btn-secondary" onClick={handlePasswordReset}>
              Send Password Reset Link
            </button>
          </div>

          <div style={{ margin: '24px 0', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4>Privacy Policy Controls</h4>
            <p style={{ fontSize: '0.88rem', margin: '4px 0' }}>
              ✓ Strict mutual consent: Contact numbers are revealed ONLY after a mutual-aid request is accepted.
            </p>
            <p style={{ fontSize: '0.88rem', margin: '4px 0' }}>
              ✓ No live GPS tracking: Only predefined community areas are shared.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
