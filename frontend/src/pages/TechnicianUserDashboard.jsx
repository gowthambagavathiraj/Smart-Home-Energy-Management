import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { technicianService } from '../services/technicianService';
import Dashboard from './Dashboard';

const TechnicianUserDashboard = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      setError('');
      try {
        const user = await technicianService.getUser(userId);
        setTargetUser(user);
      } catch (err) {
        setError(err.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#070b14', color: '#4fc3f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading user dashboard...
      </div>
    );
  }

  if (error || !targetUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#070b14', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem' }}>
        <div>{error || 'User not found'}</div>
        <button onClick={() => navigate('/technician/dashboard')} style={{ border: '1px solid rgba(79,195,247,0.4)', background: 'transparent', color: '#4fc3f7', padding: '0.5rem 0.9rem', borderRadius: 8, cursor: 'pointer' }}>
          Back to Technician Dashboard
        </button>
      </div>
    );
  }

  return <Dashboard readOnly viewAsUser={targetUser} readOnlyMode="technician" />;
};

export default TechnicianUserDashboard;
