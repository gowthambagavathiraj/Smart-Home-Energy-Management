import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { technicianService } from '../services/technicianService';
import './TechnicianDashboard.css';

const chartLabels = ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];

const formatTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDevices: 0,
    installations: 0,
    totalEnergyUsage: 0,
    adminCount: 0,
    homeownerCount: 0,
    technicianCount: 0,
  });
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [time, setTime] = useState(new Date());
  const [activeView, setActiveView] = useState('overview');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, usersData] = await Promise.all([
        technicianService.getStats(),
        technicianService.getUsers(),
      ]);
      setStats(statsData);
      const normalizedUsers = Array.isArray(usersData) ? usersData : [];
      setUsers(normalizedUsers);

      const homeownerUsers = normalizedUsers.filter((u) => u.role === 'HOMEOWNER');
      const deviceTargets = homeownerUsers.slice(0, 6);
      const deviceGroups = await Promise.all(
        deviceTargets.map((u) => technicianService.getUserDevices(u.id).catch(() => []))
      );
      const flattenedDevices = deviceGroups.flat();
      setDevices(flattenedDevices);

      const alertTargets = homeownerUsers.slice(0, 6);
      const alertGroups = await Promise.all(
        alertTargets.map((u) =>
          technicianService.getUserNotifications(u.id)
            .then((items) => (Array.isArray(items) ? items : []).map((n) => ({
              ...n,
              userId: u.id,
              userName: `${u.firstName} ${u.lastName}`.trim(),
            })))
            .catch(() => [])
        )
      );
      const mergedAlerts = alertGroups.flat();
      const maintenanceAlerts = mergedAlerts.filter((a) => (a.type || '').toUpperCase() === 'ALERT');
      setAlerts(maintenanceAlerts);

      if (homeownerUsers.length > 0) {
        const targetUser = homeownerUsers[0];
        const consumption = await technicianService.getUserConsumption(targetUser.id, 'hourly', 12).catch(() => null);
        const points = Array.isArray(consumption?.points) ? consumption.points : [];
        setChartData(points);
      } else {
        setChartData([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load technician dashboard');
    } finally {
      setLoading(false);
    }
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

  const deviceStatus = useMemo(() => {
    const online = devices.filter((d) => d.status === 'ON');
    const offline = devices.filter((d) => d.status !== 'ON');
    const sensorError = alerts.filter(
      (a) => (a.title || '').toLowerCase().includes('sensor') || (a.message || '').toLowerCase().includes('sensor')
    );
    return { online, offline, sensorError };
  }, [devices, alerts]);

  const installationRequests = useMemo(() => {
    const userDeviceCount = new Map();
    devices.forEach((d) => {
      userDeviceCount.set(d.userId, (userDeviceCount.get(d.userId) || 0) + 1);
    });
    return users.filter((u) => u.role === 'HOMEOWNER' && !userDeviceCount.get(u.id)).slice(0, 6);
  }, [users, devices]);

  const userById = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const chartValues = useMemo(() => {
    if (chartData.length === 0) {
      return chartLabels.map((label) => ({ label, energyUsed: 0 }));
    }
    return chartData.map((point, index) => ({
      label: point.label || chartLabels[index] || `#${index + 1}`,
      energyUsed: point.energyUsed || 0,
    }));
  }, [chartData]);

  const maxChartValue = Math.max(...chartValues.map((item) => item.energyUsed), 0);
  const chartHeights = chartValues.map((item) => {
    if (maxChartValue <= 0) return 6;
    return Math.max(6, Math.round((item.energyUsed / maxChartValue) * 90));
  });

  const selectedDeviceOwner = selectedDevice ? userById.get(selectedDevice.userId) : null;

  return (
    <div className="tech-page">
      <header className="tech-header">
        <div className="tech-brand">
          <div className="tech-logo">🔧</div>
          <div>
            <h1>SmartHome Energy Hub</h1>
            <p>Technician Console</p>
          </div>
        </div>
        <div className="tech-actions">
          <div className="tech-meta">
            <div className="tech-name">{user?.firstName} {user?.lastName}</div>
            <div className="tech-time">
              {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
          <button onClick={handleLogout} className="danger-btn">Logout</button>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {loading && <div className="admin-loading">Loading...</div>}

      {!loading && (
        <>
          <section className="tech-stats">
            <div className="tech-stat-card">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-sub">Registered users</div>
            </div>
            <div className="tech-stat-card">
              <div className="stat-label">Total Assigned Devices</div>
              <div className="stat-value">{devices.length || stats.totalDevices}</div>
              <div className="stat-sub">Devices you monitor</div>
            </div>
            <div className="tech-stat-card">
              <div className="stat-label">Devices Online</div>
              <div className="stat-value">{deviceStatus.online.length}</div>
              <div className="stat-sub">Online right now</div>
            </div>
            <div className="tech-stat-card">
              <div className="stat-label">Devices Offline</div>
              <div className="stat-value">{deviceStatus.offline.length}</div>
              <div className="stat-sub">Needs attention</div>
            </div>
            <div className="tech-stat-card">
              <div className="stat-label">Installation Requests</div>
              <div className="stat-value">{installationRequests.length}</div>
              <div className="stat-sub">Pending installs</div>
            </div>
            <div className="tech-stat-card">
              <div className="stat-label">Maintenance Requests</div>
              <div className="stat-value">{alerts.length}</div>
              <div className="stat-sub">Reported issues</div>
            </div>
          </section>

          <section className="tech-filter">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'devices', label: 'Devices' },
              { id: 'health', label: 'Device Health' },
              { id: 'maintenance', label: 'Maintenance Requests' },
              { id: 'offline', label: 'Offline Requests' },
              { id: 'installation', label: 'Installation Requests' },
            ].map((item) => (
              <button
                key={item.id}
                className={`filter-btn ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </section>

          {activeView === 'devices' && (
            <section className="tech-grid">
              <div className="tech-panel">
                <div className="panel-head">
                  <h3>Device Monitoring</h3>
                  <span>View • Diagnose • Restart</span>
                </div>
                <div className="panel-list">
                  {devices.slice(0, 12).map((d) => {
                    const owner = userById.get(d.userId);
                    const ownerName = owner ? `${owner.firstName} ${owner.lastName}`.trim() : 'Unknown user';
                    return (
                      <div key={d.id} className="panel-row row-grid">
                        <div>
                          <div className="row-title">{d.name}</div>
                          <div className="row-sub">{d.room || 'Unknown room'} • User: {ownerName}</div>
                        </div>
                        <span className={`pill ${d.status === 'ON' ? 'ok' : 'warn'}`}>
                          {d.status === 'ON' ? 'Online' : 'Offline'}
                        </span>
                        <div className="row-actions">
                          <button
                            className="mini-btn"
                            onClick={() => d.userId && navigate(`/technician/users/${d.userId}/dashboard`)}
                          >
                            View Data
                          </button>
                          <button className="mini-btn ghost" onClick={() => setSelectedDevice(d)}>
                            Open
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {devices.length === 0 && <div className="panel-row muted-row">No assigned devices.</div>}
                </div>
              </div>

              <div className="tech-panel">
                <div className="panel-head">
                  <h3>Total Assigned Devices</h3>
                  <span>Live status</span>
                </div>
                <div className="panel-list">
                  <div className="panel-row">
                    <span>Devices Online</span>
                    <span className="pill ok">{deviceStatus.online.length}</span>
                  </div>
                  <div className="panel-row">
                    <span>Devices Offline</span>
                    <span className="pill warn">{deviceStatus.offline.length}</span>
                  </div>
                </div>
                <div className="panel-list">
                  {deviceStatus.online.slice(0, 4).map((d) => {
                    const owner = userById.get(d.userId);
                    return (
                      <div key={`online-${d.id}`} className="panel-row row-grid">
                        <div>
                          <div className="row-title">{d.name}</div>
                          <div className="row-sub">{owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown user'}</div>
                        </div>
                        <span className="pill ok">Online</span>
                      </div>
                    );
                  })}
                  {deviceStatus.offline.slice(0, 4).map((d) => {
                    const owner = userById.get(d.userId);
                    return (
                      <div key={`offline-${d.id}`} className="panel-row row-grid">
                        <div>
                          <div className="row-title">{d.name}</div>
                          <div className="row-sub">{owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown user'}</div>
                        </div>
                        <span className="pill warn">Offline</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {selectedDevice && activeView === 'devices' && (
            <section className="tech-grid">
              <div className="tech-panel panel-full">
                <div className="panel-head">
                  <h3>Device Monitoring</h3>
                  <span>{selectedDevice.name} • {selectedDevice.room || 'Unknown room'}</span>
                </div>
                <div className="panel-list">
                  <div className="panel-row row-grid">
                    <div>
                      <div className="row-title">User</div>
                      <div className="row-sub">
                        {selectedDeviceOwner ? `${selectedDeviceOwner.firstName} ${selectedDeviceOwner.lastName}` : 'Unknown user'}
                      </div>
                    </div>
                    <span className={`pill ${selectedDevice.status === 'ON' ? 'ok' : 'warn'}`}>
                      {selectedDevice.status === 'ON' ? 'Online' : 'Offline'}
                    </span>
                    <div className="row-actions">
                      <button className="mini-btn ghost" onClick={() => setSelectedDevice(null)}>
                        Close
                      </button>
                      <button className="mini-btn">Diagnose</button>
                      <button className="mini-btn ghost">Restart</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {(activeView === 'overview' || activeView === 'installation') && (
            <section className="tech-grid">
            <div className="tech-panel">
              <div className="panel-head">
                <h3>Installation Requests</h3>
                <span>Assign • Install</span>
              </div>
              <div className="panel-list">
                {installationRequests.map((u) => (
                  <div key={u.id} className="panel-row row-grid">
                    <div>
                      <div className="row-title">{u.firstName} {u.lastName}</div>
                      <div className="row-sub">Smart Plug • {u.firstName}'s Home</div>
                    </div>
                    <span className="pill neutral">Pending</span>
                    <div className="row-actions">
                      <button className="mini-btn">Assign</button>
                      <button className="mini-btn ghost">Install</button>
                    </div>
                  </div>
                ))}
                {installationRequests.length === 0 && <div className="panel-row muted-row">No installation requests.</div>}
              </div>
            </div>

            <div className="tech-panel">
              <div className="panel-head">
                <h3>Maintenance Requests</h3>
                <span>Investigate • Resolve</span>
              </div>
              <div className="panel-list">
                {alerts.slice(0, 5).map((a) => (
                  <div key={a.id} className="panel-row row-grid">
                    <div>
                      <div className="row-title">{a.title || 'Device issue reported'}</div>
                      <div className="row-sub">{a.message || 'Needs inspection'} • {a.userName || 'Unknown user'}</div>
                    </div>
                    <span className="pill danger">Open</span>
                    <div className="row-actions">
                      <button className="mini-btn ghost">Investigate</button>
                      <button className="mini-btn danger">Resolve</button>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && <div className="panel-row muted-row">No maintenance requests.</div>}
              </div>
            </div>
          </section>
          )}

          {(activeView === 'overview' || activeView === 'health' || activeView === 'offline' || activeView === 'maintenance') && (
            <section className="tech-grid">
            <div className="tech-panel">
              <div className="panel-head">
                <h3>Sensor Data Analytics</h3>
                <span>Voltage • Current • Power</span>
              </div>
              <div className="health-grid">
                <div className="health-card">
                  <div>Voltage</div>
                  <strong>230 V</strong>
                </div>
                <div className="health-card">
                  <div>Current</div>
                  <strong>6.5 A</strong>
                </div>
                <div className="health-card">
                  <div>Power</div>
                  <strong>1500 W</strong>
                </div>
                <div className="health-card">
                  <div>Sensor Status</div>
                  <strong>{deviceStatus.sensorError.length > 0 ? 'Warning' : 'OK'}</strong>
                </div>
              </div>
            </div>

            <div className="tech-panel">
              <div className="panel-head">
                <h3>Offline Device Alerts</h3>
                <span>Requires attention</span>
              </div>
              <div className="panel-list">
                {deviceStatus.offline.slice(0, 5).map((d) => {
                  const owner = userById.get(d.userId);
                  const ownerName = owner ? `${owner.firstName} ${owner.lastName}`.trim() : 'Unknown user';
                  return (
                    <div key={d.id} className="panel-row row-grid">
                      <div>
                        <div className="row-title">{d.name}</div>
                        <div className="row-sub">{d.room || 'Unknown room'} • {ownerName} • Last seen {formatTime(d.updatedAt)}</div>
                      </div>
                      <span className="pill warn">Offline</span>
                      <div className="row-actions">
                        <button
                          className="mini-btn"
                          onClick={() => d.userId && navigate(`/technician/users/${d.userId}/dashboard`)}
                        >
                          Investigate
                        </button>
                      </div>
                    </div>
                  );
                })}
                {deviceStatus.offline.length === 0 && <div className="panel-row muted-row">No offline devices.</div>}
              </div>
            </div>
          </section>
          )}

          {activeView === 'devices' && (
            <section className="tech-grid">
              <div className="tech-panel panel-full">
                <div className="panel-head">
                  <h3>Device Power Usage (Live)</h3>
                  <span>Hourly trend</span>
                </div>
                <div className="chart-area">
                  <div className="chart-bars">
                    {chartValues.map((item, i) => (
                      <div key={item.label} className="chart-bar-group">
                        <div
                          className="chart-bar"
                          style={{
                            height: `${chartHeights[i]}%`,
                            background:
                              i === chartHeights.indexOf(Math.max(...chartHeights))
                                ? 'linear-gradient(180deg, #00e5ff, #4fc3f7)'
                                : 'linear-gradient(180deg, rgba(79,195,247,0.6), rgba(79,195,247,0.2))',
                          }}
                        />
                        <span className="bar-label">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default TechnicianDashboard;
