
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PerformanceHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

const PerformanceHeader = ({ selectedMonth, setSelectedMonth }: PerformanceHeaderProps) => {
  const months = ['February', 'March', 'April', 'May'];

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  return (
    <div className="mb-8 pt-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        <span className="text-white">Rep</span><br />
        <span className="text-white">Perform<i>a</i>nce</span><br />
        <span className="text-finance-red">Dashboard</span>
      </h1>
      <div className="mt-4">
        <Select value={selectedMonth} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[160px] bg-transparent border-white/20 text-white">
            <SelectValue placeholder={selectedMonth} />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 text-white border-white/20">
            {months.map(month => (
              <SelectItem key={month} value={month}>{month} 2025</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-white/60 text-sm md:text-base mt-4">
        Track sales rep performance metrics over time, analyze trends, and identify growth opportunities.
      </p>
    </div>
  );
};

export default PerformanceHeader;
