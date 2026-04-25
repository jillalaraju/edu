import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ExamList.css';

const ExamList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/exams');
      setExams(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch exams');
      setLoading(false);
    }
  };

  const handleTakeExam = (examId) => {
    navigate(`/exams/${examId}/take`);
  };

  const handleViewResults = (examId) => {
    navigate(`/exam/${examId}/results`);
  };

  const handleEditExam = (examId) => {
    navigate(`/exams/${examId}/edit`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStudentExamLabel = (exam) => {
    if (exam.isAttempted) return 'Already Attempted';
    if (!exam.hasStarted) return 'Not Started';
    if (exam.hasEnded) return 'Window Closed';
    return null;
  };

  if (loading) {
    return <div className="loading">Loading exams...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="exam-list-container">
      <div className="exam-list-header">
        <h2>Exams</h2>
        {user?.role === 'mentor' && (
          <button 
            onClick={() => navigate('/exams/new')}
            className="create-exam-btn"
          >
            Create New Exam
          </button>
        )}
      </div>

      <div className="exams-grid">
        {exams.length === 0 ? (
          <div className="no-exams">
            <p>No exams available</p>
          </div>
        ) : (
          exams.map((exam) => (
            <div key={exam._id} className="exam-card">
              <div className="exam-header">
                <h3>{exam.title}</h3>
                <span className={`status-badge ${exam.isActive ? 'active' : 'inactive'}`}>
                  {exam.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="exam-details">
                <p><strong>Description:</strong> {exam.description}</p>
                <p><strong>Duration:</strong> {exam.duration} minutes</p>
                <p><strong>Questions:</strong> {exam.questions.length}</p>
                <p><strong>Scheduled Date:</strong> {formatDate(exam.scheduledDate)}</p>
                <p><strong>Created by:</strong> {exam.createdBy.fullName}</p>
              </div>

              <div className="exam-actions">
                {user?.role === 'student' && exam.isActive && (
                  getStudentExamLabel(exam) ? (
                    <button className="take-exam-btn" disabled>
                      {getStudentExamLabel(exam)}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleTakeExam(exam._id)}
                      className="take-exam-btn"
                    >
                      Take Exam
                    </button>
                  )
                )}
                
                {(user?.role === 'mentor' || user?.role === 'admin') && (
                  <>
                    <button 
                      onClick={() => handleViewResults(exam._id)}
                      className="view-results-btn"
                    >
                      View Results
                    </button>
                    {user?.role === 'mentor' && (
                      <button 
                        onClick={() => handleEditExam(exam._id)}
                        className="edit-exam-btn"
                      >
                        Edit
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExamList;
