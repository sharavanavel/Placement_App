import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import CoordinatorLogin from './pages/CoordinatorLogin';
import StudentDashboard from './pages/StudentDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import PlacementPredictor from './pages/PlacementPredictor';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/student-register" element={<StudentRegister />} />
          <Route path="/coordinator-login" element={<CoordinatorLogin />} />
          
          {/* Protected Routes - Student */}
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/placement-predictor" 
            element={
              <ProtectedRoute role="student">
                <PlacementPredictor />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Routes - Coordinator */}
          <Route 
            path="/coordinator-dashboard" 
            element={
              <ProtectedRoute role="coordinator">
                <CoordinatorDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
