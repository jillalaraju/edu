import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './StudentPerformance.css';

const StudentPerformance = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudentPerformance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/results/student/${studentId}/performance`);
      setStudentData(response.data.student);
      setPerformanceMetrics(response.data.performanceMetrics);
      setResults(response.data.results);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch student performance data');
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentPerformance();
  }, [fetchStudentPerformance]);

  const handleViewExamPaper = (examId, resultId) => {
    navigate(`/exam/${examId}/paper/${resultId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 70) return '#28a745';
    if (percentage >= 50) return '#ffc107';
    return '#dc3545';
  };

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Average';
    if (percentage >= 50) return 'Below Average';
    return 'Poor';
  };

  if (loading) {
    return <div className="loading">Loading student performance...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="student-performance-container">
      <div className="performance-header">
        <h2>Student Performance Overview</h2>
        <button onClick={() => navigate('/results')} className="back-btn">
          Back to Results
        </button>
      </div>

      <div className="student-info">
        <div className="student-details">
          <h3>{studentData?.fullName}</h3>
          <p><strong>Email:</strong> {studentData?.email}</p>
        </div>
      </div>

      <div className="performance-summary">
        <h3>Performance Summary</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Total Exams</h4>
            <span className="metric-value">{performanceMetrics?.totalExams}</span>
          </div>
          <div className="metric-card">
            <h4>Average Score</h4>
            <span className="metric-value" style={{ color: getGradeColor(performanceMetrics?.averageScore) }}>
              {performanceMetrics?.averageScore}%
            </span>
            <span className="metric-label">
              {getPerformanceLevel(performanceMetrics?.averageScore)}
            </span>
          </div>
          <div className="metric-card">
            <h4>Best Score</h4>
            <span className="metric-value" style={{ color: getGradeColor(performanceMetrics?.bestScore) }}>
              {performanceMetrics?.bestScore}%
            </span>
          </div>
          <div className="metric-card">
            <h4>Worst Score</h4>
            <span className="metric-value" style={{ color: getGradeColor(performanceMetrics?.worstScore) }}>
              {performanceMetrics?.worstScore}%
            </span>
          </div>
        </div>
      </div>

      <div className="exam-history">
        <h3>Exam History</h3>
        {results.length === 0 ? (
          <div className="no-results">
            <p>No exam attempts found</p>
          </div>
        ) : (
          <div className="results-table">
            <div className="table-header">
              <div className="header-cell">Exam Title</div>
              <div className="header-cell">Score</div>
              <div className="header-cell">Percentage</div>
              <div className="header-cell">Grade</div>
              <div className="header-cell">Time Taken</div>
              <div className="header-cell">Submitted</div>
              <div className="header-cell">Actions</div>
            </div>

            {results.map((result) => (
              <div key={result._id} className="table-row">
                <div className="cell">
                  <div className="exam-title">{result.exam.title}</div>
                  <div className="exam-description">{result.exam.description}</div>
                </div>
                <div className="cell">{result.score}/{result.totalMarks}</div>
                <div className="cell">{result.percentage}%</div>
                <div className="cell">
                  <span 
                    className="grade-badge"
                    style={{ backgroundColor: getGradeColor(result.percentage) }}
                  >
                    {getGrade(result.percentage)}
                  </span>
                </div>
                <div className="cell">{formatTime(result.timeTaken)}</div>
                <div className="cell">{formatDate(result.submittedAt)}</div>
                <div className="cell">
                  <button 
                    onClick={() => handleViewExamPaper(result.exam._id, result._id)}
                    className="view-paper-btn"
                  >
                    View Paper
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="performance-chart">
        <h3>Performance Trend</h3>
        <div className="chart-container">
          {results.length > 0 ? (
            <div className="performance-bars">
              {results.map((result, index) => (
                <div key={result._id} className="bar-container">
                  <div className="bar-label">Exam {index + 1}</div>
                  <div className="bar-wrapper">
                    <div 
                      className="bar"
                      style={{ 
                        height: `${result.percentage}%`,
                        backgroundColor: getGradeColor(result.percentage)
                      }}
                    ></div>
                  </div>
                  <div className="bar-value">{result.percentage}%</div>
                </div>
              ))}
            </div>
          ) : (
            <p>No data available for performance chart</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPerformance;
