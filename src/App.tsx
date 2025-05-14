
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';
import RepPerformance from './pages/RepPerformance';
import AccountPerformance from './pages/AccountPerformance';
import MyPerformance from './pages/MyPerformance';
import AIVera from './pages/AIVera';
import RepTracker from './pages/RepTracker';
import DataUpload from './pages/DataUpload';
import EngineRoom from './pages/EngineRoom';
import EngineDashboard from './pages/engine-room/EngineDashboard';
import RuleSimulator from './pages/engine-room/RuleSimulator';
import ApprovalsDashboard from './pages/engine-room/ApprovalsDashboard';
import EngineOperations from './pages/engine-room/EngineOperations';
import Analyst from './pages/engine-room/Analyst';

import { EngineRoomProvider } from './contexts/EngineRoomContext';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <EngineRoomProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            <Route element={
              <ProtectedRoute>
                <Outlet />
              </ProtectedRoute>
            }>
              <Route path="/" element={
                <AppLayout>
                  <RepPerformance />
                </AppLayout>
              } />
              <Route path="/rep-performance" element={
                <AppLayout>
                  <RepPerformance />
                </AppLayout>
              } />
              <Route path="/account-performance" element={
                <AppLayout>
                  <AccountPerformance />
                </AppLayout>
              } />
              <Route path="/my-performance" element={
                <AppLayout>
                  <MyPerformance />
                </AppLayout>
              } />
              <Route path="/ai-vera" element={
                <AppLayout>
                  <AIVera />
                </AppLayout>
              } />
              <Route path="/rep-tracker" element={
                <AppLayout>
                  <RepTracker />
                </AppLayout>
              } />
              <Route path="/data-upload" element={
                <AppLayout>
                  <DataUpload />
                </AppLayout>
              } />
              
              <Route path="/engine-room" element={
                <AppLayout>
                  <EngineRoom />
                </AppLayout>
              } />
              <Route path="/engine-room/dashboard" element={
                <AppLayout>
                  <EngineDashboard />
                </AppLayout>
              } />
              <Route path="/engine-room/rule-simulator" element={
                <AppLayout>
                  <RuleSimulator />
                </AppLayout>
              } />
              <Route path="/engine-room/approvals" element={
                <AppLayout>
                  <ApprovalsDashboard />
                </AppLayout>
              } />
              <Route path="/engine-room/operations" element={
                <AppLayout>
                  <EngineOperations />
                </AppLayout>
              } />
              <Route path="/engine-room/analyst" element={
                <AppLayout>
                  <Analyst />
                </AppLayout>
              } />
              
              <Route path="*" element={
                <AppLayout>
                  <NotFound />
                </AppLayout>
              } />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </EngineRoomProvider>
    </QueryClientProvider>
  );
};

export default App;
