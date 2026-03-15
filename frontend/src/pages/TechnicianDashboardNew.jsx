import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { technicianService } from '../services/technicianService';
import { authService } from '../services/authService';
import './Dashboard.css';

const TechnicianDashboardNew = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [devicesHealth, setDevicesHealth] = useState([]);
  const [installationRequests, setInstallationRequests] = useState([]);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, healthData, installationData] = await Promise.all([
        technicianService.getUsers(),
        technicianService.getDevicesHealth(),
        technicianService.getInstallationRequests(),
      ]);
      const homeowners = Array.isArray(usersData) ? usersData.filter(u => u.role === 'HOMEOWNER') : [];
      setUsers(homeowners);
      setDevicesHealth(Array.isArray(healthData) ? healthData : []);
      setInstallationRequests(Array.isArray(installationData) ? installationData : []);
      setAllDevices(Array.isArray(healthData) ? healthData : []);
    } catch (err) {
      setError(err.message || 'Failed to load technician dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileSave = async () => {
    setError('');
    setProfileSaving(true);
    try {
      const response = await authService.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
      });
      updateUser({
        firstName: response.firstName,
        lastName: response.lastName,
      });
      setShowProfileModal(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm('Delete your account? This action cannot be undone.');
    if (!confirmDelete) return;
    try {
      await authService.deleteAccount();
      logout();
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to delete account');
    }
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user]);

  const deviceStats = useMemo(() => {
    const online = allDevices.filter((d) => d.status === 'ON').length;
    const offline = allDevices.filter((d) => d.status !== 'ON').length;
    return { online, offline, total: allDevices.length };
  }, [allDevices]);

  const statsCards = [
    { label: 'Total Users', value: users.length, sub: 'Registered homeowners', icon: '👥', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Total Assigned Devices', value: deviceStats.total, sub: 'Devices you monitor', icon: '📱', color: '#4fc3f7', bg: 'rgba(79,195,247,0.1)' },
    { label: 'Devices Online', value: deviceStats.online, sub: 'Active right now', icon: '✅', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Devices Offline', value: deviceStats.offline, sub: 'Needs attention', icon: '⚠️', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  ];

  const renderOverview = () => {
    const userDeviceMap = {};
    allDevices.forEach(device => {
      if (!userDeviceMap[device.userId]) {
        userDeviceMap[device.userId] = [];
      }
      userDeviceMap[device.userId].push(device);
    });

    return (
      <div className="dash-panels">
        <div className="panel panel-full">
          <div className="panel-head">
            <h2 className="panel-title">Registered Users</h2>
            <span className="panel-badge">{users.length} users</span>
          </div>
          <div className="device-control-list">
            {users.map((user) => {
              const userDevices = userDeviceMap[user.id] || [];
              return (
                <div key={user.id} className="device-control-row">
                  <div className="device-control-meta">
                    <span className="device-control-icon">👤</span>
                    <div>
                      <div className="device-control-name">{user.firstName} {user.lastName}</div>
                      <div className="device-control-sub">{user.email} • {userDevices.length} devices</div>
                    </div>
                  </div>
                  <div className="device-control-actions">
                    <span className={`device-control-status ${user.active ? 'status-on' : 'status-off'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              );
            })}
            {users.length === 0 && <p className="muted">No users found</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderDevices = () => {
    const userDeviceMap = {};
    allDevices.forEach(device => {
      if (!userDeviceMap[device.userId]) {
        userDeviceMap[device.userId] = [];
      }
      userDeviceMap[device.userId].push(device);
    });

    return (
      <div className="dash-panels">
        <div className="panel panel-full">
          <div className="panel-head">
            <h2 className="panel-title">All Assigned Devices</h2>
            <span className="panel-badge">{deviceStats.total} total</span>
          </div>
          <div className="device-control-list">
            {users.map((user) => {
              const userDevices = userDeviceMap[user.id] || [];
              const isExpanded = expandedUsers[user.id];
              return (
                <div key={user.id}>
                  <div className="device-control-row" style={{ background: 'rgba(79,195,247,0.05)', cursor: 'pointer' }} onClick={() => toggleUser(user.id)}>
                    <div className="device-control-meta">
                      <span className="device-control-icon">👤</span>
                      <div>
                        <div className="device-control-name">{user.firstName} {user.lastName}</div>
                        <div className="device-control-sub">{user.email} • {userDevices.length} devices</div>
                      </div>
                    </div>
                    <div className="device-control-actions">
                      <span className="device-control-monitor">{isExpanded ? '▼' : '▶'}</span>
                      <button className="device-control-toggle" onClick={(e) => { e.stopPropagation(); navigate(`/technician/users/${user.id}/dashboard`); }}>
                        View Dashboard
                      </button>
                    </div>
                  </div>
                  {isExpanded && userDevices.map((device) => (
                    <div key={device.deviceId} className="device-control-row" style={{ marginLeft: '2rem', background: 'rgba(255,255,255,0.02)' }}>
                      <div className="device-control-meta">
                        <span className="device-control-icon">{device.deviceType === 'AC' ? '❄️' : device.deviceType === 'Light' ? '💡' : '⚡'}</span>
                        <div>
                          <div className="device-control-name">{device.deviceName}</div>
                          <div className="device-control-sub">{device.deviceType} • {device.room || 'No room'}</div>
                        </div>
                      </div>
                      <div className="device-control-actions">
                        <span className={`device-control-status ${device.status === 'ON' ? 'status-on' : 'status-off'}`}>
                          {device.status === 'ON' ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {users.length === 0 && <p className="muted">No users found</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderDeviceHealth = () => {
    const userHealthMap = {};
    devicesHealth.forEach(device => {
      if (!userHealthMap[device.userId]) {
        userHealthMap[device.userId] = [];
      }
      userHealthMap[device.userId].push(device);
    });

    return (
      <div className="dash-panels">
        <div className="panel panel-full">
          <div className="panel-head">
            <h2 className="panel-title">Device Health Status</h2>
            <span className="panel-badge">{devicesHealth.length} devices</span>
          </div>
          <div className="device-control-list">
            {users.map((user) => {
              const userDevices = userHealthMap[user.id] || [];
              const isExpanded = expandedUsers[user.id];
              if (userDevices.length === 0) return null;
              return (
                <div key={user.id}>
                  <div className="device-control-row" style={{ background: 'rgba(79,195,247,0.05)', cursor: 'pointer' }} onClick={() => toggleUser(user.id)}>
                    <div className="device-control-meta">
                      <span className="device-control-icon">👤</span>
                      <div>
                        <div className="device-control-name">{user.firstName} {user.lastName}</div>
                        <div className="device-control-sub">{user.email} • {userDevices.length} devices</div>
                      </div>
                    </div>
                    <div className="device-control-actions">
                      <span className="device-control-monitor">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  </div>
                  {isExpanded && userDevices.map((device) => {
                    const isHighCurrent = device.current > 10;
                    const isHighPower = device.power > 2000;
                    const hasWarning = isHighCurrent || isHighPower;
                    return (
                      <div key={device.deviceId} className="device-control-row" style={{ marginLeft: '2rem', background: hasWarning ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.02)' }}>
                        <div className="device-control-meta">
                          <span className="device-control-icon">{device.deviceType === 'AC' ? '❄️' : device.deviceType === 'Light' ? '💡' : '⚡'}</span>
                          <div>
                            <div className="device-control-name">{device.deviceName}</div>
                            <div className="device-control-sub">
                              {hasWarning ? (
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                  ⚠️ HIGH ENERGY CONSUMPTION - {isHighCurrent ? 'High Current' : ''} {isHighPower ? 'High Power' : ''}
                                </span>
                              ) : (
                                <span style={{ color: '#22c55e' }}>Normal consumption</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="device-control-actions">
                          <span className={`device-control-status ${device.healthStatus === 'Healthy' ? 'status-on' : 'status-off'}`}>
                            {device.healthStatus}
                          </span>
                          {hasWarning && <span className="device-control-monitor" style={{ background: '#ef4444', color: '#fff' }}>WARNING</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {devicesHealth.length === 0 && <p className="muted">No device health data</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderInstallation = () => (
    <div className="dash-panels">
      <div className="panel panel-full">
        <div className="panel-head">
          <h2 className="panel-title">Installation Requests</h2>
          <span className="panel-badge">{installationRequests.length} pending</span>
        </div>
        <div className="device-control-list">
          {installationRequests.map((req) => {
            const isExpanded = expandedUsers[req.userId];
            return (
              <div key={req.userId}>
                <div className="device-control-row" style={{ background: 'rgba(139,92,246,0.05)', cursor: 'pointer' }} onClick={() => toggleUser(req.userId)}>
                  <div className="device-control-meta">
                    <span className="device-control-icon">👤</span>
                    <div>
                      <div className="device-control-name">{req.userName}</div>
                      <div className="device-control-sub">{req.userEmail} • Requested: {new Date(req.requestDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="device-control-actions">
                    <span className="device-control-monitor">{isExpanded ? '▼' : '▶'}</span>
                    <button className="device-control-toggle" onClick={(e) => { e.stopPropagation(); navigate(`/technician/users/${req.userId}/dashboard`); }}>
                      View Dashboard
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="device-control-row" style={{ marginLeft: '2rem', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="device-control-meta">
                      <span className="device-control-icon">🏗️</span>
                      <div>
                        <div className="device-control-name">Installation Details</div>
                        <div className="device-control-sub">
                          Device Type: {req.requestedDeviceType} • Address: {req.address} • Status: {req.status}
                        </div>
                      </div>
                    </div>
                    <div className="device-control-actions">
                      <button className="device-control-toggle">Assign</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {installationRequests.length === 0 && <p className="muted">No installation requests</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="text"
                  value={user?.email}
                  disabled
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-save" onClick={handleProfileSave} disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="modal-btn modal-btn-delete" onClick={handleDeleteAccount}>
                Delete Account
              </button>
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowProfileModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
            <div className="sidebar-brand-sub">Technician Console</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'devices', label: 'Devices', icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' },
            { id: 'health', label: 'Device Health', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
            { id: 'installation', label: 'Installation', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {item.icon.split(' M').map((d, i) => <path key={i} d={i === 0 ? d : `M${d}`} />)}
              </svg>
              <span>{item.label}</span>
              {activeTab === item.id && <div className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={() => setShowProfileModal(true)} style={{ cursor: 'pointer' }}>
            <div className="user-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
            <div className="user-info">
              <div className="user-name">{user?.firstName} {user?.lastName}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="dash-header">
          <div>
            <h1 className="dash-welcome">Good Afternoon, {user?.firstName}!</h1>
            <p className="dash-date">
              {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </header>

        {error && <div className="error-alert">{error}</div>}
        {loading && <div className="loading-inline">Loading dashboard...</div>}

        {!loading && activeTab === 'overview' && (
          <>
            <div className="stats-grid">
              {statsCards.map((stat, idx) => (
                <div key={idx} className="stat-card" style={{ background: stat.bg, border: `1px solid ${stat.color}40` }}>
                  <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>{stat.icon}</div>
                  <div>
                    <div className="stat-val" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="stat-lbl">{stat.label}</div>
                    <div className="stat-sub">{stat.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            {renderOverview()}
          </>
        )}

        {!loading && activeTab === 'devices' && renderDevices()}
        {!loading && activeTab === 'health' && renderDeviceHealth()}
        {!loading && activeTab === 'installation' && renderInstallation()}
      </main>
    </div>
  );
};

export default TechnicianDashboardNew;
