
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PerformanceHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

const PerformanceHeader: React.FC<PerformanceHeaderProps> = ({ 
  selectedMonth,
  setSelectedMonth
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-6 pb-4 md:pb-6 gap-2 md:gap-0">
      <div className="mb-2 md:mb-0">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Rep Performance</h1>
        <p className="text-xs md:text-sm text-finance-gray">
          Analysis of sales representative performance metrics and trends
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs md:text-sm text-finance-gray">
          Viewing:
        </span>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-32 md:w-40 h-8 md:h-10">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="February">February 2025</SelectItem>
            <SelectItem value="March">March 2025</SelectItem>
            <SelectItem value="April">April 2025 MTD</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PerformanceHeader;
