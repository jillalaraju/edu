import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './TakeExam.css';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  const fetchExam = useCallback(async () => {
    try {
      const response = await api.get(`/exams/${id}`);
      const examData = response.data;

      const sessionResponse = await api.post(`/exams/${id}/start`);
      setSessionId(sessionResponse.data.sessionId);

      setExam(examData);
      const expiresAt = new Date(sessionResponse.data.expiresAt).getTime();
      const now = new Date(sessionResponse.data.serverNow).getTime();
      setTimeLeft(Math.max(0, Math.floor((expiresAt - now) / 1000)));
      setStartTime(Date.now());
      
      const initialAnswers = examData.questions.map((_, index) => ({
        questionIndex: index,
        selectedAnswer: null
      }));
      setAnswers(initialAnswers);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to load exam');
      setLoading(false);
    }
  }, [id]);

  const handleAnswerChange = (questionIndex, selectedAnswer) => {
    const updatedAnswers = [...answers];
    updatedAnswers[questionIndex] = {
      questionIndex,
      selectedAnswer
    };
    setAnswers(updatedAnswers);
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || isLocked) return;
    
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      const response = await api.post(`/exams/${id}/submit`, {
        sessionId,
        answers,
        timeTaken
      });

      navigate('/results', { 
        state: { 
          result: response.data.result,
          examTitle: exam.title 
        } 
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit exam');
      setSubmitting(false);
    }
  }, [submitting, isLocked, startTime, id, sessionId, answers, navigate, exam]);

  const lockExamSession = useCallback(async (reason) => {
    if (!sessionId || isLocked) return;
    try {
      await api.post(`/exams/${id}/lock`, { sessionId, reason });
    } catch (lockError) {
      // no-op: session may already be closed
    } finally {
      setIsLocked(true);
      setError('Exam locked due to time drift/tab suspension. Contact mentor/admin.');
      setSubmitting(true);
    }
  }, [id, sessionId, isLocked]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  useEffect(() => {
    if (exam && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [exam, timeLeft, handleSubmit]);

  useEffect(() => {
    if (!sessionId || isLocked) return;
    const heartbeat = setInterval(async () => {
      try {
        await api.post(`/exams/${id}/heartbeat`, { sessionId });
      } catch (heartbeatError) {
        setError(heartbeatError.response?.data?.message || 'Session heartbeat failed');
        setIsLocked(true);
      }
    }, 15000);

    return () => clearInterval(heartbeat);
  }, [id, sessionId, isLocked]);

  useEffect(() => {
    if (!sessionId || isLocked) return;

    let previousPerf = performance.now();
    let previousDateNow = Date.now();
    const watchdog = setInterval(() => {
      const currentPerf = performance.now();
      const currentDateNow = Date.now();
      const perfDelta = currentPerf - previousPerf;
      const dateDelta = currentDateNow - previousDateNow;
      previousPerf = currentPerf;
      previousDateNow = currentDateNow;

      const drift = Math.abs(dateDelta - perfDelta);
      if (drift > 5000 || perfDelta > 20000) {
        lockExamSession('Detected browser time drift or tab suspension');
      }
    }, 5000);

    return () => clearInterval(watchdog);
  }, [sessionId, isLocked, lockExamSession]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isTimeRunningOut = timeLeft <= 300; // 5 minutes

  if (loading) {
    return <div className="loading">Loading exam...</div>;
  }

  if (!exam) {
    return <div className="error">{error || 'Exam not found'}</div>;
  }

  return (
    <div className="take-exam-container">
      <div className="exam-header">
        <h1>{exam.title}</h1>
        <div className={`timer ${isTimeRunningOut ? 'warning' : ''}`}>
          <span>Time Left: {formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="exam-content">
        {error && <div className="error">{error}</div>}
        <div className="exam-description">
          <p>{exam.description}</p>
          <p><strong>Total Questions:</strong> {exam.questions.length}</p>
          <p><strong>Duration:</strong> {exam.duration} minutes</p>
        </div>

        <div className="questions-container">
          {exam.questions.map((question, index) => (
            <div key={index} className="question-card">
              <h3>Question {index + 1}</h3>
              <p className="question-text">{question.question}</p>
              <p className="question-marks">Marks: {question.marks}</p>

              <div className="options">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="option-label">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={optionIndex}
                      checked={answers[index]?.selectedAnswer === optionIndex}
                      onChange={() => handleAnswerChange(index, optionIndex)}
                    />
                    <span className="option-text">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="exam-actions">
          <button 
            onClick={handleSubmit} 
            disabled={submitting || isLocked || answers.some(a => a.selectedAnswer === null)}
            className="submit-btn"
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;
