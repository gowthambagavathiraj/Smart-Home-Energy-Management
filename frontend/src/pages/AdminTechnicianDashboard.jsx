import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import './Dashboard.css';

const AdminTechnicianDashboard = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();
  const [technicianData, setTechnicianData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTechnicianData = async () => {
      try {
        setLoading(true);
        // Load technician user data
        const userData = await adminService.getUser(userId);
        setTechnicianData(userData);
      } catch (err) {
        setError(err.message || 'Failed to load technician data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadTechnicianData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-inline">Loading technician dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-alert">{error}</div>
        <button onClick={() => navigate('/admin/dashboard')}>Back to Admin Dashboard</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
              <path d="M20 2L4 12V28L20 38L36 28V12L20 2Z" stroke="url(#sGrad)" strokeWidth="1.5" fill="none" />
              <circle cx="20" cy="20" r="5" fill="url(#sGrad)" />
              <path d="M20 15V10M24.33 17.5L29 15M24.33 22.5L29 25M20 25V30M15.67 22.5L11 25M15.67 17.5L11 15" stroke="url(#sGrad)" strokeWidth="1.2" strokeLinecap="round" />
              <defs>
                <linearGradient id="sGrad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4fc3f7" />
                  <stop offset="100%" stopColor="#00e5ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="sidebar-brand-name">SmartHome</div>
            <div className="sidebar-brand-sub">Admin View</div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button
            className="admin-back-btn"
            onClick={() => navigate('/admin/dashboard')}
          >
            Back to Admin Dashboard
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="dash-header">
          <div>
            <h1 className="dash-welcome">
              Viewing Technician: {technicianData?.firstName} {technicianData?.lastName}
            </h1>
            <p className="dash-date">
              Email: {technicianData?.email} • Role: {technicianData?.role}
            </p>
          </div>
        </header>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Technician Information</h2>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Name</div>
                <div style={{ color: '#fff', fontSize: '1rem' }}>{technicianData?.firstName} {technicianData?.lastName}</div>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Email</div>
                <div style={{ color: '#fff', fontSize: '1rem' }}>{technicianData?.email}</div>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Role</div>
                <div style={{ color: '#fff', fontSize: '1rem' }}>{technicianData?.role}</div>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Status</div>
                <div style={{ color: technicianData?.active ? '#22c55e' : '#ef4444', fontSize: '1rem', fontWeight: 600 }}>
                  {technicianData?.active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Note</h2>
          </div>
          <div style={{ padding: '1.5rem', color: 'rgba(255,255,255,0.7)' }}>
            <p>This is a read-only view of the technician's profile. To see the technician's full dashboard with their assigned users and devices, the technician must log in to their own account.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminTechnicianDashboard;
