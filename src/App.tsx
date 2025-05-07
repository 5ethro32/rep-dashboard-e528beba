
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
import { useState } from "react";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const isMobile = useIsMobile();
  const [selectedUserId, setSelectedUserId] = useState<string | null>("all");
  const [selectedUserName, setSelectedUserName] = useState<string>("All Data");
  
  const handleSelectUser = (userId: string | null, displayName: string) => {
    console.log(`App.tsx: User selected: ${displayName} (${userId})`);
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
  };

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
          >
            <Outlet />
          </AppLayout>
        </ProtectedRoute>
      }>
        <Route path="/rep-performance" element={<RepPerformance />} />
        <Route 
          path="/account-performance" 
          element={
            <AccountPerformance />
          } 
          // Pass state to route to be accessed via useLocation
          state={{ selectedUserId, selectedUserName }}
        />
        <Route path="/rep-tracker" element={<RepTracker />} />
        <Route path="/my-performance" element={<MyPerformance />} />
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
