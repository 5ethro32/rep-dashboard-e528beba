
import React, { useState } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useLocation
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { EngineRoomProvider } from "@/contexts/EngineRoomContext";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import RepPerformance from "@/pages/RepPerformance";
import AccountPerformance from "@/pages/AccountPerformance";
import AIVera from "@/pages/AIVera";
import RepTracker from "@/pages/RepTracker";
import MyPerformance from "@/pages/MyPerformance";
import EngineRoom from "@/pages/EngineRoom";
import EngineOperations from "@/pages/engine-room/EngineOperations";
import EngineDashboard from "@/pages/engine-room/EngineDashboard";
import ApprovalsDashboard from "@/pages/engine-room/ApprovalsDashboard";
import RuleSimulator from "@/pages/engine-room/RuleSimulator";
import NotFound from "@/pages/NotFound";
import PricingAnalytics from "@/pages/engine-room/PricingAnalytics";
import Auth from "@/pages/Auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Create a client
const queryClient = new QueryClient();

// AppLayoutWrapper to handle shared state and props for each route
const AppLayoutWrapper = () => {
  const location = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>("all");
  const [selectedUserName, setSelectedUserName] = useState<string>("All Data");
  const [selectedMonth, setSelectedMonth] = useState<string>("March");
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle user selection that gets passed to the header
  const handleUserSelection = (userId: string | null, displayName: string) => {
    console.log(`App: User selection changed to ${displayName} (${userId})`);
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
  };
  
  // Handle global refresh
  const handleRefresh = () => {
    console.log('App: Global refresh triggered');
    setIsLoading(true);
    
    // Check if we're on My Dashboard and use its refresh handler
    if (location.pathname === '/my-performance' && window.myDashboardRefresh) {
      window.myDashboardRefresh();
    }
    // Check if we're on Rep Performance and use its refresh handler
    else if (location.pathname === '/rep-performance' && window.repPerformanceRefresh) {
      window.repPerformanceRefresh();
    }
    
    // Simple timeout to simulate refresh - actual logic will come from pages
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };
  
  // Determine if we should show user selector based on current route
  const showUserSelector = ['/rep-tracker', '/account-performance', '/my-performance'].includes(location.pathname);
  
  return (
    <AppLayout 
      showChatInterface={true}
      selectedMonth={selectedMonth}
      selectedUserId={selectedUserId}
      onSelectUser={handleUserSelection}
      showUserSelector={showUserSelector}
      onRefresh={handleRefresh}
      isLoading={isLoading}
    >
      <Outlet />
    </AppLayout>
  );
};

const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/",
    element: <ProtectedRoute><AppLayoutWrapper /></ProtectedRoute>,
    children: [
      { path: "/", element: <Navigate to="/rep-performance" replace /> }, // Redirect root to rep-performance
      { path: "/rep-performance", element: <RepPerformance /> },
      { path: "/account-performance", element: <AccountPerformance /> },
      { path: "/ai-vera", element: <AIVera /> },
      { path: "/rep-tracker", element: <RepTracker /> },
      { 
        path: "/my-performance", 
        element: <MyPerformance 
                   selectedUserId={null}  
                   selectedUserName="My Data"
                   onSelectUser={undefined}  
                 />
      },
      { path: "/engine-room", element: <EngineRoom /> },
      { path: "/engine-room/operations", element: <EngineOperations /> },
      { path: "/engine-room/engine", element: <Navigate to="/engine-room/operations" replace /> }, // Redirect old "engine" route to Operations
      { path: "/engine-room/dashboard", element: <EngineDashboard /> },
      { path: "/engine-room/approvals", element: <ApprovalsDashboard /> },
      { path: "/engine-room/simulator", element: <RuleSimulator /> },
      { path: "/engine-room/analytics", element: <PricingAnalytics /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EngineRoomProvider>
          <RouterProvider router={router} />
        </EngineRoomProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
