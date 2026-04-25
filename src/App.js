import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ExamList from './components/ExamList';
import ExamForm from './components/ExamForm';
import TakeExam from './components/TakeExam';
import Results from './components/Results';
import ExamResults from './components/ExamResults';
import StudentPerformance from './components/StudentPerformance';
import ExamPaperViewer from './components/ExamPaperViewer';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      }
    />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/exams"
      element={
        <ProtectedRoute>
          <ExamList />
        </ProtectedRoute>
      }
    />
    <Route
      path="/exams/new"
      element={
        <ProtectedRoute>
          <ExamForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="/exams/:id/edit"
      element={
        <ProtectedRoute>
          <ExamForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="/exams/:id/take"
      element={
        <ProtectedRoute>
          <TakeExam />
        </ProtectedRoute>
      }
    />
    <Route
      path="/exams/:id/results"
      element={
        <ProtectedRoute>
          <Results />
        </ProtectedRoute>
      }
    />
    <Route
      path="/results"
      element={
        <ProtectedRoute>
          <Results />
        </ProtectedRoute>
      }
    />
    <Route
      path="/exam/:id/results"
      element={
        <ProtectedRoute>
          <ExamResults />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/:studentId/performance"
      element={
        <ProtectedRoute>
          <StudentPerformance />
        </ProtectedRoute>
      }
    />
    <Route
      path="/exam/:examId/paper/:resultId"
      element={
        <ProtectedRoute>
          <ExamPaperViewer />
        </ProtectedRoute>
      }
    />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
