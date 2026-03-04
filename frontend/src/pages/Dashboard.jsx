import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deviceService } from '../services/deviceService';
import { energyService } from '../services/energyService';
import './Dashboard.css';

const chartLabels = ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const deviceIcon = (type) => {
  const icons = {
    AC: '❄️',
    Light: '💡',
    Refrigerator: '🧊',
    'Water Heater': '🔥',
    TV: '📺',
    'Washing Machine': '🧺',
    Microwave: '🍳',
    Fan: '🌀',
    Heater: '♨️',
    Other: '⚡',
  };
  return icons[type] || '⚡';
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [time, setTime] = useState(new Date());
  const [devices, setDevices] = useState([]);
  const [logsByDevice, setLogsByDevice] = useState({});
  const [realtimeUsage, setRealtimeUsage] = useState(null);
  const [consumptionPeriod, setConsumptionPeriod] = useState('hourly');
  const [consumptionData, setConsumptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const points = consumptionPeriod === 'daily' ? 7 : 12;
      const [allDevices, liveUsage, consumption] = await Promise.all([
        deviceService.getAllDevices(),
        energyService.getRealtimeUsage(),
        energyService.getConsumption(consumptionPeriod, points),
      ]);

      setDevices(Array.isArray(allDevices) ? allDevices : []);
      setRealtimeUsage(liveUsage);
      setConsumptionData(consumption);

      const logEntries = await Promise.all(
        (Array.isArray(allDevices) ? allDevices : []).map(async (device) => {
          const logs = await deviceService.getEnergyLogs(device.id);
          return [device.id, Array.isArray(logs) ? logs : []];
        })
      );

      const nextLogs = {};
      logEntries.forEach(([deviceId, logs]) => {
        nextLogs[deviceId] = logs;
      });
      setLogsByDevice(nextLogs);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [consumptionPeriod]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const liveUsage = await energyService.getRealtimeUsage();
        setRealtimeUsage(liveUsage);
      } catch (err) {
        // Keep silent to avoid noisy UX during transient API hiccups.
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const toggleDevice = async (id) => {
    try {
      await deviceService.toggleDevice(id);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to toggle device');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allLogs = useMemo(() => Object.values(logsByDevice).flat(), [logsByDevice]);

  const todayString = new Date().toDateString();
  const todayLogs = useMemo(
    () =>
      allLogs.filter((log) => {
        if (!log.timestamp) return false;
        return new Date(log.timestamp).toDateString() === todayString;
      }),
    [allLogs, todayString]
  );

  const todayEnergyUsed = useMemo(
    () => todayLogs.reduce((sum, log) => sum + toNumber(log.energyUsed), 0),
    [todayLogs]
  );

  const totalCostToday = useMemo(
    () => todayLogs.reduce((sum, log) => sum + toNumber(log.cost), 0),
    [todayLogs]
  );

  const hourlyBuckets = useMemo(() => {
    const buckets = new Array(12).fill(0);
    todayLogs.forEach((log) => {
      if (!log.timestamp) return;
      const hour = new Date(log.timestamp).getHours();
      const slot = Math.floor(hour / 2);
      buckets[slot] += toNumber(log.energyUsed);
    });
    return buckets;
  }, [todayLogs]);

  const maxHourly = Math.max(...hourlyBuckets, 0);
  const normalizedHeights = hourlyBuckets.map((val) => {
    if (maxHourly <= 0) return 4;
    return Math.max(4, Math.round((val / maxHourly) * 90));
  });

  const activeDevicesCount = devices.filter((d) => d.status === 'ON').length;
  const totalPowerAllDevices = devices.reduce((sum, d) => sum + toNumber(d.powerRating), 0);
  const totalPowerActiveDevices = devices
    .filter((d) => d.status === 'ON')
    .reduce((sum, d) => sum + toNumber(d.powerRating), 0);
  const monthlySavingsPercent =
    devices.length > 0 ? Math.round(((devices.length - activeDevicesCount) / devices.length) * 100) : 0;
  const co2ReducedToday = todayEnergyUsed * 0.82;

  const liveTotalPower = toNumber(realtimeUsage?.totalPowerKw);
  const chartPoints = Array.isArray(consumptionData?.points) ? consumptionData.points : [];
  const chartMax = Math.max(...chartPoints.map((p) => toNumber(p.energyUsed)), 0);
  const chartHeights = chartPoints.map((point) => {
    if (chartMax <= 0) return 4;
    return Math.max(4, Math.round((toNumber(point.energyUsed) / chartMax) * 90));
  });
  const chartPeakIndex = chartHeights.length > 0 ? chartHeights.indexOf(Math.max(...chartHeights)) : -1;

  const stats = [
    {
      label: 'Current Usage',
      value: `${(liveTotalPower || totalPowerActiveDevices).toFixed(2)} kW`,
      sub:
        activeDevicesCount === 0
          ? `All devices OFF • Installed ${totalPowerAllDevices.toFixed(2)} kW`
          : 'Live total from IoT simulation',
      icon: '⚡',
      color: '#4fc3f7',
      bg: 'rgba(79,195,247,0.1)',
    },
    {
      label: 'Monthly Savings',
      value: `${monthlySavingsPercent}%`,
      sub: 'Estimated from currently OFF devices',
      icon: '💰',
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.1)',
    },
    {
      label: 'CO₂ Reduced',
      value: `${co2ReducedToday.toFixed(2)} kg`,
      sub: 'Based on today energy logs',
      icon: '🌱',
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.1)',
    },
    {
      label: 'Active Devices',
      value: `${activeDevicesCount}/${devices.length}`,
      sub: 'Devices online',
      icon: '📡',
      color: '#fb923c',
      bg: 'rgba(251,146,60,0.1)',
    },
  ];

  const renderOverview = () => (
    <div className="dash-panels">
      <div className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Smart Devices</h2>
          <span className="panel-badge">{activeDevicesCount} active</span>
        </div>
        {devices.length === 0 ? (
          <div className="empty-inline">
            <p>No devices found. Add one from Devices page.</p>
            <button className="btn-inline" onClick={() => navigate('/devices')}>
              Go to Devices
            </button>
          </div>
        ) : (
          <div className="devices-grid">
            {devices.map((device) => (
              <div key={device.id} className={`device-card ${device.status === 'ON' ? 'device-on' : 'device-off'}`}>
                <div className="device-top">
                  <span className="device-emoji">{deviceIcon(device.type)}</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={device.status === 'ON'}
                      onChange={() => toggleDevice(device.id)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div className="device-name">{device.name}</div>
                <div className="device-power">
                  {device.status === 'ON' ? (
                    <>
                      <span className="power-dot active-dot" />
                      {toNumber(device.powerRating).toFixed(2)} kW
                    </>
                  ) : (
                    <>
                      <span className="power-dot" />
                      Standby
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Energy Usage Today</h2>
          <span className="panel-badge">Live</span>
        </div>
        <div className="chart-area">
          <div className="chart-bars">
            {chartLabels.map((label, i) => (
              <div key={label} className="chart-bar-group">
                <div
                  className="chart-bar"
                  style={{
                    height: `${normalizedHeights[i]}%`,
                    background:
                      i === normalizedHeights.indexOf(Math.max(...normalizedHeights))
                        ? 'linear-gradient(180deg, #00e5ff, #4fc3f7)'
                        : 'linear-gradient(180deg, rgba(79,195,247,0.6), rgba(79,195,247,0.2))',
                  }}
                />
                <span className="bar-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="insights-row">
          <div className="insight-chip">
            <span>📈</span>
            <div>
              <div className="insight-label">Energy Today</div>
              <div className="insight-value">{todayEnergyUsed.toFixed(2)} kWh</div>
            </div>
          </div>
          <div className="insight-chip">
            <span>💲</span>
            <div>
              <div className="insight-label">Cost Today</div>
              <div className="insight-value">${totalCostToday.toFixed(2)}</div>
            </div>
          </div>
          <div className="insight-chip">
            <span>📋</span>
            <div>
              <div className="insight-label">Logs Today</div>
              <div className="insight-value">{todayLogs.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="panel analytics-panel">
      <div className="panel-head">
        <h2 className="panel-title">Analytics</h2>
        <div className="period-switch">
          <button
            className={`period-btn ${consumptionPeriod === 'hourly' ? 'active' : ''}`}
            onClick={() => setConsumptionPeriod('hourly')}
          >
            Hourly
          </button>
          <button
            className={`period-btn ${consumptionPeriod === 'daily' ? 'active' : ''}`}
            onClick={() => setConsumptionPeriod('daily')}
          >
            Daily
          </button>
        </div>
      </div>
      <div className="chart-area">
        <div className="chart-bars">
          {(chartPoints.length > 0 ? chartPoints : chartLabels.map((label) => ({ label, energyUsed: 0 }))).map((point, i) => (
            <div key={`${point.label}-${i}`} className="chart-bar-group">
              <div
                className="chart-bar"
                style={{
                  height: `${chartPoints.length > 0 ? chartHeights[i] : 4}%`,
                  background:
                    i === chartPeakIndex
                      ? 'linear-gradient(180deg, #00e5ff, #4fc3f7)'
                      : 'linear-gradient(180deg, rgba(79,195,247,0.6), rgba(79,195,247,0.2))',
                }}
              />
              <span className="bar-label">{point.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="insights-row">
        <div className="insight-chip">
          <span>📈</span>
          <div>
            <div className="insight-label">Energy Today</div>
            <div className="insight-value">{toNumber(consumptionData?.totalEnergy ?? todayEnergyUsed).toFixed(2)} kWh</div>
          </div>
        </div>
        <div className="insight-chip">
          <span>💲</span>
          <div>
            <div className="insight-label">Cost Today</div>
            <div className="insight-value">${toNumber(consumptionData?.totalCost ?? totalCostToday).toFixed(2)}</div>
          </div>
        </div>
        <div className="insight-chip">
          <span>📋</span>
          <div>
            <div className="insight-label">Logs Today</div>
            <div className="insight-value">{todayLogs.length}</div>
          </div>
        </div>
      </div>

      <div className="analytics-summary">
        <div className="analytics-card">
          <div className="analytics-label">{consumptionPeriod === 'daily' ? 'Energy Used (7 Days)' : 'Energy Used (12 Hours)'}</div>
          <div className="analytics-value">{toNumber(consumptionData?.totalEnergy ?? todayEnergyUsed).toFixed(2)} kWh</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">{consumptionPeriod === 'daily' ? 'Estimated Cost (7 Days)' : 'Estimated Cost (12 Hours)'}</div>
          <div className="analytics-value">${toNumber(consumptionData?.totalCost ?? totalCostToday).toFixed(2)}</div>
        </div>
      </div>
      <div className="analytics-list">
        {devices.length === 0 && <p className="muted">No devices available.</p>}
        {devices.map((device) => {
          const logs = logsByDevice[device.id] || [];
          const deviceTodayEnergy = logs
            .filter((log) => log.timestamp && new Date(log.timestamp).toDateString() === todayString)
            .reduce((sum, log) => sum + toNumber(log.energyUsed), 0);
          return (
            <div key={device.id} className="analytics-row">
              <span>{device.name}</span>
              <span>{deviceTodayEnergy.toFixed(2)} kWh</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="panel settings-panel">
      <div className="panel-head">
        <h2 className="panel-title">Settings</h2>
      </div>
      <div className="settings-block">
        <div className="settings-title">Login Details</div>
        <div className="settings-row">
          <span>Name</span>
          <span>{user?.firstName} {user?.lastName}</span>
        </div>
        <div className="settings-row">
          <span>Email</span>
          <span>{user?.email}</span>
        </div>
        <div className="settings-row">
          <span>Provider</span>
          <span>{user?.provider || 'LOCAL'}</span>
        </div>
      </div>
      <button className="logout-btn settings-logout" onClick={handleLogout}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        <span>Log Out</span>
      </button>
    </div>
  );

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
            <div className="sidebar-brand-sub">Energy Hub</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'devices', label: 'Devices', icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' },
            { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'devices') {
                  navigate('/devices');
                  return;
                }
                setActiveTab(item.id);
              }}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {item.icon.split(' M').map((d, i) => <path key={i} d={i === 0 ? d : `M${d}`} />)}
              </svg>
              <span>{item.label}</span>
              {activeTab === item.id && <div className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
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
          {user?.role === 'ADMIN' && (
            <button className="admin-back-btn" onClick={() => navigate('/admin/dashboard')}>
              Back to Admin Dashboard
            </button>
          )}
        </header>

        {error && <div className="error-alert">{error}</div>}
        {loading && <div className="loading-inline">Loading dashboard...</div>}

        {!loading && activeTab === 'overview' && (
          <>
            <div className="stats-grid">
              {stats.map((s, i) => (
                <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                  <div className="stat-info">
                    <div className="stat-val" style={{ color: s.color }}>{s.value}</div>
                    <div className="stat-lbl">{s.label}</div>
                    <div className="stat-sub">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            {renderOverview()}
          </>
        )}

        {!loading && activeTab === 'analytics' && renderAnalytics()}
        {!loading && activeTab === 'settings' && renderSettings()}
      </main>
    </div>
  );
};

export default Dashboard;
