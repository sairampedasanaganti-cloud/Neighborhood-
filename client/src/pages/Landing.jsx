import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <span className="community-badge" style={{ marginBottom: '16px', display: 'inline-block' }}>
          🏘️ Smart Neighborhood Mutual-Aid Platform
        </span>
        <h1>NeighborLink</h1>
        <p className="landing-hero-tagline">Connect. Help. Belong.</p>
        <p style={{ fontStyle: 'italic', color: '#0f766e', fontWeight: 600, marginBottom: '12px' }}>
          "Your neighborhood is more than just the place where you live."
        </p>
        <p className="landing-hero-lead">
          Sometimes you need a helping hand. Sometimes you just need someone to be there.
          NeighborLink connects you with people in your community for both.
        </p>

        <div className="landing-actions">
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started
          </Link>
          <Link to="/login" className="btn btn-ghost btn-lg">
            Login
          </Link>
        </div>
      </section>

      <section style={{ maxWidth: '960px', margin: '0 auto 60px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '28px' }}>
          Three Ways Neighbors Connect
        </h2>

        <div className="pillars-grid">
          <div className="pillar-card">
            <span className="pillar-icon">🤝</span>
            <h3>Need Help</h3>
            <p>
              Ask for everyday assistance from people nearby. Whether it's subject tutoring for teenagers,
              household errands for working adults, or medicine delivery for senior citizens, your neighbors are here to support you.
            </p>
          </div>

          <div className="pillar-card">
            <span className="pillar-icon">🧑🤝🧑</span>
            <h3>Find Companionship</h3>
            <p>
              Loneliness shouldn't exist in a vibrant neighborhood. Find company for an evening walk,
              a friendly chat over tea, a study session, or a game of chess. Genuine human connection right next door.
            </p>
          </div>

          <div className="pillar-card">
            <span className="pillar-icon">🌱</span>
            <h3>Offer Help</h3>
            <p>
              There is no permanent volunteer role. Every registered neighbor is a Community Member.
              You might request help today and offer help to another neighbor tomorrow whenever your schedule allows.
            </p>
          </div>
        </div>
      </section>

      <section style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '36px', maxWidth: '960px', margin: '0 auto 60px', textAlign: 'center' }}>
        <h3>Built for Every Generation</h3>
        <p style={{ maxWidth: '680px', margin: '8px auto 24px' }}>
          NeighborLink adapts to your age group — providing safe study environments for teenagers,
          convenient coordination for adults, and a high-contrast, large-button, simplified interface for senior citizens (60+).
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span className="chip-btn">Teenagers (10–17)</span>
          <span className="chip-btn">Young Adults (18–25)</span>
          <span className="chip-btn">Adults (26–59)</span>
          <span className="chip-btn">Senior Citizens (60+)</span>
        </div>
      </section>
    </div>
  );
}
