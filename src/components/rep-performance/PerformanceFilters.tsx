
import React from 'react';
import { ToggleButton } from "@/components/ui/toggle-button";

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
  return (
    <div className="mb-6 md:mb-8 flex flex-row gap-2">
      <ToggleButton 
        checked={includeRetail} 
        onToggle={setIncludeRetail}
        className="min-w-[80px]"
      >
        Retail
      </ToggleButton>
      
      <ToggleButton 
        checked={includeReva} 
        onToggle={setIncludeReva}
        className="min-w-[80px]"
      >
        REVA
      </ToggleButton>
      
      <ToggleButton 
        checked={includeWholesale} 
        onToggle={setIncludeWholesale}
        className="min-w-[80px]"
      >
        Wholesale
      </ToggleButton>
    </div>
  );
};

export default PerformanceFilters;
