import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const PlacementPredictor = () => {
  const [formData, setFormData] = useState({
    cgpa: '',
    aptitude: '',
    projects: '',
    internships: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('http://localhost:5001/api/predict', {
        cgpa: parseFloat(formData.cgpa),
        aptitude: parseFloat(formData.aptitude),
        projects: parseInt(formData.projects),
        internships: parseInt(formData.internships)
      });

      setResult(response.data);
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to ML server. Please make sure the ML backend is running on port 5001.');
      } else {
        setError(err.response?.data?.error || 'Prediction failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'high':
        return '#10b981';
      case 'moderate':
        return '#f59e0b';
      case 'low':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Placement Predictor</h1>
          <p>Get AI-powered placement probability based on your profile</p>
        </div>

        <div className="dashboard-content">
          <div className="predictor-form-container">
            <h2>Enter Your Details</h2>
            
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="predictor-form">
              <div className="form-group">
                <label htmlFor="cgpa">CGPA (0-10)</label>
                <input
                  type="number"
                  id="cgpa"
                  name="cgpa"
                  value={formData.cgpa}
                  onChange={handleChange}
                  placeholder="Enter your CGPA"
                  min="0"
                  max="10"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="aptitude">Aptitude Score (0-100)</label>
                <input
                  type="number"
                  id="aptitude"
                  name="aptitude"
                  value={formData.aptitude}
                  onChange={handleChange}
                  placeholder="Enter your aptitude score"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="projects">Number of Projects</label>
                <input
                  type="number"
                  id="projects"
                  name="projects"
                  value={formData.projects}
                  onChange={handleChange}
                  placeholder="Enter number of projects"
                  min="0"
                  max="10"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="internships">Number of Internships</label>
                <input
                  type="number"
                  id="internships"
                  name="internships"
                  value={formData.internships}
                  onChange={handleChange}
                  placeholder="Enter number of internships"
                  min="0"
                  max="10"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Predicting...' : 'Predict Placement Chance'}
              </button>
            </form>
          </div>

          {result && (
            <div className="prediction-result">
              <h2>Prediction Result</h2>
              <div className="result-card" style={{ borderColor: getCategoryColor(result.category) }}>
                <div className="result-percentage" style={{ color: getCategoryColor(result.category) }}>
                  {result.placement_chance}%
                </div>
                <div className="result-category" style={{ backgroundColor: getCategoryColor(result.category) }}>
                  {result.category.toUpperCase()}
                </div>
                <div className="result-message">
                  {result.message}
                </div>
                <div className="result-details">
                  <h4>Your Input:</h4>
                  <ul>
                    <li><strong>CGPA:</strong> {result.input.cgpa}</li>
                    <li><strong>Aptitude:</strong> {result.input.aptitude}</li>
                    <li><strong>Projects:</strong> {result.input.projects}</li>
                    <li><strong>Internships:</strong> {result.input.internships}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-footer">
          <Link to="/student-dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlacementPredictor;
