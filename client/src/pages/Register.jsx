import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  CITIES_AND_COMMUNITIES,
  getCoordinatesForCommunity,
  reverseGeocodeCoords,
} from '../data/communities';
import { GOOGLE_MAPS_API_KEY } from '../config';

export default function Register() {
  const { register, firebaseUser, profile, loading, isEmailVerified, isProfileComplete } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    emailOrPhone: '',
    password: '',
    confirmPassword: '',
    city: 'Chennai',
    community: CITIES_AND_COMMUNITIES['Chennai'][0],
  });

  const [locationCoords, setLocationCoords] = useState(() => {
    return getCoordinatesForCommunity('Anna Nagar', 'Chennai');
  });
  const [locationStatus, setLocationStatus] = useState('prompt'); // 'prompt' | 'detecting' | 'granted' | 'denied' | 'manual'
  const [detectedAddress, setDetectedAddress] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAuthenticated = !!firebaseUser || !!profile || !!localStorage.getItem('nl_auth_token');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (!isEmailVerified) navigate('/verify-email');
      else if (!isProfileComplete) navigate('/profile-setup');
      else navigate(profile?.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [loading, isAuthenticated, isEmailVerified, isProfileComplete, profile?.role, navigate]);

  // Request browser geolocation
  const handleRequestLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser. Please select your city and community manually.');
      setLocationStatus('denied');
      setShowLocationModal(false);
      return;
    }

    setLocationStatus('detecting');
    const toastId = toast.loading('📍 Accessing location to detect your neighborhood community...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const detected = await reverseGeocodeCoords(lat, lng, GOOGLE_MAPS_API_KEY);
          const detectedCity = detected.city || form.city || 'Chennai';
          const detectedCommunity = detected.community || form.community || 'Anna Nagar';
          const addr = detected.address || `${detectedCommunity}, ${detectedCity}`;

          setForm((prev) => ({
            ...prev,
            city: detectedCity,
            community: detectedCommunity,
          }));

          setLocationCoords({ lat, lng });
          setDetectedAddress(addr);
          setLocationStatus('granted');
          setShowLocationModal(false);

          toast.success(`📍 Location detected: ${detectedCommunity}, ${detectedCity}!`, { id: toastId });
        } catch (e) {
          const fallbackCoords = { lat, lng };
          setLocationCoords(fallbackCoords);
          setLocationStatus('granted');
          setShowLocationModal(false);
          toast.success('📍 Location access granted!', { id: toastId });
        }
      },
      (err) => {
        console.warn('[Register] Geolocation error or denied:', err.message);
        setLocationStatus('denied');
        setShowLocationModal(false);
        toast('Location access was denied or unavailable. Please choose your community manually.', {
          id: toastId,
          icon: '📍',
        });
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  const handleManualSelection = () => {
    setLocationStatus('manual');
    setShowLocationModal(false);
    const coords = getCoordinatesForCommunity(form.community, form.city);
    setLocationCoords(coords);
  };

  const handleCityChange = (newCity) => {
    const list = CITIES_AND_COMMUNITIES[newCity] || ['Other'];
    const newCommunity = list[0];
    const coords = getCoordinatesForCommunity(newCommunity, newCity);
    setForm((prev) => ({
      ...prev,
      city: newCity,
      community: newCommunity,
    }));
    setLocationCoords(coords);
  };

  const handleCommunityChange = (newCommunity) => {
    const coords = getCoordinatesForCommunity(newCommunity, form.city);
    setForm((prev) => ({
      ...prev,
      community: newCommunity,
    }));
    setLocationCoords(coords);
  };

  const validate = () => {
    if (!form.fullName.trim()) {
      toast.error('Please enter your full name.');
      return false;
    }

    const input = form.emailOrPhone.trim();
    if (!input) {
      toast.error('Please enter your email or 10-digit mobile number.');
      return false;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    const isPhone = /^[6-9]\d{9}$/.test(input.replace(/[\s-]/g, ''));

    if (!isEmail && !isPhone) {
      toast.error('Please enter a valid email address or 10-digit mobile number.');
      return false;
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return false;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return false;
    }

    if (!form.city || !form.community) {
      toast.error('Please select your neighborhood community.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const finalCoords = locationCoords || getCoordinatesForCommunity(form.community, form.city);
      const locationPayload = {
        address: detectedAddress || `${form.community}, ${form.city}`,
        lat: finalCoords.lat,
        lng: finalCoords.lng,
      };

      await register({
        fullName: form.fullName.trim(),
        emailOrPhone: form.emailOrPhone.trim(),
        password: form.password,
        city: form.city,
        community: form.community,
        location: locationPayload,
      });

      toast.success('Account created! Please check your inbox to verify your email.');
      navigate('/verify-email');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('email-already-in-use')) {
        toast.error('An account already exists with this email or mobile number. Please log in.');
      } else if (msg.includes('weak-password')) {
        toast.error('Password is too weak. Please use at least 6 letters or numbers.');
      } else {
        toast.error(msg.replace('Firebase: ', '') || 'Could not register account.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const availableCommunities = CITIES_AND_COMMUNITIES[form.city] || ['Other'];

  return (
    <div className="auth-page">
      {/* Location Permission Modal Prompt right when user arrives */}
      {showLocationModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-window" style={{ textAlign: 'center', maxWidth: '480px', padding: '28px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px', animation: 'pulse 2s infinite' }}>📍</div>
            <h2 style={{ fontSize: '1.45rem', marginBottom: '10px', color: '#0f172a' }}>
              Allow Location Access
            </h2>
            <p style={{ fontSize: '0.96rem', color: '#475569', lineHeight: 1.55, margin: '0 0 20px' }}>
              NeighborLink connects you with nearby neighbors in your specific community. Please allow location access so we can detect your neighborhood area for accurate map & mutual-aid connections.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleRequestLocation}
                disabled={locationStatus === 'detecting'}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>📍</span>
                {locationStatus === 'detecting' ? 'Detecting Your Neighborhood…' : 'Allow Location Access & Detect'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleManualSelection}
                disabled={locationStatus === 'detecting'}
                style={{ width: '100%' }}
              >
                Choose Community Manually
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '16px', lineHeight: 1.4, textAlign: 'center' }}>
              🔒 <strong>Privacy Protected:</strong> We only connect you by community area (e.g. Anna Nagar, Indiranagar). Your exact home address is never collected or publicly displayed.
            </p>
          </div>
        </div>
      )}

      <div className="auth-card" style={{ maxWidth: '540px' }}>
        <div className="auth-header">
          <h1>Join NeighborLink</h1>
          <p>Connect with neighbors who can help or share good company.</p>
        </div>

        {/* Location Status Card */}
        <div
          style={{
            background: locationStatus === 'granted' ? '#f0fdf4' : '#f8fafc',
            border: `1px solid ${locationStatus === 'granted' ? '#86efac' : '#e2e8f0'}`,
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '20px',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>{locationStatus === 'granted' ? '✅' : '📍'}</span>
              <strong style={{ fontSize: '0.92rem', color: locationStatus === 'granted' ? '#166534' : '#0f172a' }}>
                {locationStatus === 'granted'
                  ? 'Location Access Granted'
                  : locationStatus === 'detecting'
                  ? 'Detecting Location…'
                  : 'Neighborhood Location'}
              </strong>
            </div>

            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={locationStatus === 'detecting'}
              style={{
                background: 'none',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                color: '#2563eb',
                fontWeight: 600,
              }}
            >
              {locationStatus === 'granted' ? '🔄 Re-detect' : '📍 Detect Area'}
            </button>
          </div>

          {locationStatus === 'granted' ? (
            <div style={{ fontSize: '0.85rem', color: '#166534', lineHeight: 1.4 }}>
              <div><strong>Community:</strong> {form.community}, {form.city}</div>
              {locationCoords && (
                <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '2px' }}>
                  Coordinates: {locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
              {locationStatus === 'denied'
                ? 'Location access was not granted. Please confirm your community manually below.'
                : 'Allow location access for auto-detection, or select your city & community below.'}
            </div>
          )}

          {/* City & Community Dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
            <div>
              <label htmlFor="regCity" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                City
              </label>
              <select
                id="regCity"
                value={form.city}
                onChange={(e) => handleCityChange(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              >
                {Object.keys(CITIES_AND_COMMUNITIES).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="regCommunity" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Community / Area
              </label>
              <select
                id="regCommunity"
                value={form.community}
                onChange={(e) => handleCommunityChange(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              >
                {availableCommunities.map((comm) => (
                  <option key={comm} value={comm}>{comm}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              required
              placeholder="e.g. Aditi Sharma"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="emailOrPhone">Email or Mobile Number</label>
            <input
              id="emailOrPhone"
              type="text"
              required
              placeholder="name@example.com or 9876543210"
              value={form.emailOrPhone}
              onChange={(e) => setForm({ ...form, emailOrPhone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="form-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            type="submit"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={submitting}
          >
            {submitting ? 'Creating Account…' : 'Register & Continue'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.9rem' }}>
            Already registered? <Link to="/login"><strong>Log in here</strong></Link>
          </p>
        </form>
      </div>
    </div>
  );
}
