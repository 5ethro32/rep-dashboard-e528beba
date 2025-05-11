
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This component now serves as a redirect to the dashboard page
const EngineRoom: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/engine-room/dashboard');
  }, [navigate]);
  
  return null;
};

export default EngineRoom;
