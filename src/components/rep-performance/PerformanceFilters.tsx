
import React from 'react';
import { ToggleButton } from "@/components/ui/toggle-button";
import { Store, Factory, Pharmacy } from 'lucide-react';

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
    <div className="mb-6 md:mb-8 flex flex-row gap-3">
      <ToggleButton 
        checked={includeRetail} 
        onToggle={setIncludeRetail}
        className="min-w-[100px]"
      >
        <Store className="h-4 w-4 mr-2" /> Retail
      </ToggleButton>
      
      <ToggleButton 
        checked={includeReva} 
        onToggle={setIncludeReva}
        className="min-w-[100px]"
      >
        <Pharmacy className="h-4 w-4 mr-2" /> REVA
      </ToggleButton>
      
      <ToggleButton 
        checked={includeWholesale} 
        onToggle={setIncludeWholesale}
        className="min-w-[100px]"
      >
        <Factory className="h-4 w-4 mr-2" /> Wholesale
      </ToggleButton>
    </div>
  );
};

export default PerformanceFilters;
