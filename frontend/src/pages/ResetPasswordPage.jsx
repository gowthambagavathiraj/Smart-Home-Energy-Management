import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import './AuthPages.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1=enter code, 2=enter new password
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [particles, setParticles] = useState([]);
  const inputRefs = useRef([]);
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

  const handleCodeChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pasted.every(c => /\d/.test(c))) {
      const newCode = [...pasted, ...Array(6).fill('')].slice(0, 6);
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) { setError('Please enter the full 6-digit code'); return; }

    setLoading(true);
    try {
      await authService.verifyResetCode(email, fullCode);
      setStep(2);
      setError('');
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) { setError('Please enter a new password'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!/^[a-zA-Z0-9]+$/.test(newPassword)) { setError('Password must contain only letters and numbers'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await authService.resetPassword(email, code.join(''), newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
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
            {success ? (
              <div className="success-state">
                <div className="success-icon">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" stroke="#22c55e" strokeWidth="1.5"/>
                    <path d="M7 12.5l3.5 3.5L17 9" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 style={{ color: '#fff', margin: '1rem 0 0.5rem' }}>Password Reset!</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                  Your password has been successfully updated.<br/>Redirecting to sign in...
                </p>
              </div>
            ) : (
              <>
                <div className="back-btn-wrapper">
                  <Link to="/forgot-password" className="back-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    Back
                  </Link>
                </div>

                {/* Step indicators */}
                <div className="step-indicators">
                  <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
                    <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
                    <span>Verify Code</span>
                  </div>
                  <div className={`step-connector-indicator ${step >= 2 ? 'active' : ''}`} />
                  <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
                    <div className="step-circle">2</div>
                    <span>New Password</span>
                  </div>
                </div>

                {step === 1 ? (
                  <>
                    <div className="form-header" style={{ marginTop: '1.5rem' }}>
                      <h2 className="form-title">Enter Reset Code</h2>
                      <p className="form-subtitle">
                        We sent a 6-digit code to<br/>
                        <strong style={{ color: '#4fc3f7' }}>{email}</strong>
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

                    <form onSubmit={handleVerifyCode} className="auth-form">
                      <div className="otp-container">
                        {code.map((digit, index) => (
                          <input
                            key={index}
                            ref={el => inputRefs.current[index] = el}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleCodeChange(index, e.target.value)}
                            onKeyDown={e => handleCodeKeyDown(index, e)}
                            onPaste={handleCodePaste}
                            className={`otp-input ${digit ? 'otp-filled' : ''}`}
                          />
                        ))}
                      </div>

                      <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? (
                          <span className="btn-loading"><span className="spinner"/>Verifying...</span>
                        ) : (
                          <><span>Verify Code</span><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></>
                        )}
                      </button>

                      <p className="redirect-text">
                        Didn't receive the code?{' '}
                        <Link to="/forgot-password" className="redirect-link">Resend</Link>
                      </p>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="form-header" style={{ marginTop: '1.5rem' }}>
                      <h2 className="form-title">New Password</h2>
                      <p className="form-subtitle">Create a strong new password</p>
                    </div>

                    {error && (
                      <div className="error-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleResetPassword} className="auth-form">
                      <div className="input-group">
                        <label className="input-label">New Password</label>
                        <div className="input-wrapper">
                          <span className="input-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1h.02c1.71 0 3.1 1.39 3.1 3.1v2z"/>
                            </svg>
                          </span>
                          <input
                            type={showPwd ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => { setNewPassword(e.target.value); setError(''); }}
                            placeholder="Letters and numbers only"
                            className="auth-input"
                          />
                          <button type="button" className="toggle-password" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d={showPwd ? "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" : "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"}/>
                            </svg>
                          </button>
                        </div>
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
                            type="password"
                            value={confirmPassword}
                            onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                            placeholder="Repeat new password"
                            className="auth-input"
                          />
                        </div>
                      </div>

                      <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? (
                          <span className="btn-loading"><span className="spinner"/>Resetting...</span>
                        ) : (
                          <><span>Reset Password</span><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
