import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0
  });

  useEffect(() => {
    if (user?.role === 'student') {
      fetchStudentStats();
    } else if (user?.role === 'mentor') {
      fetchMentorStats();
    } else if (user?.role === 'admin') {
      fetchAdminStats();
    }
  }, [user]);

  const fetchStudentStats = async () => {
    try {
      const response = await api.get('/results');
      const results = response.data;
      const completedExams = results.length;
      const averageScore = completedExams > 0 
        ? results.reduce((sum, result) => sum + result.percentage, 0) / completedExams 
        : 0;

      setStats({
        totalExams: 0,
        completedExams,
        averageScore: averageScore.toFixed(2)
      });
    } catch (error) {
      console.error('Error fetching student stats:', error);
    }
  };

  const fetchMentorStats = async () => {
    try {
      const response = await api.get('/exams');
      setStats({
        totalExams: response.data.length,
        completedExams: 0,
        averageScore: 0
      });
    } catch (error) {
      console.error('Error fetching mentor stats:', error);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const [examsResponse, usersResponse] = await Promise.all([
        api.get('/exams'),
        api.get('/users')
      ]);
      
      setStats({
        totalExams: examsResponse.data.length,
        completedExams: usersResponse.data.length,
        averageScore: 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderDashboardContent = () => {
    switch (user?.role) {
      case 'student':
        return (
          <div className="dashboard-content">
            <h2>Student Dashboard</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Completed Exams</h3>
                <p className="stat-number">{stats.completedExams}</p>
              </div>
              <div className="stat-card">
                <h3>Average Score</h3>
                <p className="stat-number">{stats.averageScore}%</p>
              </div>
            </div>
            <div className="action-buttons">
              <button onClick={() => navigate('/exams')} className="primary-btn">
                View Available Exams
              </button>
              <button onClick={() => navigate('/results')} className="secondary-btn">
                View My Results
              </button>
            </div>
          </div>
        );

      case 'mentor':
        return (
          <div className="dashboard-content">
            <h2>Mentor Dashboard</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Exams Created</h3>
                <p className="stat-number">{stats.totalExams}</p>
              </div>
            </div>
            <div className="action-buttons">
              <button onClick={() => navigate('/exams/new')} className="primary-btn">
                Create New Exam
              </button>
              <button onClick={() => navigate('/exams')} className="secondary-btn">
                Manage Exams
              </button>
              <button onClick={() => navigate('/results')} className="secondary-btn">
                View Results
              </button>
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className="dashboard-content">
            <h2>Admin Dashboard</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p className="stat-number">{stats.completedExams}</p>
              </div>
              <div className="stat-card">
                <h3>Total Exams</h3>
                <p className="stat-number">{stats.totalExams}</p>
              </div>
            </div>
            <div className="action-buttons">
              <button onClick={() => navigate('/exams')} className="primary-btn">
                Manage Exams
              </button>
              <button onClick={() => navigate('/results')} className="secondary-btn">
                View All Results
              </button>
            </div>
          </div>
        );

      default:
        return <div>Loading...</div>;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Online Examination System</h1>
          <div className="user-info">
            <span>Welcome, {user.fullName}</span>
            <span className="role-badge">{user.role}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="dashboard-main">
        {renderDashboardContent()}
      </main>
    </div>
  );
};

export default Dashboard;
