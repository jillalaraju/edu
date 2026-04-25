import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Results.css';

const Results = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.result) {
      // Show immediate result after exam submission
      setLoading(false);
    } else {
      fetchResults();
    }
  }, [location, user]);

  const fetchResults = async () => {
    try {
      const [resultsResponse, analyticsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/results'),
        axios.get('http://localhost:5000/api/results/analytics')
      ]);
      setResults(resultsResponse.data);
      setAnalytics(analyticsResponse.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch results');
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await axios.get('http://localhost:5000/api/results/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `results-${user?.role || 'data'}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError.response?.data?.message || 'Failed to export results');
    } finally {
      setExporting(false);
    }
  };

  const handleViewPaper = (examId, resultId) => {
    navigate(`/exam/${examId}/paper/${resultId}`);
  };

  const handleStudentPerformance = (studentId) => {
    navigate(`/student/${studentId}/performance`);
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

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Show immediate result if available
  if (location.state?.result) {
    const { result, examTitle } = location.state;
    
    return (
      <div className="results-container">
        <div className="results-header">
          <h2>Exam Result</h2>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            Back to Dashboard
          </button>
        </div>

        <div className="result-summary">
          <h3>{examTitle}</h3>
          <div className="score-display">
            <div className="score-circle" style={{ borderColor: getGradeColor(result.percentage) }}>
              <span className="score-percentage" style={{ color: getGradeColor(result.percentage) }}>
                {result.percentage}%
              </span>
              <span className="score-grade" style={{ color: getGradeColor(result.percentage) }}>
                {getGrade(result.percentage)}
              </span>
            </div>
          </div>
          
          <div className="score-details">
            <div className="score-item">
              <span>Score:</span>
              <span>{result.score}/{result.totalMarks}</span>
            </div>
            <div className="score-item">
              <span>Percentage:</span>
              <span>{result.percentage}%</span>
            </div>
          </div>
        </div>

        <div className="result-actions">
          <button onClick={() => navigate('/exams')} className="view-exams-btn">
            View More Exams
          </button>
          <button onClick={() => navigate('/results')} className="view-all-results-btn">
            View All Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Results</h2>
        <div className="results-header-actions">
          <button onClick={handleExport} className="view-all-results-btn" disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>

      {analytics && (
        <div className="results-analytics">
          <div className="analytics-card">
            <h4>Total Submissions</h4>
            <p>{analytics.totalSubmissions}</p>
          </div>
          <div className="analytics-card">
            <h4>Average Score</h4>
            <p>{analytics.averagePercentage}%</p>
          </div>
          <div className="analytics-card">
            <h4>Pass Rate</h4>
            <p>{analytics.passRate}%</p>
          </div>
        </div>
      )}

      {analytics?.passFailByExam?.length > 0 && (
        <div className="results-content chart-section">
          <h3>Pass/Fail by Exam</h3>
          {analytics.passFailByExam.map((row) => {
            const total = row.pass + row.fail || 1;
            const passWidth = (row.pass / total) * 100;
            const failWidth = (row.fail / total) * 100;
            return (
              <div key={row.examId} className="chart-row">
                <div className="chart-label">{row.examTitle}</div>
                <div className="stacked-bar">
                  <div className="stack-pass" style={{ width: `${passWidth}%` }}>P:{row.pass}</div>
                  <div className="stack-fail" style={{ width: `${failWidth}%` }}>F:{row.fail}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {analytics?.submissionTrend?.length > 0 && (
        <div className="results-content chart-section">
          <h3>Submission Trend (Daily)</h3>
          <div className="trend-grid">
            {analytics.submissionTrend.map((point) => (
              <div key={point.date} className="trend-card">
                <p><strong>{point.date}</strong></p>
                <p>Submissions: {point.submissions}</p>
                <p>Avg: {point.averagePercentage}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="results-content">
        {results.length === 0 ? (
          <div className="no-results">
            <p>No results available</p>
          </div>
        ) : (
          <div className="results-grid">
            {results.map((result, index) => (
              <div key={index} className="result-card">
                <div className="result-header">
                  <h3>{result.exam.title}</h3>
                  <span 
                    className="grade-badge" 
                    style={{ backgroundColor: getGradeColor(result.percentage) }}
                  >
                    {getGrade(result.percentage)}
                  </span>
                </div>

                <div className="result-details">
                  <p><strong>Description:</strong> {result.exam.description}</p>
                  {(user?.role === 'mentor' || user?.role === 'admin') && (
                    <p><strong>Student:</strong> {result.student?.fullName || 'N/A'} ({result.student?.email || 'N/A'})</p>
                  )}
                  <p><strong>Score:</strong> {result.score}/{result.totalMarks}</p>
                  <p><strong>Percentage:</strong> {result.percentage}%</p>
                  <p><strong>Time Taken:</strong> {formatTime(result.timeTaken)}</p>
                  <p><strong>Submitted:</strong> {formatDate(result.submittedAt)}</p>
                </div>

                <div className="result-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${result.percentage}%`,
                        backgroundColor: getGradeColor(result.percentage)
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">{result.percentage}%</span>
                </div>

                <div className="result-actions">
                  {user?.role === 'student' && (
                    <button 
                      onClick={() => handleViewPaper(result.exam._id, result._id)}
                      className="view-paper-btn"
                    >
                      View Question Paper
                    </button>
                  )}
                  
                  {(user?.role === 'mentor' || user?.role === 'admin') && (
                    <>
                      <button 
                        onClick={() => handleViewPaper(result.exam._id, result._id)}
                        className="view-paper-btn"
                      >
                        View Paper
                      </button>
                      <button 
                        onClick={() => handleStudentPerformance(result.student._id)}
                        className="view-performance-btn"
                      >
                        View Student Performance
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
