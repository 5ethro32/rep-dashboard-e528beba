
import React from "react";
import { Navigate } from "react-router-dom";

// This component will redirect to the rep-performance page since that appears to be our main dashboard
const Dashboard: React.FC = () => {
  return <Navigate to="/rep-performance" replace />;
};

export default Dashboard;
