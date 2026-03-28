import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../api';
import './Dashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(null);
  const [activeTab, setActiveTab] = useState('companies');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await studentAPI.getCompanies();
      setCompanies(response.data);
    } catch (err) {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (companyId) => {
    setApplying(companyId);
    try {
      await studentAPI.applyToCompany(companyId);
      setCompanies(companies.map(company =>
        company.id === companyId ? { ...company, hasApplied: true } : company
      ));
      alert('Successfully applied to the company!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-left">
            <h1>Student Dashboard</h1>
            <p>Welcome, {user.name}!</p>
          </div>
          <div className="header-right">
            <span className="user-info">{user.email}</span>
            <button onClick={handleLogout} className="btn btn-logout">Logout</button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            🏢 Companies
          </button>
          <button
            className={`tab-btn ${activeTab === 'evaluate' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluate')}
          >
            🎯 Evaluate
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'companies' && (
            <div className="dashboard-content">
              <h2>Available Companies</h2>
              {companies.length === 0 ? (
                <div className="empty-state">
                  <p>No companies available at the moment. Please check back later.</p>
                </div>
              ) : (
                <div className="companies-grid">
                  {companies.map(company => (
                    <div key={company.id} className="company-card">
                      <div className="company-header">
                        <h3>{company.companyName}</h3>
                        <span className="lpa-badge">{company.lpa} LPA</span>
                      </div>
                      <div className="company-details">
                        <p><strong>Role:</strong> {company.role}</p>
                        {company.requirements && (
                          <p><strong>Requirements:</strong> {company.requirements}</p>
                        )}
                      </div>
                      <div className="company-actions">
                        {company.hasApplied ? (
                          <button className="btn btn-applied" disabled>
                            Already Applied ✓
                          </button>
                        ) : (
                          <button
                            className="btn btn-apply"
                            onClick={() => handleApply(company.id)}
                            disabled={applying === company.id}
                          >
                            {applying === company.id ? 'Applying...' : 'Interested'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'evaluate' && <PlacementPredictor />}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
//  PlacementPredictor
//  200-sample Logistic Regression — ported from Python.
//  Runs fully in-browser, no fetch / external server needed.
//
//  Training rules (same as Python script):
//    • CGPA < 6.0  → label = 0  (hard filter)
//    • Else score  = cgpa*6 + apt*0.2 + projects*8 + internships*12
//                    label = 1 if score > 65 else 0
//  Thresholds: >70% High | >40% Moderate | else Low
// ─────────────────────────────────────────────────────────────────
const PlacementPredictor = () => {
  const [form, setForm] = useState({ cgpa: '', aptitude: '', projects: '', internships: '' });
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState('');

  // ── Seeded PRNG (Mulberry32) ──────────────────────────────────
  const makeRand = (seed) => {
    let s = seed;
    return () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ── Generate 200 training samples using the same placement rules ──
  const buildTrainingData = () => {
    const rand = makeRand(42);
    const X = [], y = [];
    for (let i = 0; i < 200; i++) {
      const cgpa   = 5.0 + rand() * 5.0;    // uniform(5.0, 10.0)
      const apt    = 40  + rand() * 60;       // uniform(40, 100)
      const proj   = Math.floor(rand() * 5);  // randint(0, 5)
      const intern = Math.floor(rand() * 3);  // randint(0, 3)
      X.push([cgpa, apt, proj, intern]);

      let label;
      if (cgpa < 6.0) {
        label = 0;
      } else {
        const score = cgpa * 6 + apt * 0.2 + proj * 8 + intern * 12;
        label = score > 65 ? 1 : 0;
      }
      y.push(label);
    }
    return { X, y };
  };

  const { X: X_train, y: y_train } = buildTrainingData();
  const N = X_train.length;
  const NF = 4;

  // ── StandardScaler: population mean & std (mirrors sklearn) ──
  const means = Array(NF).fill(0);
  X_train.forEach(row => row.forEach((v, i) => { means[i] += v / N; }));
  const stds = Array(NF).fill(0);
  X_train.forEach(row => row.forEach((v, i) => { stds[i] += (v - means[i]) ** 2 / N; }));
  stds.forEach((_, i) => { stds[i] = Math.sqrt(stds[i]) || 1; });
  const scale = (row) => row.map((v, i) => (v - means[i]) / stds[i]);

  // ── Logistic Regression via gradient descent ──────────────────
  const sigmoid = (z) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));

  const trainLR = (X, y, lr = 0.1, epochs = 3000) => {
    let w = Array(X[0].length).fill(0);
    let b = 0;
    for (let e = 0; e < epochs; e++) {
      const dw    = Array(w.length).fill(0);
      let   db    = 0;
      const wSnap = w.slice();
      const bSnap = b;
      X.forEach((xi, idx) => {
        const z   = xi.reduce((s, v, j) => s + v * wSnap[j], bSnap);
        const err = sigmoid(z) - y[idx];
        xi.forEach((v, j) => { dw[j] += err * v; });
        db += err;
      });
      w = w.map((wj, j) => wj - (lr * dw[j]) / X.length);
      b = b - (lr * db) / X.length;
    }
    return { w, b };
  };

  const X_scaled  = X_train.map(scale);
  const { w, b } = trainLR(X_scaled, y_train);

  // ── Handlers ──────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
    setResult(null);
  };

  const handlePredict = () => {
    const cgpa        = parseFloat(form.cgpa);
    const aptitude    = parseFloat(form.aptitude);
    const projects    = parseInt(form.projects, 10);
    const internships = parseInt(form.internships, 10);

    if ([cgpa, aptitude, projects, internships].some(isNaN)) {
      setFormError('Please fill in all fields with valid numbers.');
      return;
    }
    if (cgpa < 0 || cgpa > 10)         { setFormError('CGPA must be between 0 and 10.');            return; }
    if (aptitude < 0 || aptitude > 100) { setFormError('Aptitude score must be between 0 and 100.'); return; }

    const userScaled = scale([cgpa, aptitude, projects, internships]);
    const z   = userScaled.reduce((s, v, j) => s + v * w[j], b);
    const pct = +(sigmoid(z) * 100).toFixed(2);

    // Thresholds from the new Python script
    let label, emoji, colorClass;
    if (pct > 70)      { label = 'High chances! Keep it up.';                      emoji = '🚀'; colorClass = 'pred-high'; }
    else if (pct > 40) { label = 'Moderate chances. Focus on more projects.';       emoji = '👍'; colorClass = 'pred-mid';  }
    else               { label = 'Low chances. Warning: Low CGPA is a major risk.'; emoji = '⚠️'; colorClass = 'pred-low';  }

    setResult({ pct, label, emoji, colorClass });
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="predictor-card">
      <div className="predictor-header">
        <span className="predictor-icon">🎯</span>
        <div>
          <h2>Placement Chance Predictor</h2>
          <p>Enter your academic details to estimate your placement probability</p>
        </div>
      </div>

      <div className="predictor-form">
        <div className="predictor-row">
          <div className="predictor-group">
            <label>CGPA <span className="hint">(0 – 10)</span></label>
            <input
              type="number" name="cgpa" value={form.cgpa}
              onChange={handleChange} placeholder="e.g. 8.5"
              min="0" max="10" step="0.1"
            />
          </div>
          <div className="predictor-group">
            <label>Aptitude Score <span className="hint">(0 – 100)</span></label>
            <input
              type="number" name="aptitude" value={form.aptitude}
              onChange={handleChange} placeholder="e.g. 75"
              min="0" max="100"
            />
          </div>
          <div className="predictor-group">
            <label>No. of Projects</label>
            <input
              type="number" name="projects" value={form.projects}
              onChange={handleChange} placeholder="e.g. 2"
              min="0"
            />
          </div>
          <div className="predictor-group">
            <label>Internships</label>
            <input
              type="number" name="internships" value={form.internships}
              onChange={handleChange} placeholder="e.g. 1"
              min="0"
            />
          </div>
        </div>

        {formError && <p className="predictor-error">{formError}</p>}

        <button className="btn btn-predict" onClick={handlePredict}>
          ✨ Predict Placement Chance
        </button>
      </div>

      {result && (
        <div className={`predictor-result ${result.colorClass}`}>
          <div className="result-pct">{result.pct}%</div>
          <div className="result-bar-wrapper">
            <div className="result-bar" style={{ width: `${result.pct}%` }} />
          </div>
          <p className="result-label">{result.emoji} {result.label}</p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
