
import React from 'react';
import { ToggleButton } from "@/components/ui/toggle-button";
import { useIsMobile } from '@/hooks/use-mobile';

interface PerformanceFiltersProps {
  includeRetail: boolean;
  setIncludeRetail: (value: boolean) => void;
  includeReva: boolean;
  setIncludeReva: (value: boolean) => void;
  includeWholesale: boolean;
  setIncludeWholesale: (value: boolean) => void;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
}

const PerformanceFilters: React.FC<PerformanceFiltersProps> = ({
  includeRetail,
  setIncludeRetail,
  includeReva,
  setIncludeReva,
  includeWholesale,
  setIncludeWholesale,
  selectedMonth,
  setSelectedMonth
}) => {
  const isMobile = useIsMobile();
  
  // Set smaller width on mobile
  const buttonClasses = isMobile 
    ? "min-w-[65px] px-2" 
    : "min-w-[80px] px-3";
  
  return (
    <div className="mb-6 md:mb-8 flex flex-row gap-2">
      <ToggleButton 
        checked={includeRetail} 
        onToggle={setIncludeRetail}
        className={buttonClasses}
      >
        Retail
      </ToggleButton>
      
      <ToggleButton 
        checked={includeReva} 
        onToggle={setIncludeReva}
        className={buttonClasses}
      >
        REVA
      </ToggleButton>
      
      <ToggleButton 
        checked={includeWholesale} 
        onToggle={setIncludeWholesale}
        className={buttonClasses}
      >
        Wholesale
      </ToggleButton>
    </div>
  );
};

export default PerformanceFilters;
