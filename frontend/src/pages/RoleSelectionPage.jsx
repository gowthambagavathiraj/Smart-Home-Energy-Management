import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const RoleSelectionPage = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.selectRole(selectedRole);
      login(response.token, response.user);
      
      if (response.user.role === 'TECHNICIAN') {
        navigate('/technician/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to select role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <h1 className="auth-title">Select Your Role</h1>
          <p className="auth-subtitle">Choose how you want to use SmartHome</p>
        </div>

        {error && (
          <div className="error-message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {error}
          </div>
        )}

        <div className="role-selection-container">
          <div 
            className={`role-card ${selectedRole === 'HOMEOWNER' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('HOMEOWNER')}
          >
            <div className="role-icon">🏠</div>
            <h3 className="role-title">Homeowner</h3>
            <p className="role-description">
              Manage your smart home devices, monitor energy usage, and control your home automation
            </p>
            <div className="role-features">
              <div className="role-feature">✓ Device Management</div>
              <div className="role-feature">✓ Energy Monitoring</div>
              <div className="role-feature">✓ Automation & Schedules</div>
            </div>
          </div>

          <div 
            className={`role-card ${selectedRole === 'TECHNICIAN' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('TECHNICIAN')}
          >
            <div className="role-icon">🔧</div>
            <h3 className="role-title">Technician</h3>
            <p className="role-description">
              Monitor and maintain smart home systems for multiple users and provide technical support
            </p>
            <div className="role-features">
              <div className="role-feature">✓ Multi-User Management</div>
              <div className="role-feature">✓ Device Health Monitoring</div>
              <div className="role-feature">✓ Installation Support</div>
            </div>
          </div>
        </div>

        <button 
          className="auth-button"
          onClick={handleRoleSelection}
          disabled={loading || !selectedRole}
        >
          {loading ? 'Processing...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
