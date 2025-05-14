import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RepPerformance from './pages/RepPerformance';
import AccountPerformance from './pages/AccountPerformance';
import RepTracker from './pages/RepTracker';
import MyPerformance from './pages/MyPerformance';
import AppLayout from './components/layout/AppLayout';
import EngineRoomDashboard from './pages/engine-room/EngineRoomDashboard';
import EngineRoomEngine from './pages/engine-room/EngineRoomEngine';
import EngineRoomApprovals from './pages/engine-room/EngineRoomApprovals';
import Goals from './pages/Goals';

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
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/rep-performance" />} />
        <Route path="/rep-performance" element={<ProtectedRoute><RepPerformance /></ProtectedRoute>} />
        <Route path="/account-performance" element={<ProtectedRoute><AccountPerformance /></ProtectedRoute>} />
        <Route path="/rep-tracker" element={<ProtectedRoute><RepTracker /></ProtectedRoute>} />
        <Route path="/my-performance" element={<ProtectedRoute><MyPerformance /></ProtectedRoute>} />
        <Route path="/engine-room/dashboard" element={<ProtectedRoute><EngineRoomDashboard /></ProtectedRoute>} />
        <Route path="/engine-room/engine" element={<ProtectedRoute><EngineRoomEngine /></ProtectedRoute>} />
        <Route path="/engine-room/approvals" element={<ProtectedRoute><EngineRoomApprovals /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
