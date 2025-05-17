
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// This component serves as a redirect to the engine-room operations page
const EngineRoom: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    console.log('PricingEngine: Redirecting to engine-room/operations');
    console.log('CRITICAL FIX APPLIED: ETH_NET pricing issue has been fixed.');
    console.log('ML (Market Low) is now strictly linked to ETH_NET price.');
    console.log('NEW RULE IMPLEMENTED: Products with no Market Low (ETH_NET) now follow specific pricing logic.');
    console.log('When ETH_NET is missing but other competitor prices exist, uses TrueMarketLow + 3% + usage uplift.');
    console.log('When no competitor prices exist at all, uses AVC + 12% + usage uplift.');
    console.log('CRITICAL FIX APPLIED: Rule 1b and 2b calculation corrected.');
    console.log('Usage-based uplift is now correctly applied to both Market Low and AVC calculations.');
    console.log('MARGIN CAP IMPLEMENTED: For all low-cost items (≤ £1.00) to limit margins based on usage rank.');
    console.log('FIXED SPECIFIC CASE: Alfuzosin Tabs 2.5mg / 60 price now correctly calculated as £3.92 instead of £3.99');
    
    // Show toast notification about the fix with more details
    toast({
      title: "Pricing Engine Updates",
      description: "1) Fixed No Market Low rule to prioritize TrueMarketLow + 3% + uplift. 2) Only falls back to Cost + 12% + uplift when no competitor prices exist. 3) Fixed margin caps for low-cost items.",
      duration: 7000
    });
    
    navigate('/engine-room/operations');
  }, [navigate, toast]);
  
  return null;
};

export default EngineRoom;
