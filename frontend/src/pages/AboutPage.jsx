import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <header className="about-header">
        <button className="about-back" onClick={() => navigate('/dashboard')}>
          Back
        </button>
        <div>
          <h1>About Smart Home Energy Management</h1>
          <p>Monitor, analyze, and optimize your household electricity use.</p>
        </div>
      </header>

      <section className="about-card">
        <h2>Platform Summary</h2>
        <p>
          The Smart Home Energy Management System helps households track appliance-level usage,
          estimate electricity costs, automate devices, and receive recommendations to reduce
          energy consumption.
        </p>
      </section>

      <section className="about-grid">
        <div className="about-card">
          <h3>Admin Role</h3>
          <p>
            Admins manage users, devices, analytics, and system configurations such as electricity rate,
            peak hours, and alert thresholds. They monitor global energy trends and device health.
          </p>
        </div>
        <div className="about-card">
          <h3>Homeowner Role</h3>
          <p>
            Homeowners track real-time usage, costs, and automation schedules for their home,
            and act on recommendations to save energy.
          </p>
        </div>
        <div className="about-card">
          <h3>Technician Role</h3>
          <p>
            Technicians install and maintain IoT devices, verify readings, recalibrate sensors,
            and resolve hardware issues to keep data accurate.
          </p>
        </div>
      </section>

      <section className="about-card">
        <h2>Energy & Current Calculation</h2>
        <p>P = V × I</p>
        <p>Current: I = P / V</p>
        <p>Example: 1500W ÷ 230V ≈ 6.52 A</p>
        <p>Energy: Power × Time → 1.5 kW × 5 hours = 7.5 kWh</p>
        <p>Cost at ₹7/unit → 7.5 × 7 = ₹52.5</p>
      </section>
    </div>
  );
};

export default AboutPage;
