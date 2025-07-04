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
import InventoryAnalytics from "@/pages/engine-room/InventoryAnalytics";
import Auth from "@/pages/Auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Create a client
const queryClient = new QueryClient();

// AppLayoutWrapper to handle shared state and props for each route
const AppLayoutWrapper = () => {
  const location = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>("all");
  const [selectedUserName, setSelectedUserName] = useState<string>("All Data");
  const [selectedMonth, setSelectedMonth] = useState<string>("July");
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
    
    // Simple timeout to simulate refresh - actual logic will come from pages
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };
  
  // Determine if we should show user selector based on current route
  const showUserSelector = ['/rep-tracker', '/account-performance', '/my-performance'].includes(location.pathname);
  
  // Render the appropriate page component with props
  const renderPageComponent = () => {
    switch (location.pathname) {
      case '/':
        return <Navigate to="/rep-performance" replace />;
      case '/rep-performance':
        return <RepPerformance />;
      case '/account-performance':
        return <AccountPerformance selectedUserId={selectedUserId} selectedUserName={selectedUserName} />;
      case '/ai-vera':
        return <AIVera />;
      case '/rep-tracker':
        return <RepTracker selectedUserId={selectedUserId} selectedUserName={selectedUserName} />;
      case '/my-performance':
        return <MyPerformance selectedUserId={selectedUserId} selectedUserName={selectedUserName} />;
      case '/engine-room':
        return <EngineRoom />;
      case '/engine-room/operations':
        return <EngineOperations />;
      case '/engine-room/engine':
        return <Navigate to="/engine-room/operations" replace />;
      case '/engine-room/dashboard':
        return <EngineDashboard />;
      case '/engine-room/approvals':
        return <ApprovalsDashboard />;
      case '/engine-room/simulator':
        return <RuleSimulator />;
      case '/engine-room/analytics':
        return <PricingAnalytics />;
      case '/engine-room/inventory':
        return <InventoryAnalytics />;
      default:
        return <NotFound />;
    }
  };
  
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
      {renderPageComponent()}
    </AppLayout>
  );
};

const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/*",
    element: <ProtectedRoute><AppLayoutWrapper /></ProtectedRoute>,
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
