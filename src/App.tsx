
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Goals from './pages/Goals';
import RepPerformance from './pages/RepPerformance';
import AccountPerformance from './pages/AccountPerformance';
import RepTracker from './pages/RepTracker';
import MyPerformance from './pages/MyPerformance';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? (
    <AppLayout>
      {children}
    </AppLayout>
  ) : (
    <Navigate to="/login" />
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<Navigate to="/rep-performance" />} />
        <Route path="/rep-performance" element={<ProtectedRoute><RepPerformance /></ProtectedRoute>} />
        <Route path="/account-performance" element={<ProtectedRoute><AccountPerformance /></ProtectedRoute>} />
        <Route path="/rep-tracker" element={<ProtectedRoute><RepTracker /></ProtectedRoute>} />
        <Route path="/my-performance" element={<ProtectedRoute><MyPerformance /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
