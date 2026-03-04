import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import './AdminDashboard.css';

const roles = ['HOMEOWNER', 'TECHNICIAN', 'ADMIN'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, loggedInUsers: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: 'HOMEOWNER', active: true });

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, usersData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
      ]);
      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      setError(err.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
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
      await loadAdminData();
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
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Signed in as {user?.email}</p>
        </div>
        <div className="admin-actions">
          <button onClick={() => navigate('/dashboard')} className="ghost-btn">User View</button>
          <button onClick={handleLogout} className="danger-btn">Logout</button>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {loading && <div className="admin-loading">Loading...</div>}

      {!loading && (
        <>
          <section className="admin-stats">
            <div className="admin-stat-card">
              <h3>Total Users</h3>
              <p>{stats.totalUsers}</p>
            </div>
            <div className="admin-stat-card">
              <h3>Active Users</h3>
              <p>{stats.activeUsers}</p>
            </div>
            <div className="admin-stat-card">
              <h3>Users Logged In</h3>
              <p>{stats.loggedInUsers}</p>
            </div>
          </section>

          <section className="admin-users">
            <h2>Manage Users</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Login Count</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
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
                      <td>{u.loginCount || 0}</td>
                      <td>
                        {editingId === u.id ? (
                          <div className="inline-actions">
                            <button className="save-btn" onClick={saveEdit}>Save</button>
                            <button className="cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                            <button className="delete-btn" onClick={() => deleteUser(u)}>Delete</button>
                          </div>
                        ) : (
                          <div className="inline-actions">
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
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
