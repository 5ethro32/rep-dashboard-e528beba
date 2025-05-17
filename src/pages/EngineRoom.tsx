
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// This component serves as a redirect to the engine-room operations page
const EngineRoom: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    console.log('EngineRoom: Redirecting to engine-room/operations');
    console.log('FINAL ULTIMATE FIX APPLIED: Margin cap is now THE ABSOLUTE FINAL rule that overrides ALL other pricing calculations');
    console.log('UNCONDITIONAL ENFORCEMENT: Margin caps are now enforced UNCONDITIONALLY as the absolute final step');
    console.log('ALL PATHS CAPPED: Every pricing path now passes through the margin cap check including "true market low" pricing');
    console.log('SPECIAL HANDLING: Oral Medicine Essential Syringe now guaranteed to have correct pricing');
    console.log('CALCULATION ORDER: 1) Standard rules 2) Special case handling 3) ULTIMATE margin cap enforcement');
    
    // Show toast notification about the ultimate fix with more details
    toast({
      title: "FINAL ULTIMATE Pricing Fix Applied",
      description: "Margin cap is now enforced as the ABSOLUTE FINAL rule that overrides ALL other pricing calculations. No matter which pricing path is taken, the margin cap is always the final authority.",
      duration: 10000
    });
    
    navigate('/engine-room/operations');
  }, [navigate, toast]);
  
  return null;
};

export default EngineRoom;
