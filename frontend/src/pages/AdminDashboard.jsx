import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import './Dashboard.css';

const roles = ['HOMEOWNER', 'TECHNICIAN', 'ADMIN'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [time, setTime] = useState(new Date());
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: 'HOMEOWNER', active: true });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResult, statsResult] = await Promise.allSettled([
        adminService.getUsers(),
        adminService.getStats(),
      ]);

      if (usersResult.status === 'fulfilled') {
        setUsers(Array.isArray(usersResult.value) ? usersResult.value : []);
      } else {
        throw usersResult.reason;
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value || null);
      } else {
        setStats(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const startEdit = (targetUser) => {
    setEditingId(targetUser.id);
    setEditForm({
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      role: targetUser.role,
      active: Boolean(targetUser.active),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await adminService.updateUser(editingId, editForm);
      setEditingId(null);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  };

  const deleteUser = async (targetUser) => {
    const confirmDelete = window.confirm(`Delete ${targetUser.firstName} ${targetUser.lastName}? This cannot be undone.`);
    if (!confirmDelete) return;
    try {
      await adminService.deleteUser(targetUser.id);
      if (editingId === targetUser.id) {
        setEditingId(null);
      }
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

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

  const filteredUsers = useMemo(
    () => users.filter((u) => u.role !== 'ADMIN'),
    [users]
  );

  const totalUsers = stats ? Math.max(0, stats.totalUsers - stats.adminCount) : filteredUsers.length;
  const totalTechnicians = stats ? stats.technicianCount : users.filter((u) => u.role === 'TECHNICIAN').length;
  const totalDevices = stats ? stats.totalDevices : 0;
  const totalEnergyUsage = stats ? stats.totalEnergyUsage : 0;

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
            <div className="sidebar-brand-sub">Admin Console</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span>User Management</span>
            <div className="nav-indicator" />
          </button>
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
            <h1 className="dash-welcome">Good {time.getHours() < 12 ? 'Morning' : time.getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.firstName}!</h1>
            <p className="dash-date">
              {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </header>

        {error && <div className="error-alert">{error}</div>}
        {loading && <div className="loading-inline">Loading...</div>}

        {!loading && (
          <>
            <div className="stats-grid">
              <div className="stat-card" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.4)' }}>
                <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>👥</div>
                <div className="stat-info">
                  <div className="stat-val" style={{ color: '#8b5cf6' }}>{totalUsers}</div>
                  <div className="stat-lbl">Total Users</div>
                  <div className="stat-sub">Registered homeowners</div>
                </div>
              </div>
              <div className="stat-card" style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.4)' }}>
                <div className="stat-icon" style={{ background: 'rgba(79,195,247,0.1)', color: '#4fc3f7' }}>🔧</div>
                <div className="stat-info">
                  <div className="stat-val" style={{ color: '#4fc3f7' }}>{totalTechnicians}</div>
                  <div className="stat-lbl">Total Technicians</div>
                  <div className="stat-sub">Active technicians</div>
                </div>
              </div>
              <div className="stat-card" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)' }}>
                <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>📱</div>
                <div className="stat-info">
                  <div className="stat-val" style={{ color: '#22c55e' }}>{totalDevices}</div>
                  <div className="stat-lbl">Total Devices</div>
                  <div className="stat-sub">All registered devices</div>
                </div>
              </div>
              <div className="stat-card" style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.4)' }}>
                <div className="stat-icon" style={{ background: 'rgba(251,146,60,0.1)', color: '#fb923c' }}>⚡</div>
                <div className="stat-info">
                  <div className="stat-val" style={{ color: '#fb923c' }}>{Number(totalEnergyUsage).toFixed(2)} kWh</div>
                  <div className="stat-lbl">Total Energy Usage</div>
                  <div className="stat-sub">System-wide consumption</div>
                </div>
              </div>
            </div>

            <div className="dash-panels">
              <div className="panel panel-full">
                <div className="panel-head">
                  <h2 className="panel-title">User Management</h2>
                  <span className="panel-badge">{filteredUsers.length} accounts</span>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td>
                            {editingId === u.id ? (
                              <div className="inline-fields">
                                <input
                                  value={editForm.firstName}
                                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                />
                                <input
                                  value={editForm.lastName}
                                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                />
                              </div>
                            ) : `${u.firstName} ${u.lastName}`}
                          </td>
                          <td>{u.email}</td>
                          <td>
                            {editingId === u.id ? (
                              <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              >
                                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                              </select>
                            ) : u.role}
                          </td>
                          <td>
                            {editingId === u.id ? (
                              <select
                                value={editForm.active ? 'ACTIVE' : 'INACTIVE'}
                                onChange={(e) => setEditForm({ ...editForm, active: e.target.value === 'ACTIVE' })}
                              >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                              </select>
                            ) : (u.active ? 'ACTIVE' : 'INACTIVE')}
                          </td>
                          <td>
                            {editingId === u.id ? (
                              <div className="inline-actions">
                                <button className="save-btn" onClick={saveEdit}>Save</button>
                                <button className="cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                                <button className="delete-btn" onClick={() => deleteUser(u)}>Delete</button>
                              </div>
                            ) : (
                              <div className="inline-actions">
                                <button 
                                  className="view-dashboard-btn-small" 
                                  onClick={() => {
                                    if (u.role === 'TECHNICIAN') {
                                      navigate('/technician/dashboard');
                                    } else {
                                      navigate(`/admin/users/${u.id}/dashboard`);
                                    }
                                  }}
                                >
                                  View Dashboard
                                </button>
                                <button className="edit-btn" onClick={() => startEdit(u)}>Edit</button>
                                <button className="delete-btn" onClick={() => deleteUser(u)}>Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
