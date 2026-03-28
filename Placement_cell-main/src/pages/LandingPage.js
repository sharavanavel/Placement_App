import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-header">
          <h1>Placement Management System</h1>
          <p>Connect Students with Opportunities</p>
        </div>
        
        <div className="login-options">
          <div className="login-card student-card">
            <div className="card-icon">🎓</div>
            <h2>Student Login</h2>
            <p>View companies and apply for placements</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/student-login')}
            >
              Student Login
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate('/student-register')}
            >
              Register Now
            </button>
          </div>
          
          <div className="login-card coordinator-card">
            <div className="card-icon">👔</div>
            <h2>Co-Ordinator Login</h2>
            <p>Manage companies and view applications</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/coordinator-login')}
            >
              Coordinator Login
            </button>
          </div>
        </div>
        
        <div className="landing-footer">
          <p>© 2024 Placement Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
