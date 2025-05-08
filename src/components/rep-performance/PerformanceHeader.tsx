
import React from 'react';

interface PerformanceHeaderProps {
  hideTitle?: boolean;
  reducedPadding?: boolean; // For reduced padding
  selectedMonth?: string;
  setSelectedMonth?: (value: string) => void;
}

const PerformanceHeader: React.FC<PerformanceHeaderProps> = ({ 
  hideTitle = false,
  reducedPadding = false,
  selectedMonth,
  setSelectedMonth
}) => {
  // Determine padding classes based on the reducedPadding prop
  const paddingClasses = reducedPadding 
    ? 'py-4' // More balanced padding for top and bottom
    : 'py-8 md:py-16'; // Original padding
    
  return (
    <header className={`${hideTitle ? '' : paddingClasses} px-4 md:px-6 container max-w-7xl mx-auto animate-fade-in bg-transparent ${hideTitle ? 'flex justify-between items-center' : ''}`}>
      {!hideTitle && (
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
          Rep
          <br />
          Perform<span className="font-normal italic mr-1 -ml-0.5">a</span>nce
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-finance-red to-rose-700">Dashboard</span>
        </h1>
      )}
    </header>
  );
};

export default PerformanceHeader;
