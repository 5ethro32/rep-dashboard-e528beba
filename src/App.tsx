import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";
import AppLayout from "./components/layout/AppLayout";
import RepPerformance from "./pages/RepPerformance";
import AccountPerformance from "./pages/AccountPerformance";
import AIVera from "./pages/AIVera";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DataUpload from "./pages/DataUpload";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RepTracker from "./pages/RepTracker";
import React, { ReactNode } from "react";
import "@/App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<RepPerformance />} />
              <Route path="/rep-performance" element={<RepPerformance />} />
              <Route path="/account-performance" element={<AccountPerformance />} />
              <Route path="/ai-vera" element={<AIVera />} />
              <Route path="/upload" element={<DataUpload />} />
              <Route path="/rep-tracker" element={<RepTracker />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
