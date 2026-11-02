import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RequestCard from '../components/RequestCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  OFFER_HELP_CATEGORIES,
  mapToOfferHelpCategory,
  getOfferHelpCategoryById,
} from '../data/offerHelpCategories';

export default function OfferHelp() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected help category ID (e.g. 'medical_health', 'education_academic', or null for category selection view)
  const initialCategory = searchParams.get('category');
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCategory && OFFER_HELP_CATEGORIES.some((c) => c.id === initialCategory)
      ? initialCategory
      : null
  );

  const [rawRequests, setRawRequests] = useState(null);
  const [filters, setFilters] = useState({
    urgency: '',
    sort: 'relevance',
  });

  const loadRequests = async () => {
    try {
      setRawRequests(null);
      const params = {};
      if (filters.urgency) params.urgency = filters.urgency;
      if (filters.sort === 'urgency') params.sort = 'urgency';
      if (filters.sort === 'newest') params.sort = 'newest';

      const { data } = await api.get('/requests', { params });
      let list = data.data || [];

      // Sort by match score if relevance is chosen
      if (filters.sort === 'relevance') {
        list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      }

      setRawRequests(list);
    } catch (err) {
      setRawRequests([]);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filters]);

  // Sync state when URL search param changes
  useEffect(() => {
    const catFromUrl = searchParams.get('category');
    if (catFromUrl && OFFER_HELP_CATEGORIES.some((c) => c.id === catFromUrl)) {
      setSelectedCategoryId(catFromUrl);
    } else if (!catFromUrl) {
      setSelectedCategoryId(null);
    }
  }, [searchParams]);

  const handleSelectCategory = (catId) => {
    setSelectedCategoryId(catId);
    if (catId) {
      setSearchParams({ category: catId });
    } else {
      setSearchParams({});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const userCommunity = profile?.community || profile?.neighborhood || 'your neighborhood';

  // Only show active (Pending) requests and respect age suitability
  const activeRequests = useMemo(() => {
    if (!rawRequests) return [];
    return rawRequests.filter((r) => r.status === 'Pending' && r.eligible !== false);
  }, [rawRequests]);

  // Dynamically calculate request counts for each category from active requests
  const categoryCounts = useMemo(() => {
    const counts = {};
    OFFER_HELP_CATEGORIES.forEach((cat) => {
      counts[cat.id] = 0;
    });

    activeRequests.forEach((req) => {
      const catId = mapToOfferHelpCategory(req);
      if (counts[catId] !== undefined) {
        counts[catId]++;
      } else {
        counts['other'] = (counts['other'] || 0) + 1;
      }
    });

    return counts;
  }, [activeRequests]);

  const selectedCategoryObj = selectedCategoryId
    ? getOfferHelpCategoryById(selectedCategoryId)
    : null;

  // Requests filtered to the currently selected category
  const filteredCategoryRequests = useMemo(() => {
    if (!selectedCategoryId) return [];
    return activeRequests.filter((req) => mapToOfferHelpCategory(req) === selectedCategoryId);
  }, [activeRequests, selectedCategoryId]);

  return (
    <div className="page">
      {/* -------------------------------------------------------------
          STEP 1: CHOOSE A HELP CATEGORY (Default Overview)
          ------------------------------------------------------------- */}
      {!selectedCategoryId ? (
        <>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-normal" style={{ fontSize: '0.8rem', background: '#ecfdf5', color: '#047857' }}>
                🌱 Neighborhood Mutual Aid
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                • {activeRequests.length} active {activeRequests.length === 1 ? 'request' : 'requests'} available
              </span>
            </div>
            <h1>🌱 Offer Help in {userCommunity}</h1>
            <p style={{ maxWidth: '780px', color: '#475569', fontSize: '1rem', lineHeight: '1.6' }}>
              Choose a category below to browse active community requests. You can offer assistance,
              share your skills, or provide friendly companionship to neighbors in your area.
            </p>
          </div>

          {rawRequests === null ? (
            <LoadingSpinner />
          ) : (
            <div className="offer-category-grid">
              {OFFER_HELP_CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.id] || 0;
                return (
                  <div
                    key={cat.id}
                    className="offer-category-card"
                    onClick={() => handleSelectCategory(cat.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSelectCategory(cat.id);
                      }
                    }}
                  >
                    <div>
                      <div className="offer-category-icon-box">{cat.icon}</div>
                      <h2 className="offer-category-name">{cat.name}</h2>
                      <p className="offer-category-desc">{cat.description}</p>
                    </div>

                    <div className="offer-category-footer">
                      <span
                        className={`offer-category-count-badge ${
                          count > 0 ? 'has-requests' : 'zero-requests'
                        }`}
                      >
                        {count > 0 ? '🟢 ' : ''}
                        {count} {count === 1 ? 'Request' : 'Requests'}
                      </span>
                      <span className="offer-category-action-link">
                        Browse →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* -------------------------------------------------------------
            STEP 2: SHOW REQUESTS BELONGING TO CHOSEN CATEGORY
            ------------------------------------------------------------- */
        <>
          {/* Back Navigation & Breadcrumb */}
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <button
              onClick={() => handleSelectCategory(null)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              ← Back to All Categories
            </button>

            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Viewing category: <strong>{selectedCategoryObj?.name}</strong>
            </span>
          </div>

          {/* Active Category Header Banner */}
          <div className="offer-category-banner">
            <div className="offer-category-banner-left">
              <div className="offer-category-banner-icon">{selectedCategoryObj?.icon}</div>
              <div>
                <h1 style={{ margin: '0 0 4px', fontSize: '1.45rem' }}>{selectedCategoryObj?.name}</h1>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.92rem' }}>
                  {selectedCategoryObj?.description}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                className={`offer-category-count-badge ${
                  filteredCategoryRequests.length > 0 ? 'has-requests' : 'zero-requests'
                }`}
                style={{ fontSize: '0.9rem', padding: '6px 14px' }}
              >
                {filteredCategoryRequests.length}{' '}
                {filteredCategoryRequests.length === 1 ? 'Active Request' : 'Active Requests'}
              </span>
            </div>
          </div>

          {/* Category Switcher Pills */}
          <div className="offer-category-pills-bar">
            {OFFER_HELP_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              const isActive = cat.id === selectedCategoryId;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`offer-category-pill ${isActive ? 'active' : ''}`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className="pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Toolbar (Urgency & Sort) */}
          <div className="filter-bar" style={{ marginTop: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter By:</label>

            <select
              value={filters.urgency}
              onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
            >
              <option value="">All Urgency Levels</option>
              <option value="Normal">Normal Urgency</option>
              <option value="High">High Urgency</option>
              <option value="Urgent">Urgent / Emergency</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              style={{ marginLeft: 'auto' }}
            >
              <option value="relevance">🎯 Best Match (Rule-based Score)</option>
              <option value="newest">⏱️ Newest First</option>
              <option value="urgency">🚨 Highest Urgency</option>
            </select>
          </div>

          {/* Requests Grid */}
          {rawRequests === null ? (
            <LoadingSpinner />
          ) : filteredCategoryRequests.length === 0 ? (
            <EmptyState
              message={`No active requests currently found under "${selectedCategoryObj?.name}" in ${userCommunity}.`}
              icon={selectedCategoryObj?.icon || '🔍'}
              action={
                <button
                  onClick={() => handleSelectCategory(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '12px' }}
                >
                  ← Browse Other Categories
                </button>
              }
            />
          ) : (
            <div className="requests-grid">
              {filteredCategoryRequests.map((r) => (
                <RequestCard
                  key={r._id}
                  request={r}
                  showMatchReasons={true}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
