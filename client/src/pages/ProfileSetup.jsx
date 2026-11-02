import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  CITIES_AND_COMMUNITIES,
  INTEREST_OPTIONS,
  SKILL_OPTIONS,
  TIME_SLOTS,
  getAgeGroup,
  formatAgeGroupLabel,
  detectClosestCityAndCommunity,
  reverseGeocodeCoords,
} from '../data/communities';
import { GOOGLE_MAPS_API_KEY } from '../config';

export default function ProfileSetup() {
  const { firebaseUser, profile, saveProfileSetup } = useAuth();
  const navigate = useNavigate();

  const userPromptKey = firebaseUser?.uid
    ? `nl_location_prompt_completed_${firebaseUser.uid}`
    : 'nl_location_prompt_completed';

  const [showLocationModal, setShowLocationModal] = useState(() => {
    if (localStorage.getItem('nl_reg_location_captured') === 'true') return false;
    if (profile?.location?.lat != null) return false;
    return localStorage.getItem(userPromptKey) !== 'true';
  });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [suggestedBanner, setSuggestedBanner] = useState(() => {
    if (profile?.community && profile?.city) {
      return `📍 Community set from registration: ${profile.community} (${profile.city}).`;
    }
    return null;
  });

  const [form, setForm] = useState({
    fullName: profile?.fullName || '',
    age: profile?.age || 25,
    city: profile?.city || 'Chennai',
    community: profile?.community || CITIES_AND_COMMUNITIES['Chennai'][0],
    location: profile?.location || null,
    interests: profile?.interests || ['Community', 'Reading'],
    skills: profile?.skills?.length ? profile.skills : ['General Help'],
    availability: profile?.availability || {
      weekdays: ['Evening'],
      weekends: ['Morning', 'Afternoon'],
      status: 'Available',
    },
  });

  const [submitting, setSubmitting] = useState(false);

  // Handle location permission click
  const handleAllowLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser. Please choose your city manually.');
      handleChooseManually();
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let detected = await reverseGeocodeCoords(lat, lng, GOOGLE_MAPS_API_KEY);

        setForm((prev) => ({
          ...prev,
          city: detected.city || 'Chennai',
          community: detected.community || 'Other',
          neighborhood: detected.community || 'Other',
          location: {
            address: detected.address || `${detected.community}, ${detected.city}`,
            lat,
            lng,
          },
        }));

        setSuggestedBanner(`📍 Suggested based on your location: ${detected.community} (${detected.city}). Please confirm or adjust below.`);
        localStorage.setItem(userPromptKey, 'true');
        setShowLocationModal(false);
        setDetectingLocation(false);
        toast.success(`Area detected: ${detected.community}, ${detected.city}`);
      },
      (err) => {
        console.warn('Geolocation error or denied:', err.message);
        toast('Location access was not granted. Please select your community manually.', { icon: '📍' });
        handleChooseManually();
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleChooseManually = () => {
    localStorage.setItem(userPromptKey, 'true');
    setShowLocationModal(false);
    setDetectingLocation(false);
  };

  // Handle dependent community list when city changes
  const handleCityChange = (newCity) => {
    const communities = CITIES_AND_COMMUNITIES[newCity] || ['Other'];
    setForm({
      ...form,
      city: newCity,
      community: communities[0],
    });
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

  const currentAgeGroup = getAgeGroup(form.age);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    if (!form.age || form.age < 10 || form.age > 120) {
      toast.error('Please enter a valid age between 10 and 120.');
      return;
    }

    setSubmitting(true);
    try {
      await saveProfileSetup(form);
      toast.success('Neighborhood profile setup complete! Welcome to NeighborLink.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not save profile setup.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableCommunities = CITIES_AND_COMMUNITIES[form.city] || ['Other'];

  return (
    <div className="auth-page">
      {/* Location Permission Prompt Modal */}
      {showLocationModal && (
        <div className="modal-overlay">
          <div className="modal-window" style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📍</div>
            <h2 style={{ fontSize: '1.45rem', marginBottom: '10px', color: '#0f172a' }}>Allow Location Access</h2>
            <p style={{ fontSize: '0.98rem', color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>
              NeighborLink uses your location to help identify your community and provide relevant neighborhood connections.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleAllowLocation}
                disabled={detectingLocation}
                style={{ width: '100%' }}
              >
                {detectingLocation ? 'Detecting Area…' : 'Allow Location Access'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleChooseManually}
                disabled={detectingLocation}
                style={{ width: '100%' }}
              >
                Choose Manually
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '16px', lineHeight: 1.4, textAlign: 'center' }}>
              🔒 <strong>Privacy Protected:</strong> Location permission is ONLY used to suggest your neighborhood community. Your exact home address is never collected, tracked, or publicly shared.
            </p>
          </div>
        </div>
      )}

      <div className="form-card" style={{ maxWidth: '640px' }}>
        <div className="auth-header">
          <h1>Neighborhood Profile Setup</h1>
          <p>Tell your community how you can connect, help, and belong.</p>
        </div>

        {suggestedBanner && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#166534',
            fontSize: '0.88rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>{suggestedBanner}</span>
            <button
              type="button"
              onClick={() => setSuggestedBanner(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontWeight: 700, fontSize: '1rem', marginLeft: '8px' }}
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name & Age */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input
                id="name"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                min={10}
                max={120}
                required
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Assigned Interface: </span>
            <strong style={{ color: '#0f766e' }}>{formatAgeGroupLabel(currentAgeGroup)}</strong>
            {currentAgeGroup === 'senior' && (
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#0f766e', marginTop: '2px' }}>
                ✨ Senior citizen simplified mode with large buttons will be enabled for you.
              </span>
            )}
          </div>

          {/* Dependent City -> Community Selection */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <select
                id="city"
                value={form.city}
                onChange={(e) => handleCityChange(e.target.value)}
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
                {availableCommunities.map((comm) => (
                  <option key={comm} value={comm}>{comm}</option>
                ))}
              </select>
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '-8px', marginBottom: '18px' }}>
            🔒 Privacy guarantee: We only connect by community area. Your exact home address is never collected or tracked.
          </p>

          {/* Interests */}
          <div className="form-group">
            <label>Interests (shared companionship & hobbies)</label>
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
            <label>Skills & What I Can Help With (when available)</label>
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

          {/* Availability Matrix */}
          <div className="form-group">
            <label>Your General Availability</label>
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
                  <td><strong>Weekdays</strong></td>
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
                  <td><strong>Weekends</strong></td>
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

          <button
            className="btn btn-primary btn-lg"
            type="submit"
            style={{ width: '100%', marginTop: '16px' }}
            disabled={submitting}
          >
            {submitting ? 'Saving Profile…' : 'Complete Setup & Go to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
