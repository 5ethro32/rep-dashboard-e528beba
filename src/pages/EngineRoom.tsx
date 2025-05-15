
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This component serves as a redirect to the engine-room operations page
const EngineRoom: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('EngineRoom: Redirecting to engine-room/operations');
    navigate('/engine-room/operations');
  }, [navigate]);
  
  return null;
};

export default EngineRoom;

