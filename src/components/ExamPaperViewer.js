import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ExamPaperViewer.css';

const ExamPaperViewer = () => {
  const { examId, resultId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExamPaper = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch the specific result with exam details
      const response = await axios.get(`http://localhost:5000/api/results/student/${user.userId}/attempts`);
      const specificResult = response.data.find(r => r._id === resultId && r.exam._id === examId);
      
      if (!specificResult) {
        setError('Exam result not found');
        setLoading(false);
        return;
      }
      
      setResult(specificResult);
      setExam(specificResult.exam);
      setLoading(false);
    } catch (error) {
      setError('Failed to load exam paper');
      setLoading(false);
    }
  }, [user.userId, resultId, examId]);

  useEffect(() => {
    fetchExamPaper();
  }, [fetchExamPaper]);

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

  const isCorrectAnswer = (questionIndex) => {
    if (!result || !result.answers) return false;
    const answer = result.answers.find(a => a.questionIndex === questionIndex);
    if (!answer) return false;
    return answer.selectedAnswer === exam.questions[questionIndex].correctAnswer;
  };

  if (loading) {
    return <div className="loading">Loading exam paper...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="exam-paper-viewer">
      <div className="paper-header">
        <h2>Exam Paper Viewer</h2>
        <button onClick={() => navigate('/results')} className="back-btn">
          Back to Results
        </button>
      </div>

      <div className="exam-info">
        <h3>{exam?.title}</h3>
        <p>{exam?.description}</p>
        <div className="exam-meta">
          <span><strong>Duration:</strong> {exam?.duration} minutes</span>
          <span><strong>Total Questions:</strong> {exam?.questions.length}</span>
          <span><strong>Total Marks:</strong> {exam?.questions.reduce((sum, q) => sum + q.marks, 0)}</span>
        </div>
      </div>

      <div className="result-summary">
        <h4>Your Performance</h4>
        <div className="performance-stats">
          <div className="stat-item">
            <span>Score:</span>
            <span>{result?.score}/{result?.totalMarks}</span>
          </div>
          <div className="stat-item">
            <span>Percentage:</span>
            <span style={{ color: getGradeColor(result?.percentage) }}>
              {result?.percentage}%
            </span>
          </div>
          <div className="stat-item">
            <span>Grade:</span>
            <span 
              className="grade-badge"
              style={{ backgroundColor: getGradeColor(result?.percentage) }}
            >
              {getGrade(result?.percentage)}
            </span>
          </div>
          <div className="stat-item">
            <span>Time Taken:</span>
            <span>{formatTime(result?.timeTaken)}</span>
          </div>
          <div className="stat-item">
            <span>Submitted:</span>
            <span>{formatDate(result?.submittedAt)}</span>
          </div>
        </div>
      </div>

      <div className="questions-section">
        <h4>Questions and Your Answers</h4>
        {exam?.questions.map((question, index) => {
          const userAnswer = result?.answers?.find(a => a.questionIndex === index);
          const isCorrect = isCorrectAnswer(index);
          
          return (
            <div key={index} className={`question-review ${isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="question-header">
                <h5>Question {index + 1}</h5>
                <div className="question-status">
                  <span className={`status-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                  <span className="marks">({question.marks} marks)</span>
                </div>
              </div>
              
              <div className="question-text">
                {question.question}
              </div>

              <div className="options-review">
                {question.options.map((option, optionIndex) => {
                  const isUserAnswer = userAnswer?.selectedAnswer === optionIndex;
                  const isCorrectOption = question.correctAnswer === optionIndex;
                  
                  return (
                    <div 
                      key={optionIndex} 
                      className={`option-review 
                        ${isUserAnswer ? 'user-answer' : ''} 
                        ${isCorrectOption ? 'correct-answer' : ''}`}
                    >
                      <div className="option-indicator">
                        {isUserAnswer && <span className="user-indicator">Your Answer</span>}
                        {isCorrectOption && <span className="correct-indicator">Correct Answer</span>}
                      </div>
                      <div className="option-text">
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isCorrect && (
                <div className="explanation">
                  <strong>Explanation:</strong> The correct answer is option {String.fromCharCode(65 + question.correctAnswer)}.
                  {userAnswer && ` You selected option ${String.fromCharCode(65 + userAnswer.selectedAnswer)}.`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="paper-actions">
        <button onClick={() => navigate('/results')} className="back-to-results-btn">
          Back to Results
        </button>
        <button onClick={() => navigate('/exams')} className="view-exams-btn">
          View Available Exams
        </button>
      </div>
    </div>
  );
};

export default ExamPaperViewer;
