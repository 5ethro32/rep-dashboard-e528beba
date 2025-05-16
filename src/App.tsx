
import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
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

// Create a client
const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout><Outlet /></AppLayout>,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/rep-performance", element: <RepPerformance /> },
      { path: "/account-performance", element: <AccountPerformance /> },
      { path: "/ai-vera", element: <AIVera /> },
      { path: "/rep-tracker", element: <RepTracker /> },
      { path: "/my-performance", element: <MyPerformance /> },
      { path: "/engine-room", element: <EngineRoom /> },
      { path: "/engine-room/operations", element: <EngineOperations /> },
      { path: "/engine-room/engine", element: <EngineDashboard /> },
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
