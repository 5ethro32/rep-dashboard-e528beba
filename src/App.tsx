
import React, { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import RepPerformance from "./pages/RepPerformance";
import AccountPerformance from "./pages/AccountPerformance";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RepTracker from "./pages/RepTracker";
import AIVera from "./pages/AIVera"; 
import MyPerformance from "./pages/MyPerformance";
import AppLayout from "./components/layout/AppLayout";
import { useIsMobile } from "./hooks/use-mobile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppRoutes = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>("all");
  const [selectedUserName, setSelectedUserName] = useState<string>("All Data");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSelectUser = (userId: string | null, displayName: string) => {
    console.log(`App.tsx: User selection changed to ${displayName} (${userId})`);
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
  };

  // Global refresh handler that can be used by all components
  const handleGlobalRefresh = useCallback(async () => {
    console.log("Global refresh triggered in App.tsx");
    setIsLoading(true);
    
    try {
      // Invalidate all queries to trigger a refetch
      await queryClient.invalidateQueries();
      console.log("All queries invalidated");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000); // Ensure loading indicator shows for at least 1 second
    }
  }, [queryClient]);

  // Create wrapper components that handle refreshing for each page
  const RepPerformanceWithRefresh = () => {
    return (
      <RepPerformance />
    );
  };
  
  // Create a wrapper component that will pass props to AccountPerformance
  const AccountPerformanceWithProps = () => {
    return (
      <AccountPerformance 
        selectedUserId={selectedUserId} 
        selectedUserName={selectedUserName}
      />
    );
  };
  
  // Create a wrapper component that will pass props to RepTracker
  const RepTrackerWithProps = () => {
    return (
      <RepTracker 
        selectedUserId={selectedUserId} 
        selectedUserName={selectedUserName}
      />
    );
  };

  // Create a wrapper component that will pass props to MyPerformance
  const MyPerformanceWithProps = () => {
    return (
      <MyPerformance 
        selectedUserId={selectedUserId} 
        selectedUserName={selectedUserName}
      />
    );
  };
  
  // Determine if we should disable the global refresh for certain routes
  // where page-specific refresh is preferred
  const disableGlobalRefresh = location.pathname === '/rep-performance';

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/rep-performance" replace />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Main Layout Routes */}
      <Route element={
        <ProtectedRoute>
          <AppLayout 
            showChatInterface={!isMobile}
            selectedUserId={selectedUserId}
            onSelectUser={handleSelectUser}
            showUserSelector={true}
            onRefresh={disableGlobalRefresh ? undefined : handleGlobalRefresh}
            isLoading={isLoading}
          >
            <Outlet />
          </AppLayout>
        </ProtectedRoute>
      }>
        <Route path="/rep-performance" element={<RepPerformanceWithRefresh />} />
        <Route 
          path="/account-performance" 
          element={<AccountPerformanceWithProps />} 
        />
        <Route 
          path="/rep-tracker" 
          element={<RepTrackerWithProps />} 
        />
        <Route 
          path="/my-performance" 
          element={<MyPerformanceWithProps />} 
        />
        <Route path="/ai-vera" element={<AIVera />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
