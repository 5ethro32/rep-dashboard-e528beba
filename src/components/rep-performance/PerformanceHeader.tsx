
import React from 'react';

interface PerformanceHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

const PerformanceHeader = ({ selectedMonth, setSelectedMonth }: PerformanceHeaderProps) => {
  return (
    <div className="mb-8 pt-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        <span className="bg-gradient-to-r from-finance-red to-finance-red/80 text-transparent bg-clip-text">Rep Performance</span>
      </h1>
      <p className="text-white/60 text-sm md:text-base">
        Track sales rep performance metrics over time, analyze trends, and identify growth opportunities.
      </p>
    </div>
  );
};

export default PerformanceHeader;
