
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RepPerformance from "./pages/RepPerformance";
import AccountPerformance from "./pages/AccountPerformance";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RepTracker from "./pages/RepTracker";
import AIVera from "./pages/AIVera"; 
import MyPerformance from "./pages/MyPerformance"; // Add import for new page
import AppLayout from "./components/layout/AppLayout";
import { useIsMobile } from "./hooks/use-mobile";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const isMobile = useIsMobile();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/rep-performance" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route 
        path="/rep-performance" 
        element={
          <ProtectedRoute>
            <AppLayout showChatInterface={!isMobile}>
              <RepPerformance />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/account-performance" 
        element={
          <ProtectedRoute>
            <AccountPerformance />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/rep-tracker" 
        element={
          <ProtectedRoute>
            <RepTracker />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-performance" 
        element={
          <ProtectedRoute>
            <MyPerformance />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ai-vera" 
        element={
          <ProtectedRoute>
            <AppLayout showChatInterface={false}>
              <AIVera />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
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
