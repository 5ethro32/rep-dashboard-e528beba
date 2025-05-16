
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
    console.log('CRITICAL FIX APPLIED: Rule 1b and 2b calculation corrected.');
    console.log('Usage-based uplift is now correctly applied only to Market Low calculations, not AVC calculations.');
    
    // Show toast notification about the fix with more details
    toast({
      title: "Pricing Engine Updates",
      description: "1) Fixed Symbicort pricing issue with proper competitive price detection. 2) Corrected Rule 1b/2b uplift inconsistency - uplift now applied correctly.",
      duration: 7000
    });
    
    navigate('/engine-room/operations');
  }, [navigate, toast]);
  
  return null;
};

export default EngineRoom;
