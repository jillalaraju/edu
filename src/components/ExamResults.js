import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ExamResults.css';

const ExamResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExamResults = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch exam details
      const examResponse = await axios.get(`http://localhost:5000/api/exams/${id}`);
      setExam(examResponse.data);
      
      // Fetch exam results with student names
      const resultsResponse = await axios.get(`http://localhost:5000/api/results/exam/${id}/students`);
      setResults(resultsResponse.data);
      
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch exam results');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExamResults();
  }, [fetchExamResults]);

  const handleStudentClick = (studentId) => {
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
    return <div className="loading">Loading exam results...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="exam-results-container">
      <div className="exam-results-header">
        <h2>Exam Results</h2>
        <button onClick={() => navigate('/exams')} className="back-btn">
          Back to Exams
        </button>
      </div>

      <div className="exam-info">
        <h3>{exam?.title}</h3>
        <p>{exam?.description}</p>
        <p><strong>Total Students:</strong> {results.length}</p>
      </div>

      <div className="results-table">
        <div className="table-header">
          <div className="header-cell">Rank</div>
          <div className="header-cell">Student Name</div>
          <div className="header-cell">Email</div>
          <div className="header-cell">Score</div>
          <div className="header-cell">Percentage</div>
          <div className="header-cell">Grade</div>
          <div className="header-cell">Time Taken</div>
          <div className="header-cell">Submitted</div>
        </div>

        {results.length === 0 ? (
          <div className="no-results">
            <p>No results available for this exam yet</p>
          </div>
        ) : (
          results.map((result, index) => (
            <div key={result._id} className="table-row">
              <div className="cell">#{index + 1}</div>
              <div className="cell student-name">
                <button 
                  onClick={() => handleStudentClick(result.student._id)}
                  className="student-link"
                >
                  {result.student.fullName}
                </button>
              </div>
              <div className="cell">{result.student.email}</div>
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
            </div>
          ))
        )}
      </div>

      <div className="results-summary">
        <h4>Summary Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span>Average Score:</span>
            <span>
              {results.length > 0 
                ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2)
                : 0}%
            </span>
          </div>
          <div className="stat-item">
            <span>Highest Score:</span>
            <span>
              {results.length > 0 
                ? Math.max(...results.map(r => r.percentage))
                : 0}%
            </span>
          </div>
          <div className="stat-item">
            <span>Lowest Score:</span>
            <span>
              {results.length > 0 
                ? Math.min(...results.map(r => r.percentage))
                : 0}%
            </span>
          </div>
          <div className="stat-item">
            <span>Pass Rate:</span>
            <span>
              {results.length > 0 
                ? ((results.filter(r => r.percentage >= 50).length / results.length) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;
