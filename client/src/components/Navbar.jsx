import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { profile, firebaseUser, logout, isAdmin, isSenior } = useAuth();
  const navigate = useNavigate();

  const isAuthenticated = !!profile;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const communityLabel = profile?.community || profile?.neighborhood;
  const cityLabel = profile?.city;

  return (
    <header className="navbar">
      <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-brand">
        <span>🏘️</span>
        <div>
          <strong>NeighborLink</strong>
        </div>
      </Link>

      {isAuthenticated && communityLabel && (
        <span className="community-badge" title="Your registered neighborhood community">
          📍 {communityLabel}{cityLabel ? `, ${cityLabel}` : ''}
        </span>
      )}

      <nav className="navbar-links">
        {isAuthenticated ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/requests">🌱 Offer Help</NavLink>
            <NavLink to="/activities">Activities</NavLink>
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
            <NotificationBell />
            <Link to="/profile" className="navbar-profile">
              <span>{isSenior ? '👵/👴' : '👤'}</span>
              <span>{profile?.fullName ? profile.fullName.split(' ')[0] : 'Profile'}</span>
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
