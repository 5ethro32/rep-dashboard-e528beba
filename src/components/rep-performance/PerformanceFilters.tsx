
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface PerformanceFiltersProps {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
}

const PerformanceFilters: React.FC<PerformanceFiltersProps> = ({
  selectedMonth,
  setSelectedMonth
}) => {
  return (
    <div className="mb-6 md:mb-8 flex flex-col md:flex-row gap-4 md:gap-8 md:items-center">
      <div className="flex flex-col">
        <h2 className="text-sm font-medium mb-2 text-white/80">Select Month</h2>
        <ToggleGroup 
          type="single" 
          value={selectedMonth}
          onValueChange={(value) => value && setSelectedMonth(value)}
          className="space-x-2"
        >
          <ToggleGroupItem value="February">February</ToggleGroupItem>
          <ToggleGroupItem value="March">March</ToggleGroupItem>
          <ToggleGroupItem value="April">April</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};

export default PerformanceFilters;
