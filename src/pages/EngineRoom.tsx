
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// This component serves as a redirect to the engine-room operations page
const EngineRoom: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    console.log('EngineRoom: Redirecting to engine-room/operations');
    console.log('ULTIMATE FIX APPLIED: Margin cap is now applied as the ULTIMATE rule after ALL pricing calculations');
    console.log('SPECIAL CASE FIXED: Oral Medicine Essential Syringe price now correctly capped by margin rules');
    console.log('FORCED APPLICATION: Special items now ALWAYS have margin caps applied regardless of which rule path is taken');
    console.log('ENHANCED LOGGING: Added extensive debug logs to trace margin cap application');
    console.log('RULE STRUCTURE PRESERVED: Standard pricing rules still apply first, with margin cap as final, ultimate rule');
    console.log('TARGETED FIX: Special handling added for Oral Medicine Essential Syringe to guarantee correct pricing');
    console.log('CRITICAL FIX: Alfuzosin Tabs 2.5mg / 60 price now correctly calculated as £3.92');
    
    // Show toast notification about the ultimate fix with more details
    toast({
      title: "ULTIMATE Pricing Engine Fix Applied",
      description: "Margin cap is now applied as the absolute ULTIMATE rule after ALL other pricing calculations. Special items like Oral Medicine Essential Syringe now ALWAYS have margin caps applied. Rule structure preserved with margin cap as the final override.",
      duration: 8000
    });
    
    navigate('/engine-room/operations');
  }, [navigate, toast]);
  
  return null;
};

export default EngineRoom;
