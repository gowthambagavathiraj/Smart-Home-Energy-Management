import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './AuthPages.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [particles, setParticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const generated = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 10 + 8,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setParticles(generated);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address'); return; }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      // Redirect to reset password page with email after 2 seconds
      setTimeout(() => navigate(`/reset-password?email=${encodeURIComponent(email)}`), 2500);
    } catch (err) {
      setError(err.message || 'Email not found. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="particle-field">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>
      <div className="circuit-overlay" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="auth-card-wrapper single-panel">
        <div className="auth-panel-right full-width-panel">
          <div className="auth-form-container">
            {sent ? (
              <div className="success-state">
                <div className="email-sent-animation">
                  <div className="email-icon-wrapper">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="2" stroke="#4fc3f7" strokeWidth="1.5"/>
                      <path d="M2 8l10 6 10-6" stroke="#4fc3f7" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="18" cy="6" r="3" fill="#22c55e"/>
                    </svg>
                  </div>
                </div>
                <h2 style={{ color: '#fff', margin: '1rem 0 0.5rem' }}>Email Sent!</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                  A 6-digit reset code has been sent to<br/>
                  <strong style={{ color: '#4fc3f7' }}>{email}</strong>
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Redirecting to reset page...
                </p>
              </div>
            ) : (
              <>
                <div className="back-btn-wrapper">
                  <Link to="/login" className="back-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    Back to Sign In
                  </Link>
                </div>

                <div className="forgot-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" stroke="url(#iconGrad)" strokeWidth="1.5"/>
                    <path d="M12 8v4M12 16h.01" stroke="url(#iconGrad)" strokeWidth="2" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="iconGrad" x1="1" y1="1" x2="23" y2="23" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#4fc3f7"/>
                        <stop offset="100%" stopColor="#00e5ff"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="form-header" style={{ marginTop: '1rem' }}>
                  <h2 className="form-title">Forgot Password?</h2>
                  <p className="form-subtitle">
                    Enter your email and we'll send you a 6-digit reset code
                  </p>
                </div>

                {error && (
                  <div className="error-banner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        placeholder="Enter your registered email"
                        className="auth-input"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (
                      <span className="btn-loading">
                        <span className="spinner" />
                        Sending Code...
                      </span>
                    ) : (
                      <>
                        <span>Send Reset Code</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <p className="redirect-text">
                  Remember your password?{' '}
                  <Link to="/login" className="redirect-link">Sign In</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
