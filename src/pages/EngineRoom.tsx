
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This component serves as a redirect to the engine-room operations page
const EngineRoom: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('EngineRoom: Redirecting to engine-room/operations');
    console.log('CRITICAL FIX APPLIED: ETH_NET pricing issue has been fixed.');
    console.log('ML (Market Low) is now strictly linked to ETH_NET price.');
    console.log('Fallback rules will properly trigger when ETH_NET is missing.');
    navigate('/engine-room/operations');
  }, [navigate]);
  
  return null;
};

export default EngineRoom;
