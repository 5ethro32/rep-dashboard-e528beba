
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
    <div className="mb-6 md:mb-8 flex flex-row flex-wrap justify-between items-center gap-3">
      <div className="flex flex-wrap gap-3">
        <ToggleButton 
          checked={includeRetail} 
          onToggle={setIncludeRetail}
          className="min-w-[100px]"
        >
          Retail
        </ToggleButton>
        
        <ToggleButton 
          checked={includeReva} 
          onToggle={setIncludeReva}
          className="min-w-[100px]"
        >
          REVA
        </ToggleButton>
        
        <ToggleButton 
          checked={includeWholesale} 
          onToggle={setIncludeWholesale}
          className="min-w-[100px]"
        >
          Wholesale
        </ToggleButton>
      </div>
    </div>
  );
};

export default PerformanceFilters;
