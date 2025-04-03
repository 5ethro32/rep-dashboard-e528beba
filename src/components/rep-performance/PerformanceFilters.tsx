
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface PerformanceFiltersProps {
  includeReva: boolean;
  setIncludeReva: (value: boolean) => void;
  includeWholesale: boolean;
  setIncludeWholesale: (value: boolean) => void;
}

const PerformanceFilters: React.FC<PerformanceFiltersProps> = ({ 
  includeReva, 
  setIncludeReva, 
  includeWholesale, 
  setIncludeWholesale 
}) => {
  return (
    <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 justify-between gap-4 mb-8 animate-slide-in-up">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="bg-gray-900/60 p-2 md:p-3 rounded-lg flex items-center backdrop-blur-sm border border-white/5 shadow-lg">
          <Label htmlFor="include-reva" className="text-xs md:text-sm mr-2 text-white/90">Include REVA</Label>
          <Switch 
            id="include-reva" 
            checked={includeReva} 
            onCheckedChange={setIncludeReva}
            className="data-[state=checked]:bg-finance-red"
          />
        </div>
        <div className="bg-gray-900/60 p-2 md:p-3 rounded-lg flex items-center backdrop-blur-sm border border-white/5 shadow-lg">
          <Label htmlFor="include-wholesale" className="text-xs md:text-sm mr-2 text-white/90">Include Wholesale</Label>
          <Switch 
            id="include-wholesale" 
            checked={includeWholesale}
            onCheckedChange={setIncludeWholesale}
            className="data-[state=checked]:bg-finance-red"
          />
        </div>
      </div>
    </div>
  );
};

export default PerformanceFilters;
