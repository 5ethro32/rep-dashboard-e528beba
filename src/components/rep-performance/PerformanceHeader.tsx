
import React from 'react';

interface PerformanceHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

const PerformanceHeader = ({ selectedMonth, setSelectedMonth }: PerformanceHeaderProps) => {
  return (
    <div className="mb-8 pt-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        <span className="text-white">Rep</span><br />
        <span className="text-white">Performance</span><br />
        <span className="text-finance-red">Dashboard</span>
      </h1>
      <p className="text-white/60 text-sm md:text-base mt-4">
        Track sales rep performance metrics over time, analyze trends, and identify growth opportunities.
      </p>
    </div>
  );
};

export default PerformanceHeader;
