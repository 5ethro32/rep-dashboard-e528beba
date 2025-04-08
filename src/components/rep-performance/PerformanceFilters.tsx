
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface PerformanceFiltersProps {
  includeRetail: boolean;
  setIncludeRetail: (value: boolean) => void;
  includeReva: boolean;
  setIncludeReva: (value: boolean) => void;
  includeWholesale: boolean;
  setIncludeWholesale: (value: boolean) => void;
}

const PerformanceFilters: React.FC<PerformanceFiltersProps> = ({ 
  includeRetail,
  setIncludeRetail,
  includeReva, 
  setIncludeReva, 
  includeWholesale, 
  setIncludeWholesale 
}) => {
  return (
    <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 justify-between gap-4 mb-8 animate-slide-in-up">
      <div className="flex flex-row gap-2 overflow-x-auto pb-1 w-full justify-start">
        <div className="bg-gray-900/60 p-2 rounded-lg flex items-center backdrop-blur-sm border border-white/5 shadow-lg whitespace-nowrap min-w-[90px]">
          <Label htmlFor="include-retail" className="text-xs mr-2 text-white/90">Retail</Label>
          <Switch 
            id="include-retail" 
            checked={includeRetail} 
            onCheckedChange={setIncludeRetail}
            className="data-[state=checked]:bg-finance-red"
          />
        </div>
        <div className="bg-gray-900/60 p-2 rounded-lg flex items-center backdrop-blur-sm border border-white/5 shadow-lg whitespace-nowrap min-w-[90px]">
          <Label htmlFor="include-reva" className="text-xs mr-2 text-white/90">Reva</Label>
          <Switch 
            id="include-reva" 
            checked={includeReva} 
            onCheckedChange={setIncludeReva}
            className="data-[state=checked]:bg-finance-red"
          />
        </div>
        <div className="bg-gray-900/60 p-2 rounded-lg flex items-center backdrop-blur-sm border border-white/5 shadow-lg whitespace-nowrap min-w-[90px]">
          <Label htmlFor="include-wholesale" className="text-xs mr-2 text-white/90">Wholesale</Label>
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
