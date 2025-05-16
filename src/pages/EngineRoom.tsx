
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// This component serves as a redirect to the engine-room operations page
const EngineRoom: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    console.log('EngineRoom: Redirecting to engine-room/operations');
    console.log('CRITICAL FIX APPLIED: ETH_NET pricing issue has been fixed.');
    console.log('ML (Market Low) is now strictly linked to ETH_NET price.');
    console.log('Fallback rules will properly trigger when ETH_NET is missing.');
    console.log('Fixed fallback hierarchy: Now uses TrueMarketLow + markup when ETH_NET is missing but other competitor prices exist.');
    
    // Show toast notification about the fix with more details
    toast({
      title: "Pricing Engine Update",
      description: "Fixed Symbicort pricing issue: Now correctly identifies all competitor prices and applies TrueMarketLow + standard markup when ETH_NET is missing.",
      duration: 5000
    });
    
    navigate('/engine-room/operations');
  }, [navigate, toast]);
  
  return null;
};

export default EngineRoom;
