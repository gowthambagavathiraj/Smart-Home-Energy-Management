import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './AuthPages.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'HOMEOWNER'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [particles, setParticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const generated = Array.from({ length: 25 }, (_, i) => ({
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

  useEffect(() => {
    const pwd = formData.password;
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    setPasswordStrength(Math.min(strength, 4));
  }, [formData.password]);

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    else if (!/^[a-zA-Z0-9]+$/.test(formData.password)) newErrors.password = 'Password must contain only letters and numbers';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.role) newErrors.role = 'Please select a role';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
    if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      setVerificationEmail(formData.email);
      setVerificationRequired(true);
      setVerificationMessage(response.message || 'Verification code sent to your email.');
    } catch (err) {
      setErrors({ submit: err.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Enter the 6-digit verification code');
      return;
    }

    setVerificationLoading(true);
    setVerificationError('');
    try {
      const response = await authService.verifyEmail(verificationEmail, verificationCode);
      setSuccess(true);
      setVerificationRequired(false);
      setVerificationMessage(response.message || 'Email verified successfully.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setVerificationError(err.message || 'Verification failed. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setVerificationLoading(true);
    setVerificationError('');
    try {
      const response = await authService.resendVerification(verificationEmail);
      setVerificationMessage(response.message || 'Verification code sent.');
    } catch (err) {
      setVerificationError(err.message || 'Failed to resend verification code.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

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

      <div className="auth-card-wrapper register-layout">
        {/* Left panel */}
        <div className="auth-panel-left">
          <div className="brand-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 4L8 20V44L32 60L56 44V20L32 4Z" stroke="url(#grad1)" strokeWidth="2" fill="none"/>
                <path d="M32 16L20 24V40L32 48L44 40V24L32 16Z" fill="url(#grad2)" opacity="0.3"/>
                <circle cx="32" cy="32" r="6" fill="url(#grad1)"/>
                <path d="M32 26V20M38 29L44 26M38 35L44 38M32 38V44M26 35L20 38M26 29L20 26" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="grad1" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4fc3f7"/>
                    <stop offset="100%" stopColor="#00e5ff"/>
                  </linearGradient>
                  <linearGradient id="grad2" x1="20" y1="16" x2="44" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4fc3f7"/>
                    <stop offset="100%" stopColor="#00e5ff"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-name">SmartHome</span>
              <span className="brand-subtitle">Energy Management</span>
            </div>
          </div>

          <div className="panel-content">
            <h1 className="panel-headline">Welcome to<br /><span className="highlight-text">SmartHome</span></h1>
            <p className="panel-description">
              Start your energy journey with smart monitoring, automation, and insights.
            </p>
            <div className="feature-list">
              {[
                '“What gets measured gets managed.”',
                '“Save power today, secure energy tomorrow.”',
                '“Efficiency is the cheapest energy.”',
                '“Smart use is sustainable use.”',
              ].map((f, i) => (
                <div key={i} className="feature-item" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="feature-dot" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-steps">
            <div className="step active"><span>1</span> Create Account</div>
            <div className="step-connector active" />
            <div className="step"><span>2</span> Set Up Home</div>
            <div className="step-connector" />
            <div className="step"><span>3</span> Go Live</div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="auth-panel-right">
          <div className="auth-form-container">
            {success ? (
              <div className="success-state">
                <div className="success-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" stroke="#22c55e" strokeWidth="2"/>
                    <path d="M7 12.5l3.5 3.5L17 9" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2>Account Created!</h2>
                <p>{verificationMessage || 'Email verified. Redirecting to sign in...'}</p>
                <div className="redirect-bar">
                  <div className="redirect-progress" />
                </div>
              </div>
            ) : verificationRequired ? (
              <div>
                <div className="form-header">
                  <h2 className="form-title">Verify Your Email</h2>
                  <p className="form-subtitle">{verificationMessage || `We sent a code to ${verificationEmail}`}</p>
                </div>

                {verificationError && (
                  <div className="error-banner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {verificationError}
                  </div>
                )}

                <form onSubmit={handleVerifyEmail} className="auth-form">
                  <div className="input-group">
                    <label className="input-label">Verification Code</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.93V12H5V6.3l7-3.11v8.8z"/>
                        </svg>
                      </span>
                      <input
                        type="text"
                        maxLength="6"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit code"
                        className="auth-input"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="submit-btn" disabled={verificationLoading}>
                    {verificationLoading ? 'Verifying...' : 'Verify Email'}
                  </button>

                  <button
                    type="button"
                    className="google-btn"
                    onClick={handleResendVerification}
                    disabled={verificationLoading}
                  >
                    Resend Code
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="form-header">
                  <h2 className="form-title">Create Account</h2>
                  <p className="form-subtitle">Fill in your details to get started</p>
                </div>

                {errors.submit && (
                  <div className="error-banner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {errors.submit}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">

                  {/* ===== ROLE SELECTOR ===== */}
                  <div className="input-group">
                    <label className="input-label">I am a...</label>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                      {/* Homeowner Card */}
                      <div
                        onClick={() => handleRoleSelect('HOMEOWNER')}
                        style={{
                          flex: 1,
                          padding: '16px 12px',
                          borderRadius: '12px',
                          border: formData.role === 'HOMEOWNER'
                            ? '2px solid #00e5ff'
                            : '2px solid rgba(255,255,255,0.1)',
                          background: formData.role === 'HOMEOWNER'
                            ? 'rgba(0, 229, 255, 0.08)'
                            : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: formData.role === 'HOMEOWNER'
                            ? '0 0 16px rgba(0,229,255,0.15)'
                            : 'none',
                        }}
                      >
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏠</div>
                        <div style={{
                          color: formData.role === 'HOMEOWNER' ? '#00e5ff' : 'rgba(255,255,255,0.8)',
                          fontWeight: '600',
                          fontSize: '14px',
                          marginBottom: '4px',
                        }}>
                          Homeowner
                        </div>
                        <div style={{
                          color: 'rgba(255,255,255,0.45)',
                          fontSize: '11px',
                          lineHeight: '1.4',
                        }}>
                          Manage your smart home & devices
                        </div>
                        {formData.role === 'HOMEOWNER' && (
                          <div style={{
                            marginTop: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: '#00e5ff',
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="#000">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Technician Card */}
                      <div
                        onClick={() => handleRoleSelect('TECHNICIAN')}
                        style={{
                          flex: 1,
                          padding: '16px 12px',
                          borderRadius: '12px',
                          border: formData.role === 'TECHNICIAN'
                            ? '2px solid #00e5ff'
                            : '2px solid rgba(255,255,255,0.1)',
                          background: formData.role === 'TECHNICIAN'
                            ? 'rgba(0, 229, 255, 0.08)'
                            : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: formData.role === 'TECHNICIAN'
                            ? '0 0 16px rgba(0,229,255,0.15)'
                            : 'none',
                        }}
                      >
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔧</div>
                        <div style={{
                          color: formData.role === 'TECHNICIAN' ? '#00e5ff' : 'rgba(255,255,255,0.8)',
                          fontWeight: '600',
                          fontSize: '14px',
                          marginBottom: '4px',
                        }}>
                          Technician
                        </div>
                        <div style={{
                          color: 'rgba(255,255,255,0.45)',
                          fontSize: '11px',
                          lineHeight: '1.4',
                        }}>
                          Service homes & install devices
                        </div>
                        {formData.role === 'TECHNICIAN' && (
                          <div style={{
                            marginTop: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: '#00e5ff',
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="#000">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    {errors.role && <span className="field-error">{errors.role}</span>}
                  </div>
                  {/* ===== END ROLE SELECTOR ===== */}

                  <div className="input-row">
                    <div className="input-group">
                      <label className="input-label">First Name</label>
                      <div className="input-wrapper">
                        <span className="input-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </span>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="John"
                          className={`auth-input ${errors.firstName ? 'input-error' : ''}`}
                        />
                      </div>
                      {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                    </div>

                    <div className="input-group">
                      <label className="input-label">Last Name</label>
                      <div className="input-wrapper">
                        <span className="input-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </span>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Doe"
                          className={`auth-input ${errors.lastName ? 'input-error' : ''}`}
                        />
                      </div>
                      {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                    </div>
                  </div>

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
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className={`auth-input ${errors.email ? 'input-error' : ''}`}
                      />
                    </div>
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1h.02c1.71 0 3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Letters and numbers only"
                        className={`auth-input ${errors.password ? 'input-error' : ''}`}
                      />
                      <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="password-strength">
                        <div className="strength-bars">
                          {[1, 2, 3, 4].map(i => (
                            <div
                              key={i}
                              className="strength-bar"
                              style={{ background: i <= passwordStrength ? strengthColors[passwordStrength] : 'rgba(255,255,255,0.1)' }}
                            />
                          ))}
                        </div>
                        <span className="strength-label" style={{ color: strengthColors[passwordStrength] }}>
                          {strengthLabels[passwordStrength]}
                        </span>
                      </div>
                    )}
                    {errors.password && <span className="field-error">{errors.password}</span>}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Confirm Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1h.02c1.71 0 3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                      </span>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repeat your password"
                        className={`auth-input ${errors.confirmPassword ? 'input-error' : ''}`}
                      />
                      <button type="button" className="toggle-password" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                        {showConfirm ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (
                      <span className="btn-loading">
                        <span className="spinner" />
                        Creating Account...
                      </span>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                        </svg>
                      </>
                    )}
                  </button>

                  <div className="divider">
                    <span className="divider-line" />
                    <span className="divider-text">or sign up with</span>
                    <span className="divider-line" />
                  </div>

                  <button type="button" className="google-btn" onClick={() => authService.googleLogin()}>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Register with Google
                  </button>
                </form>

                <p className="redirect-text">
                  Already have an account?{' '}
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

export default RegisterPage;
