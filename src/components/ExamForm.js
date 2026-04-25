import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import './ExamForm.css';

const getDefaultQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  marks: 1
});

const ExamForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState('');

  const [examData, setExamData] = useState({
    title: '',
    description: '',
    duration: 60,
    scheduledDate: '',
    isActive: true,
    questions: [getDefaultQuestion()]
  });

  const fetchExamForEdit = useCallback(async () => {
    try {
      const response = await api.get(`/exams/${id}`);
      const exam = response.data;
      setExamData({
        title: exam.title || '',
        description: exam.description || '',
        duration: exam.duration || 60,
        scheduledDate: exam.scheduledDate ? new Date(exam.scheduledDate).toISOString().slice(0, 16) : '',
        isActive: exam.isActive,
        questions: exam.questions?.length
          ? exam.questions.map((q) => ({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              marks: q.marks
            }))
          : [getDefaultQuestion()]
      });
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || 'Failed to load exam for edit');
    } finally {
      setInitialLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      fetchExamForEdit();
    }
  }, [isEditMode, fetchExamForEdit]);

  const handleExamDataChange = (e) => {
    setExamData({
      ...examData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const updatedQuestions = [...examData.questions];
    if (field === 'options') {
      updatedQuestions[questionIndex].options[value.index] = value.value;
    } else {
      updatedQuestions[questionIndex][field] = value;
    }
    setExamData({
      ...examData,
      questions: updatedQuestions
    });
  };

  const addQuestion = () => {
    setExamData({
      ...examData,
      questions: [
        ...examData.questions,
          getDefaultQuestion()
      ]
    });
  };

  const removeQuestion = (questionIndex) => {
    if (examData.questions.length > 1) {
      const updatedQuestions = examData.questions.filter((_, index) => index !== questionIndex);
      setExamData({
        ...examData,
        questions: updatedQuestions
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        await api.put(`/exams/${id}`, examData);
      } else {
        await api.post('/exams', examData);
      }
      navigate('/exams');
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} exam`);
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="loading">Loading exam...</div>;
  }

  return (
    <div className="exam-form-container">
      <div className="exam-form-header">
        <h2>{isEditMode ? 'Edit Exam' : 'Create New Exam'}</h2>
        <button onClick={() => navigate('/exams')} className="back-btn">
          Back to Exams
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="exam-form">
        <div className="exam-details-section">
          <h3>Exam Details</h3>
          <div className="form-group">
            <label htmlFor="title">Exam Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={examData.title}
              onChange={handleExamDataChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={examData.description}
              onChange={handleExamDataChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (minutes):</label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={examData.duration}
              onChange={handleExamDataChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="scheduledDate">Scheduled Date:</label>
            <input
              type="datetime-local"
              id="scheduledDate"
              name="scheduledDate"
              value={examData.scheduledDate}
              onChange={handleExamDataChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="isActive">Exam Status:</label>
            <select
              id="isActive"
              name="isActive"
              value={String(examData.isActive)}
              onChange={(e) => setExamData({ ...examData, isActive: e.target.value === 'true' })}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="questions-section">
          <h3>Questions</h3>
          {examData.questions.map((question, questionIndex) => (
            <div key={questionIndex} className="question-card">
              <div className="question-header">
                <h4>Question {questionIndex + 1}</h4>
                {examData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="remove-question-btn"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Question:</label>
                <textarea
                  value={question.question}
                  onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                  required
                />
              </div>

              <div className="options-group">
                <label>Options:</label>
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="option-input">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleQuestionChange(questionIndex, 'options', { index: optionIndex, value: e.target.value })}
                      placeholder={`Option ${optionIndex + 1}`}
                      required
                    />
                    <input
                      type="radio"
                      name={`correct-${questionIndex}`}
                      checked={question.correctAnswer === optionIndex}
                      onChange={() => handleQuestionChange(questionIndex, 'correctAnswer', optionIndex)}
                    />
                    <span>Correct</span>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>Marks:</label>
                <input
                  type="number"
                  value={question.marks}
                  onChange={(e) => handleQuestionChange(questionIndex, 'marks', parseInt(e.target.value))}
                  min="1"
                  required
                />
              </div>
            </div>
          ))}

          <button type="button" onClick={addQuestion} className="add-question-btn">
            Add Question
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Exam' : 'Create Exam')}
          </button>
          <button type="button" onClick={() => navigate('/exams')} className="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamForm;
