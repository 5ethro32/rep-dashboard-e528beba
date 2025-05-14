
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
              <Route element={<AppLayout />}>
                <Route path="/" element={<RepPerformance />} />
                <Route path="/rep-performance" element={<RepPerformance />} />
                <Route path="/account-performance" element={<AccountPerformance />} />
                <Route path="/my-performance" element={<MyPerformance />} />
                <Route path="/ai-vera" element={<AIVera />} />
                <Route path="/rep-tracker" element={<RepTracker />} />
                <Route path="/data-upload" element={<DataUpload />} />
                
                <Route path="/engine-room" element={<EngineRoom />} />
                <Route path="/engine-room/dashboard" element={<EngineDashboard />} />
                <Route path="/engine-room/rule-simulator" element={<RuleSimulator />} />
                <Route path="/engine-room/approvals" element={<ApprovalsDashboard />} />
                <Route path="/engine-room/operations" element={<EngineOperations />} />
                <Route path="/engine-room/analyst" element={<Analyst />} />
                
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </EngineRoomProvider>
    </QueryClientProvider>
  );
};

export default App;
