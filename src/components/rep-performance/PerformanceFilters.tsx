
import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="mb-6 md:mb-8 flex flex-col md:flex-row gap-4 md:gap-8 md:items-center">
      <div className="flex flex-col">
        <h2 className="text-sm font-medium mb-2 text-white/80">Include Data Sources</h2>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center space-x-2">
            <Switch id="retail-toggle" checked={includeRetail} onCheckedChange={setIncludeRetail} />
            <Label htmlFor="retail-toggle" className="text-white/80 text-sm">Retail</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="reva-toggle" checked={includeReva} onCheckedChange={setIncludeReva} />
            <Label htmlFor="reva-toggle" className="text-white/80 text-sm">REVA</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="wholesale-toggle" checked={includeWholesale} onCheckedChange={setIncludeWholesale} />
            <Label htmlFor="wholesale-toggle" className="text-white/80 text-sm">Wholesale</Label>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col">
        <h2 className="text-sm font-medium mb-2 text-white/80">Select Month</h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px] bg-gray-800/60 border-gray-700">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="February">February</SelectItem>
            <SelectItem value="March">March</SelectItem>
            <SelectItem value="April">April</SelectItem>
            <SelectItem value="May">May</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PerformanceFilters;
