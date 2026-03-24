import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deviceService } from '../services/deviceService';
import { scheduleService } from '../services/scheduleService';
import './DevicesPage.css';

const DevicesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTechnician = user?.role === 'TECHNICIAN';
  const isDeactivated = user?.active === false;
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [scheduleDevice, setScheduleDevice] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    action: 'ON',
    time: '18:00',
    days: [],
    enabled: true,
  });
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    powerRating: '',
    room: '',
  });

  const deviceTypes = ['AC', 'Light', 'Refrigerator', 'Water Heater', 'TV', 'Washing Machine', 'Microwave', 'Fan', 'Heater', 'Other'];
  const rooms = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Garage', 'Office', 'Dining Room', 'Other'];
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await deviceService.getAllDevices();
      setDevices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (device = null) => {
    if (isDeactivated) {
      alert('Your account is deactivated. You cannot perform this operation.');
      return;
    }
    if (device) {
      setEditingDevice(device);
      setFormData({
        name: device.name,
        type: device.type,
        powerRating: device.powerRating,
        room: device.room || '',
      });
    } else {
      setEditingDevice(null);
      setFormData({ name: '', type: '', powerRating: '', room: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDevice(null);
    setFormData({ name: '', type: '', powerRating: '', room: '' });
    setError('');
  };

  const handleOpenSchedule = async (device) => {
    if (isDeactivated) {
      alert('Your account is deactivated. You cannot perform this operation.');
      return;
    }
    setScheduleDevice(device);
    setScheduleForm({ action: 'ON', time: '18:00', days: [], enabled: true });
    try {
      const data = await scheduleService.getSchedulesByDevice(device.id);
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load schedules');
    }
  };

  const handleCloseSchedule = () => {
    setScheduleDevice(null);
    setSchedules([]);
    setScheduleForm({ action: 'ON', time: '18:00', days: [], enabled: true });
  };


  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleDevice) return;
    try {
      const payload = {
        deviceId: scheduleDevice.id,
        action: scheduleForm.action,
        time: scheduleForm.time,
        daysOfWeek: scheduleForm.days.join(','),
        enabled: true,
      };
      await scheduleService.createSchedule(payload);
      const data = await scheduleService.getSchedulesByDevice(scheduleDevice.id);
      setSchedules(Array.isArray(data) ? data : []);
      setScheduleForm({ action: 'ON', time: '18:00', days: [], enabled: true });
    } catch (err) {
      setError(err.message || 'Failed to create schedule');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await scheduleService.deleteSchedule(id);
      const data = await scheduleService.getSchedulesByDevice(scheduleDevice.id);
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to delete schedule');
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (editingDevice) {
        await deviceService.updateDevice(editingDevice.id, formData);
      } else {
        await deviceService.createDevice(formData);
      }
      await fetchDevices();
      handleCloseModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (deviceId) => {
    if (isDeactivated) {
      alert('Your account is deactivated. You cannot perform this operation.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this device?')) return;
    
    try {
      await deviceService.deleteDevice(deviceId);
      await fetchDevices();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggle = async (deviceId) => {
    if (isDeactivated) {
      alert('Your account is deactivated. You cannot perform this operation.');
      return;
    }
    try {
      await deviceService.toggleDevice(deviceId);
      await fetchDevices();
    } catch (err) {
      setError(err.message);
    }
  };

  const getDeviceIcon = (type) => {
    const icons = {
      'AC': '❄️',
      'Light': '💡',
      'Refrigerator': '🧊',
      'Water Heater': '🔥',
      'TV': '📺',
      'Washing Machine': '🧺',
      'Microwave': '🍳',
      'Fan': '🌀',
      'Heater': '♨️',
      'Other': '⚡',
    };
    return icons[type] || '⚡';
  };

  if (loading) {
    return (
      <div className="devices-page">
        <div className="loading-state">
          <div className="spinner-large" />
          <p>Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="devices-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-wrap">
          <button className="back-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
          <h1 className="page-title">My Devices</h1>
          <p className="page-subtitle">Manage your smart home devices</p>
          </div>
        </div>
        {!isTechnician && !isDeactivated && (
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Device
          </button>
        )}
      </div>

      {isTechnician && (
        <div className="info-banner">
          Technician access is read-only. Device changes are disabled.
        </div>
      )}

      {isDeactivated && (
        <div className="deactivation-banner">
          ⚠️ Your account is deactivated. You cannot perform any CRUD operations until your account is reactivated.
        </div>
      )}

      {error && (
        <div className="error-alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </div>
      )}

      {/* Devices Grid */}
      {devices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <h3>No Devices Yet</h3>
          <p>Add your first smart home device to get started</p>
          <button className="btn-secondary" onClick={() => handleOpenModal()}>
            Add Your First Device
          </button>
        </div>
      ) : (
        <div className="devices-grid">
          {devices.map((device) => (
            <div key={device.id} className={`device-card ${device.status === 'ON' ? 'device-active' : ''}`}>
              <div className="device-card-header">
                <span className="device-icon">{getDeviceIcon(device.type)}</span>
                <div className="device-actions">
                  <button
                    className="icon-btn"
                    onClick={() => handleOpenModal(device)}
                    title="Edit device"
                    disabled={isTechnician || isDeactivated}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => handleDelete(device.id)}
                    title="Delete device"
                    disabled={isTechnician || isDeactivated}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => handleOpenSchedule(device)}
                    title="Schedule device"
                    disabled={isTechnician || isDeactivated}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8v5l4 2 .75-1.23-3.25-1.77V8H12zm0-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="device-card-body">
                <h3 className="device-name">{device.name}</h3>
                <div className="device-details">
                  <span className="device-type">{device.type}</span>
                  {device.room && <span className="device-room">📍 {device.room}</span>}
                </div>
                <div className="device-power">
                  <span className="power-label">Power Rating</span>
                  <span className="power-value">{device.powerRating} kW</span>
                </div>
              </div>

              <div className="device-card-footer">
                <div className="device-status">
                  <span className={`status-dot ${device.status === 'ON' ? 'status-on' : 'status-off'}`} />
                  <span className="status-text">{device.status}</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={device.status === 'ON'}
                    onChange={() => handleToggle(device.id)}
                    disabled={isTechnician || isDeactivated}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDevice ? 'Edit Device' : 'Add New Device'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Device Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Living Room AC"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="">Select Type</option>
                    {deviceTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Power Rating (kW) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="50"
                    value={formData.powerRating}
                    onChange={(e) => setFormData({ ...formData, powerRating: e.target.value })}
                    placeholder="e.g., 1.5"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Room (optional)</label>
                <select
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                >
                  <option value="">Select Room</option>
                  {rooms.map((room) => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingDevice ? 'Update Device' : 'Add Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleDevice && (
        <div className="modal-overlay" onClick={handleCloseSchedule}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule: {scheduleDevice.name}</h2>
              <button className="modal-close" onClick={handleCloseSchedule}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Action</label>
                  <select
                    value={scheduleForm.action}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, action: e.target.value })}
                  >
                    <option value="ON">ON</option>
                    <option value="OFF">OFF</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Days</label>
                <div className="days-grid">
                  {weekDays.map((day) => (
                    <label key={day} className={`day-pill ${scheduleForm.days.includes(day) ? 'active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={scheduleForm.days.includes(day)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...scheduleForm.days, day]
                            : scheduleForm.days.filter((d) => d !== day);
                          setScheduleForm({ ...scheduleForm, days: next });
                        }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseSchedule}>
                  Close
                </button>
                <button type="submit" className="btn-primary">Add Schedule</button>
              </div>
            </form>

            <div className="schedule-list">
              <h3>Existing Schedules</h3>
              {schedules.length === 0 && <p className="muted">No schedules created.</p>}
              {schedules.map((s) => (
                <div key={s.id} className="schedule-row">
                  <div>
                    <div className="schedule-title">{s.action} at {s.time}</div>
                    <div className="schedule-sub">{s.daysOfWeek || 'Everyday'}</div>
                  </div>
                  <div className="schedule-actions">
                    <span className="schedule-toggle on">Enabled</span>
                    <button className="schedule-delete" onClick={() => handleDeleteSchedule(s.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesPage;
