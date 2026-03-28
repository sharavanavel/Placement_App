import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coordinatorAPI } from '../api';
import './Dashboard.css';

const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    lpa: '',
    role: '',
    requirements: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await coordinatorAPI.getCompanies();
      setCompanies(response.data);
    } catch (err) {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await coordinatorAPI.addCompany(formData);
      setFormData({ companyName: '', lpa: '', role: '', requirements: '' });
      setShowAddForm(false);
      fetchCompanies();
      alert('Company added successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add company');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplications = async (companyId) => {
    setSelectedCompany(companyId);
    setLoadingApplications(true);
    try {
      const response = await coordinatorAPI.getCompanyApplications(companyId);
      setApplications(response.data);
    } catch (err) {
      alert('Failed to load applications');
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company? All applications will also be deleted.')) {
      return;
    }
    try {
      await coordinatorAPI.deleteCompany(companyId);
      fetchCompanies();
      alert('Company deleted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete company');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const closeModal = () => {
    setSelectedCompany(null);
    setApplications([]);
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header coordinator-header">
          <div className="header-left">
            <h1>Coordinator Dashboard</h1>
            <p>Welcome, {user.name || 'Coordinator'}!</p>
          </div>
          <div className="header-right">
            <span className="user-info">{user.email}</span>
            <button onClick={handleLogout} className="btn btn-logout">Logout</button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="dashboard-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Company'}
          </button>
        </div>

        {showAddForm && (
          <div className="add-company-form">
            <h3>Add New Company</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>LPA</label>
                  <input
                    type="text"
                    name="lpa"
                    value={formData.lpa}
                    onChange={handleChange}
                    placeholder="e.g., 5-10"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="e.g., Software Engineer"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Requirements</label>
                  <input
                    type="text"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    placeholder="e.g., CGPA > 7, No backlogs"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Company'}
              </button>
            </form>
          </div>
        )}

        <div className="dashboard-content">
          <h2>Your Companies</h2>
          
          {companies.length === 0 ? (
            <div className="empty-state">
              <p>No companies added yet. Click "Add Company" to get started.</p>
            </div>
          ) : (
            <div className="companies-grid">
              {companies.map(company => (
                <div key={company.id} className="company-card coordinator-card">
                  <div className="company-header">
                    <h3>{company.companyName}</h3>
                    <span className="lpa-badge">{company.lpa} LPA</span>
                  </div>
                  
                  <div className="company-details">
                    <p><strong>Role:</strong> {company.role}</p>
                    {company.requirements && (
                      <p><strong>Requirements:</strong> {company.requirements}</p>
                    )}
                    <p>
                      <strong>Interested Students:</strong>{' '}
                      <span className={`app-count-badge ${company.applicationCount > 0 ? 'has-apps' : ''}`}>
                        {company.applicationCount || 0}
                      </span>
                    </p>
                  </div>
                  
                  <div className="company-actions">
                    <button 
                      className="btn btn-view" 
                      onClick={() => handleViewApplications(company.id)}
                    >
                      View Students
                    </button>
                    <button 
                      className="btn btn-delete" 
                      onClick={() => handleDeleteCompany(company.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applications Modal */}
        {selectedCompany && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Interested Students</h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              {loadingApplications ? (
                <div className="loading">Loading applications...</div>
              ) : applications.length > 0 ? (
                <div className="applications-list">
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Year</th>
                        <th>Applied At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((student, idx) => (
                        <tr key={student.id}>
                          <td>{idx + 1}</td>
                          <td>{student.name}</td>
                          <td>{student.email}</td>
                          <td>{student.department}</td>
                          <td>Year {student.year}</td>
                          <td>{new Date(student.applied_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No students have applied to this company yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
