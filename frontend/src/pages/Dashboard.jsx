import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import { deviceService } from '../services/deviceService';
import { energyService } from '../services/energyService';
import { notificationService } from '../services/notificationService';
import { recommendationService } from '../services/recommendationService';
import { technicianService } from '../services/technicianService';
import './Dashboard.css';

const chartLabels = ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];
const RATE_PER_UNIT = 6; // Rs per kWh (from appliance cost table)
const DEVICE_POWER_MAP = {
  'ac (1.5 ton)': 1.5,
  ac: 1.5,
  'light (led)': 0.01,
  light: 0.01,
  refrigerator: 0.15,
  'water heater (geyser)': 2,
  'water heater': 2,
  geyser: 2,
  'tv (led)': 0.1,
  tv: 0.1,
  'washing machine': 0.5,
  microwave: 1.2,
  'microwave oven': 1.2,
  fan: 0.075,
  heater: 1.5,
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const buildCsv = (rows) => {
  const header = ['Label', 'Start', 'End', 'Energy (kWh)', 'Cost'];
  const lines = [header.join(',')];
  rows.forEach((row) => {
    lines.push([
      formatCsvValue(row.label),
      formatCsvValue(row.start),
      formatCsvValue(row.end),
      formatCsvValue(toNumber(row.energyUsed).toFixed(2)),
      formatCsvValue(toNumber(row.cost).toFixed(2)),
    ].join(','));
  });
  return lines.join('\n');
};

const downloadCsv = (filename, rows) => {
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

const isMonitorOnlyDevice = (device) => {
  const type = (device?.type || '').toLowerCase();
  const name = (device?.name || '').toLowerCase();
  return type.includes('sensor') || type.includes('meter') || name.includes('sensor') || name.includes('meter');
};

const resolveDevicePower = (device) => {
  const explicitRating = toNumber(device?.powerRating);
  if (explicitRating > 0) {
    return explicitRating;
  }
  const typeKey = (device?.type || '').toLowerCase();
  if (DEVICE_POWER_MAP[typeKey]) {
    return DEVICE_POWER_MAP[typeKey];
  }
  return 0;
};

const Dashboard = ({ readOnly = false, viewAsUser = null, readOnlyMode = 'admin' }) => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const viewAsUserId = viewAsUser?.id;
  const viewer = readOnly && viewAsUser ? viewAsUser : user;
  const [activeTab, setActiveTab] = useState('overview');
  const [time, setTime] = useState(new Date());
  const [devices, setDevices] = useState([]);
  const [logsByDevice, setLogsByDevice] = useState({});
  const [realtimeUsage, setRealtimeUsage] = useState(null);
  const [consumptionPeriod, setConsumptionPeriod] = useState('hourly');
  const [consumptionData, setConsumptionData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      if (readOnly && !viewAsUserId) {
        throw new Error('User not selected for admin view');
      }
      const points = consumptionPeriod === 'daily' ? 7 : 12;
      const readOnlyService = readOnlyMode === 'technician' ? technicianService : adminService;
      const [allDevices, liveUsage, consumption, analytics, notices, tips] = readOnly
        ? await Promise.all([
            readOnlyService.getUserDevices(viewAsUserId),
            readOnlyService.getUserRealtimeUsage(viewAsUserId),
            readOnlyService.getUserConsumption(viewAsUserId, consumptionPeriod, points),
            readOnlyService.getUserAnalytics(viewAsUserId),
            readOnlyService.getUserNotifications(viewAsUserId),
            readOnlyService.getUserRecommendations(viewAsUserId),
          ])
        : await Promise.all([
            deviceService.getAllDevices(),
            energyService.getRealtimeUsage(),
            energyService.getConsumption(consumptionPeriod, points),
            energyService.getAnalytics(),
            notificationService.getNotifications(),
            recommendationService.getRecommendations(),
          ]);

      setDevices(Array.isArray(allDevices) ? allDevices : []);
      setRealtimeUsage(liveUsage);
      setConsumptionData(consumption);
      setAnalyticsData(analytics);
      const normalizedNotices = Array.isArray(notices) ? notices : [];
      const normalizedTips = Array.isArray(tips) ? tips : [];
      const receivedAt = new Date().toISOString();
      setNotifications(normalizedNotices);
      setRecommendations(normalizedTips.map((tip) => ({ ...tip, receivedAt })));

      const logEntries = await Promise.all(
        (Array.isArray(allDevices) ? allDevices : []).map(async (device) => {
          const logs = readOnly
            ? await readOnlyService.getUserEnergyLogs(viewAsUserId, device.id)
            : await deviceService.getEnergyLogs(device.id);
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
  }, [consumptionPeriod, readOnly, viewAsUserId]);

  useEffect(() => {
    if (!viewer) return;
    setProfileForm({
      firstName: viewer.firstName || '',
      lastName: viewer.lastName || '',
    });
  }, [viewer]);


  const toggleDevice = async (id) => {
    if (readOnly) return;
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

  const handleProfileSave = async () => {
    setError('');
    if (readOnly) return;
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

  const handleMarkRead = async (id) => {
    if (readOnly) return;
    try {
      await notificationService.markRead(id);
      const next = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      setNotifications(next);
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  const allLogs = useMemo(() => Object.values(logsByDevice).flat(), [logsByDevice]);
  const alertCutoffMs = 4 * 60 * 60 * 1000;
  const alertCutoff = Date.now() - alertCutoffMs;
  const recentNotifications = useMemo(
    () =>
      notifications.filter((note) => {
        if (!note?.createdAt) return true;
        const createdAt = new Date(note.createdAt).getTime();
        return Number.isFinite(createdAt) && createdAt >= alertCutoff;
      }),
    [notifications, alertCutoff]
  );
  const recentRecommendations = useMemo(
    () =>
      recommendations.filter((tip) => {
        if (!tip?.receivedAt) return true;
        const createdAt = new Date(tip.receivedAt).getTime();
        return Number.isFinite(createdAt) && createdAt >= alertCutoff;
      }),
    [recommendations, alertCutoff]
  );

  const todayString = new Date().toDateString();
  const todayLogs = useMemo(
    () =>
      allLogs.filter((log) => {
        if (!log.timestamp) return false;
        return new Date(log.timestamp).toDateString() === todayString;
      }),
    [allLogs, todayString]
  );

  const last7DaysLogs = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return allLogs.filter((log) => {
      if (!log.timestamp) return false;
      return new Date(log.timestamp) >= start;
    });
  }, [allLogs]);

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

  const hourlyBucketsWeek = useMemo(() => {
    const buckets = new Array(24).fill(0);
    last7DaysLogs.forEach((log) => {
      if (!log.timestamp) return;
      const hour = new Date(log.timestamp).getHours();
      buckets[hour] += toNumber(log.energyUsed);
    });
    return buckets;
  }, [last7DaysLogs]);

  const hourlyWeekMax = Math.max(...hourlyBucketsWeek, 0);
  const hourlyWeekMin = Math.min(...hourlyBucketsWeek, 0);
  const hourlyWeekPeakIndex = hourlyWeekMax > 0 ? hourlyBucketsWeek.indexOf(hourlyWeekMax) : -1;
  const hourlyWeekOffPeakIndex = hourlyWeekMax > 0 ? hourlyBucketsWeek.indexOf(hourlyWeekMin) : -1;
  const hourlyWeekHeights = hourlyBucketsWeek.map((val) => {
    if (hourlyWeekMax <= 0) return 4;
    return Math.max(4, Math.round((val / hourlyWeekMax) * 90));
  });

  const maxHourly = Math.max(...hourlyBuckets, 0);
  const normalizedHeights = hourlyBuckets.map((val) => {
    if (maxHourly <= 0) return 4;
    return Math.max(4, Math.round((val / maxHourly) * 90));
  });

  const activeDevicesCount = devices.filter((d) => d.status === 'ON').length;
  const totalPowerAllDevices = devices.reduce((sum, d) => sum + resolveDevicePower(d), 0);
  const totalPowerActiveDevices = devices
    .filter((d) => d.status === 'ON')
    .reduce((sum, d) => sum + resolveDevicePower(d), 0);
  const monthlySavingsUnits = Math.max(0, totalPowerAllDevices - totalPowerActiveDevices) * 24 * 30;
  const monthlySavingsCost = monthlySavingsUnits * RATE_PER_UNIT;
  const monthlySavingsPercent =
    totalPowerAllDevices > 0 ? Math.round(((totalPowerAllDevices - totalPowerActiveDevices) / totalPowerAllDevices) * 100) : 0;
  const co2ReducedToday = todayEnergyUsed * 0.82;

  const currentHourEnergy = useMemo(() => {
    const now = new Date();
    return todayLogs
      .filter((log) => {
        if (!log.timestamp) return false;
        const ts = new Date(log.timestamp);
        return ts.getHours() === now.getHours();
      })
      .reduce((sum, log) => sum + toNumber(log.energyUsed), 0);
  }, [todayLogs]);

  const stats = [
    {
      label: 'Usage This Hour',
      value: `${currentHourEnergy.toFixed(2)} kWh`,
      sub: 'This hour energy used',
      icon: '⚡',
      color: '#4fc3f7',
      bg: 'rgba(79,195,247,0.1)',
    },
    {
      label: 'Monthly Savings',
      value: `₹${monthlySavingsCost.toFixed(2)}`,
      sub: `Total saving ${monthlySavingsUnits.toFixed(2)} kWh · ${monthlySavingsPercent}% potential if OFF devices stay OFF`,
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
            <p>{readOnly ? 'No devices found for this user.' : 'No devices found. Add one from Devices page.'}</p>
            {!readOnly && (
              <button className="btn-inline" onClick={() => navigate('/devices')}>
                Go to Devices
              </button>
            )}
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
                      disabled={readOnly}
                      onChange={readOnly ? undefined : () => toggleDevice(device.id)}
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
                <div className="device-action-row">
                  {device.status === 'ON' ? (
                    <button className="device-action-btn" disabled={readOnly} onClick={readOnly ? undefined : () => toggleDevice(device.id)}>
                      Turn Off
                    </button>
                  ) : (
                    <button className="device-action-btn" disabled={readOnly} onClick={readOnly ? undefined : () => toggleDevice(device.id)}>
                      Turn On
                    </button>
                  )}
                  <span className="device-action-pill">Monitor</span>
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
              <div className="insight-value">₹{totalCostToday.toFixed(2)}</div>
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

  const renderAlertsRecommendations = () => (
    <div className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Alerts & Recommendations</h2>
        <span className="panel-badge">{recentNotifications.filter((n) => !n.read).length} new</span>
      </div>
      <div className="alert-list">
        {recentNotifications.length === 0 && <p className="muted">No alerts yet.</p>}
        {recentNotifications.slice(0, 8).map((note) => (
          <div key={note.id} className={`alert-item ${note.read ? 'alert-read' : ''}`}>
            <div>
              <div className="alert-title">{note.title}</div>
              <div className="alert-message">{note.message}</div>
            </div>
            {!readOnly && !note.read && (
              <button className="alert-action" onClick={() => handleMarkRead(note.id)}>Mark Read</button>
            )}
          </div>
        ))}
      </div>
      <div className="tip-list">
        {recentRecommendations.length === 0 && <p className="muted">No recommendations available.</p>}
        {recentRecommendations.slice(0, 6).map((tip, idx) => (
          <div key={`${tip.title}-${idx}`} className="tip-item">
            <div className="tip-title">{tip.title}</div>
            <div className="tip-message">{tip.message}</div>
            {tip.savingsPercent > 0 && <div className="tip-savings">Save ~{tip.savingsPercent}%</div>}
          </div>
        ))}
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
      <div className="report-actions">
        <button
          className="report-btn"
          onClick={() => downloadCsv('daily-report.csv', analyticsData?.dailyPoints || [])}
        >
          Download Daily Report
        </button>
        <button
          className="report-btn"
          onClick={() => downloadCsv('weekly-report.csv', analyticsData?.weeklyPoints || [])}
        >
          Download Weekly Report
        </button>
        <button
          className="report-btn"
          onClick={() => downloadCsv('monthly-report.csv', analyticsData?.monthlyPoints || [])}
        >
          Download Monthly Report
        </button>
      </div>
      <div className="analytics-charts">
        <div className="analytics-chart">
          <div className="analytics-chart-title">Daily Trend (7 Days)</div>
          <div className="analytics-chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analyticsData?.dailyPoints || []}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid rgba(79,195,247,0.2)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="energyUsed" stroke="#00e5ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="analytics-chart">
          <div className="analytics-chart-title">Weekly Comparison (4 Weeks)</div>
          <div className="analytics-chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analyticsData?.weeklyPoints || []}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid rgba(79,195,247,0.2)', borderRadius: 8 }} />
                <Bar dataKey="energyUsed" fill="#4fc3f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="analytics-chart">
          <div className="analytics-chart-title">Monthly Usage (6 Months)</div>
          <div className="analytics-chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analyticsData?.monthlyPoints || []}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid rgba(79,195,247,0.2)', borderRadius: 8 }} />
                <Bar dataKey="energyUsed" fill="#00e5ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="hourly-pattern">
        <div className="analytics-chart-title">Peak vs Off-Peak (Hourly Pattern)</div>
        <div className="hourly-bars">
          {hourlyBucketsWeek.map((value, i) => (
            <div key={`hour-${i}`} className="hourly-bar-group">
              <div
                className={`hourly-bar ${i === hourlyWeekPeakIndex ? 'hourly-peak' : ''} ${i === hourlyWeekOffPeakIndex ? 'hourly-off-peak' : ''}`}
                style={{ height: `${hourlyWeekHeights[i]}%` }}
                title={`${i}:00 • ${toNumber(value).toFixed(2)} kWh`}
              />
              <span className="hourly-label">{i % 6 === 0 ? `${i}` : ''}</span>
            </div>
          ))}
        </div>
        <div className="hourly-legend">
          <span className="legend-item"><span className="legend-dot peak-dot" /> Peak</span>
          <span className="legend-item"><span className="legend-dot off-peak-dot" /> Off-Peak</span>
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
              <div className="insight-value">₹{toNumber(consumptionData?.totalCost ?? totalCostToday).toFixed(2)}</div>
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
          <div className="analytics-label">Energy Used (7 Days)</div>
          <div className="analytics-value">{toNumber(analyticsData?.totalEnergyLast7Days).toFixed(2)} kWh</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">Estimated Cost (7 Days)</div>
          <div className="analytics-value">₹{toNumber(analyticsData?.totalCostLast7Days).toFixed(2)}</div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-tile">
          <div className="analytics-tile-title">Week-over-Week</div>
          <div className="analytics-tile-value">
            {toNumber(analyticsData?.comparison?.deltaPercent).toFixed(2)}%
            <span className={`trend-badge trend-${analyticsData?.comparison?.trend?.toLowerCase() || 'flat'}`}>
              {analyticsData?.comparison?.trend || 'FLAT'}
            </span>
          </div>
          <div className="analytics-tile-sub">
            {toNumber(analyticsData?.comparison?.currentEnergy).toFixed(2)} kWh vs {toNumber(analyticsData?.comparison?.previousEnergy).toFixed(2)} kWh
          </div>
        </div>
        <div className="analytics-tile">
          <div className="analytics-tile-title">Cost Prediction</div>
          <div className="analytics-tile-value">
            ₹{toNumber(analyticsData?.costPrediction?.estimatedMonthlyCost).toFixed(2)}
          </div>
          <div className="analytics-tile-sub">
            Avg {toNumber(analyticsData?.costPrediction?.averageDailyKwh).toFixed(2)} kWh/day · Rate ₹{toNumber(analyticsData?.costPrediction?.ratePerKwh).toFixed(2)}/kWh
          </div>
        </div>
        <div className="analytics-tile">
          <div className="analytics-tile-title">Peak vs Off-Peak</div>
          <div className="analytics-tile-value">
            {analyticsData?.peakOffPeak?.peakHour || 'N/A'} / {analyticsData?.peakOffPeak?.offPeakHour || 'N/A'}
          </div>
          <div className="analytics-tile-sub">
            Peak {toNumber(analyticsData?.peakOffPeak?.peakEnergy).toFixed(2)} kWh · Off-peak {toNumber(analyticsData?.peakOffPeak?.offPeakEnergy).toFixed(2)} kWh
          </div>
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

  return (
    <div className="dashboard">{showProfileModal && !readOnly && (
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
                  value={viewer?.email}
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
            <div className="sidebar-brand-sub">Energy Hub</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'alerts', label: 'Alerts', icon: 'M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z' },
            ...(readOnly ? [] : [
              { id: 'devices', label: 'Devices', icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' },
            ]),
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
          <div className="user-card" onClick={() => !readOnly && setShowProfileModal(true)} style={{ cursor: readOnly ? 'default' : 'pointer' }}>
            <div className="user-avatar">
              {viewer?.firstName?.[0]}{viewer?.lastName?.[0]}
            </div>
            <div className="user-info">
              <div className="user-name">{viewer?.firstName} {viewer?.lastName}</div>
              <div className="user-email">{viewer?.email}</div>
            </div>
          </div>
          {!readOnly && (
            <button className="logout-btn" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span>Sign Out</span>
            </button>
          )}
          {readOnly && (
            <button
              className="admin-back-btn"
              onClick={() => navigate(readOnlyMode === 'technician' ? '/technician/dashboard' : '/admin/dashboard')}
            >
              Back to {readOnlyMode === 'technician' ? 'Technician' : 'Admin'} Dashboard
            </button>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="dash-header">
          <div>
            <h1 className="dash-welcome">
              {readOnly
                ? `Viewing User: ${viewer?.firstName || ''} ${viewer?.lastName || ''}`.trim()
                : `Good ${time.getHours() < 12 ? 'Morning' : time.getHours() < 18 ? 'Afternoon' : 'Evening'}, ${viewer?.firstName}!`}
            </h1>
            <p className="dash-date">
              {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          {!readOnly && user?.role === 'ADMIN' && (
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
        {!loading && activeTab === 'alerts' && renderAlertsRecommendations()}
      </main>
    </div>
  );
};

export default Dashboard;
