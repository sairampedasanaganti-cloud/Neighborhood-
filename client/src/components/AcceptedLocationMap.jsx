import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { getCoordinatesForCommunity } from '../data/communities';

/**
 * Calculates distance in kilometers between two lat/lng coordinates (Haversine Formula)
 */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export default function AcceptedLocationMap({ requesterLoc, helperLoc, currentUserRole }) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);

  // View modes: 'map' (Interactive Google Maps styled) | 'satellite' | 'directions' (Official Google Turn-by-Turn Embed)
  const [viewMode, setViewMode] = useState('map');

  // Live Location tracking state
  const [liveLocationActive, setLiveLocationActive] = useState(false);
  const [detectingLiveLoc, setDetectingLiveLoc] = useState(false);
  const [liveCoords, setLiveCoords] = useState(null);

  // Fallback community coordinates
  const reqCoordsFallback = getCoordinatesForCommunity(requesterLoc?.community, requesterLoc?.city);
  const helpCoordsFallback = getCoordinatesForCommunity(helperLoc?.community, helperLoc?.city);

  // Base coordinates
  let baseReqLat = Number(requesterLoc?.lat) || reqCoordsFallback.lat || 13.0850;
  let baseReqLng = Number(requesterLoc?.lng) || reqCoordsFallback.lng || 80.2101;
  let baseHelpLat = Number(helperLoc?.lat) || helpCoordsFallback.lat || 13.0880;
  let baseHelpLng = Number(helperLoc?.lng) || helpCoordsFallback.lng || 80.2180;

  // Apply Live Location override if enabled
  let reqLat = baseReqLat;
  let reqLng = baseReqLng;
  let helpLat = baseHelpLat;
  let helpLng = baseHelpLng;

  if (liveLocationActive && liveCoords) {
    if (currentUserRole === 'requester') {
      reqLat = liveCoords.lat;
      reqLng = liveCoords.lng;
    } else {
      // Default to updating helper position or current viewer
      helpLat = liveCoords.lat;
      helpLng = liveCoords.lng;
    }
  }

  // If coordinates are identical (same community default pin), apply slight offset so both pins are visible
  if (Math.abs(helpLat - reqLat) < 0.0005 && Math.abs(helpLng - reqLng) < 0.0005) {
    helpLat += 0.0035;
    helpLng += 0.0045;
  }

  const distanceKm = getDistanceKm(reqLat, reqLng, helpLat, helpLng);
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${reqLat},${reqLng}&destination=${helpLat},${helpLng}`;
  const googleMapsEmbedUrl = `https://maps.google.com/maps?saddr=${reqLat},${reqLng}&daddr=${helpLat},${helpLng}&output=embed`;

  // Toggle Live Location
  const handleToggleLiveLocation = () => {
    if (liveLocationActive) {
      setLiveLocationActive(false);
      setLiveCoords(null);
      toast('Live location tracking paused. Showing registered community locations.', { icon: '📍' });
      return;
    }

    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLiveLoc(true);
    const toastId = toast.loading('📍 Accessing your live GPS position…');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLiveCoords(coords);
        setLiveLocationActive(true);
        setDetectingLiveLoc(false);
        toast.success('🟢 Live location active! Updated position on the map.', { id: toastId });
      },
      (err) => {
        console.warn('[Map] Live location error:', err.message);
        setDetectingLiveLoc(false);
        toast.error('Could not access live location. Please ensure location permissions are enabled.', { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  // Cleanup Leaflet instance
  const destroyLeaflet = useCallback(() => {
    if (leafletMapRef.current) {
      try {
        leafletMapRef.current.remove();
      } catch (e) {}
      leafletMapRef.current = null;
    }
  }, []);

  // Render Leaflet map with authentic Google Maps tiles (Roadmap & Satellite)
  const renderLeafletMap = useCallback(() => {
    if (!mapContainerRef.current || viewMode === 'directions') return;
    destroyLeaflet();

    mapContainerRef.current.innerHTML = '';

    const map = L.map(mapContainerRef.current, {
      center: [(reqLat + helpLat) / 2, (reqLng + helpLng) / 2],
      zoom: 14,
      scrollWheelZoom: false,
      attributionControl: false,
    });
    leafletMapRef.current = map;

    // Authentic Google Maps Tiles (100% clean, NO watermarks, authentic Google Maps streets and labels)
    const googleRoadmap = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps',
      }
    );

    const googleSatellite = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps Satellite',
      }
    );

    const osmStandard = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }
    );

    if (viewMode === 'satellite') {
      googleSatellite.addTo(map);
    } else {
      googleRoadmap.addTo(map);
    }

    // Layer switcher in top-right
    L.control
      .layers(
        {
          '🗺️ Google Street': googleRoadmap,
          '🛰️ Google Satellite': googleSatellite,
          '🌍 OpenStreetMap': osmStandard,
        },
        null,
        { position: 'topright' }
      )
      .addTo(map);

    // Scale control
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // Custom Requester Marker
    const isReqLive = liveLocationActive && currentUserRole === 'requester';
    const reqIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
          <div style="background:#2563eb;color:#fff;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 0 4px rgba(37,99,235,0.3), 0 4px 12px rgba(0,0,0,0.35);border:2px solid #ffffff;">
            🏠
          </div>
          ${isReqLive ? '<span style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#22c55e;border:2px solid #fff;border-radius:50%;"></span>' : ''}
          <div style="background:#1e3a8a;color:#ffffff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;margin-top:4px;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2);">
            ${isReqLive ? '🏠 Requester (Live)' : 'Requester'}
          </div>
        </div>
      `,
      iconSize: [42, 60],
      iconAnchor: [21, 21],
      popupAnchor: [0, -24],
    });

    // Custom Accepted Member Marker
    const isHelperLive = liveLocationActive && currentUserRole !== 'requester';
    const helpIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
          <div style="background:#059669;color:#fff;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 0 4px rgba(5,150,105,0.3), 0 4px 12px rgba(0,0,0,0.35);border:2px solid #ffffff;">
            🤝
          </div>
          ${isHelperLive ? '<span style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#22c55e;border:2px solid #fff;border-radius:50%;"></span>' : ''}
          <div style="background:#065f46;color:#ffffff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;margin-top:4px;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2);">
            ${isHelperLive ? '🤝 Helper (Live)' : 'Accepted Member'}
          </div>
        </div>
      `,
      iconSize: [42, 60],
      iconAnchor: [21, 21],
      popupAnchor: [0, -24],
    });

    // Requester Pin
    L.marker([reqLat, reqLng], { icon: reqIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:sans-serif;padding:4px;min-width:180px;">
          <div style="font-weight:700;color:#2563eb;font-size:0.9rem;margin-bottom:2px;">🏠 Requester</div>
          <div style="font-weight:600;color:#0f172a;font-size:0.95rem;">${requesterLoc?.name || 'Requester'}</div>
          <div style="color:#64748b;font-size:0.8rem;margin-top:2px;">📍 ${requesterLoc?.address || `${requesterLoc?.community || 'Anna Nagar'}, ${requesterLoc?.city || 'Chennai'}`}</div>
          ${isReqLive ? '<div style="color:#16a34a;font-size:0.75rem;font-weight:700;margin-top:4px;">🟢 Real-Time GPS Active</div>' : ''}
        </div>
      `);

    // Helper Pin
    L.marker([helpLat, helpLng], { icon: helpIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:sans-serif;padding:4px;min-width:180px;">
          <div style="font-weight:700;color:#059669;font-size:0.9rem;margin-bottom:2px;">🤝 Accepted Member</div>
          <div style="font-weight:600;color:#0f172a;font-size:0.95rem;">${helperLoc?.name || 'Accepted Member'}</div>
          <div style="color:#64748b;font-size:0.8rem;margin-top:2px;">📍 ${helperLoc?.address || `${helperLoc?.community || 'Anna Nagar'}, ${helperLoc?.city || 'Chennai'}`}</div>
          ${isHelperLive ? '<div style="color:#16a34a;font-size:0.75rem;font-weight:700;margin-top:4px;">🟢 Real-Time GPS Active</div>' : ''}
        </div>
      `);

    // Connecting dashed route line
    L.polyline(
      [
        [reqLat, reqLng],
        [helpLat, helpLng],
      ],
      {
        color: '#2563eb',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.9,
      }
    ).addTo(map);

    // Fit bounds with comfortable padding
    const bounds = L.latLngBounds([
      [reqLat, reqLng],
      [helpLat, helpLng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });

    // Guarantee full tile loading without grey gaps
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
    setTimeout(() => {
      map.invalidateSize();
    }, 450);
  }, [reqLat, reqLng, helpLat, helpLng, requesterLoc, helperLoc, viewMode, liveLocationActive, currentUserRole, destroyLeaflet]);

  useEffect(() => {
    if (viewMode !== 'directions') {
      renderLeafletMap();
    } else {
      destroyLeaflet();
    }

    let resizeObserver = null;
    if (mapContainerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      destroyLeaflet();
    };
  }, [viewMode, renderLeafletMap, destroyLeaflet]);

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Top Map Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '10px 14px',
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '10px 10px 0 0',
          fontSize: '0.85rem',
          border: '1px solid #1e293b',
          borderBottom: 'none',
        }}
      >
        {/* Left: Distance & Live Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-block',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: liveLocationActive ? '#22c55e' : '#38bdf8',
              boxShadow: `0 0 8px ${liveLocationActive ? '#22c55e' : '#38bdf8'}`,
            }}
          />
          <span>
            <strong>{liveLocationActive ? 'Live Distance:' : 'Mutual Distance:'}</strong> ~{distanceKm} km apart
          </span>
          {liveLocationActive && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: '#166534',
                color: '#bbf7d0',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              🟢 Live GPS Active
            </span>
          )}
        </div>

        {/* Right: Mode Switcher & Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Live Location Button */}
          <button
            type="button"
            onClick={handleToggleLiveLocation}
            disabled={detectingLiveLoc}
            style={{
              background: liveLocationActive ? '#166534' : 'rgba(255,255,255,0.08)',
              color: liveLocationActive ? '#ffffff' : '#f1f5f9',
              border: `1px solid ${liveLocationActive ? '#22c55e' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease',
            }}
            title="Access live GPS to show your real-time location to the other member"
          >
            <span>📍</span>
            {detectingLiveLoc ? 'Detecting GPS…' : liveLocationActive ? 'Live GPS: On' : 'Use Live Location'}
          </button>

          {/* View Mode Switcher */}
          <div style={{ display: 'inline-flex', background: '#1e293b', borderRadius: '6px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              style={{
                background: viewMode === 'map' ? '#2563eb' : 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Google Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('satellite')}
              style={{
                background: viewMode === 'satellite' ? '#2563eb' : 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setViewMode('directions')}
              style={{
                background: viewMode === 'directions' ? '#2563eb' : 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Route (Embed)
            </button>
          </div>

          {/* Open in Google Maps */}
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#38bdf8',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              background: 'rgba(56,189,248,0.14)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(56,189,248,0.3)',
            }}
          >
            🗺️ Open in Google Maps ↗
          </a>
        </div>
      </div>

      {/* Map Surface or Google Directions Embed */}
      {viewMode === 'directions' ? (
        <iframe
          title="Google Maps Route"
          width="100%"
          height="340"
          style={{
            border: '1px solid #cbd5e1',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            display: 'block',
          }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={googleMapsEmbedUrl}
        />
      ) : (
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '340px',
            borderRadius: '0 0 10px 10px',
            border: '1px solid #cbd5e1',
            borderTop: 'none',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            background: '#e5e7eb',
          }}
        />
      )}
    </div>
  );
}
