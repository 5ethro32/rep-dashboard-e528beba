
import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  label?: string;
  formatter?: (value: number, max: number) => string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max, 
  color = "#ea384c", 
  label,
  formatter = (value, max) => `${value}/${max}`,
  showPercentage = true
}) => {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className="w-full">
      {label && <div className="text-sm text-finance-gray mb-1">{label}</div>}
      <div className="flex items-center space-x-2">
        <div className="w-full bg-gray-800/50 rounded-full h-2.5 overflow-hidden">
          <div 
            className="h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: color 
            }}
          ></div>
        </div>
        <div className="text-xs whitespace-nowrap text-finance-gray">
          {showPercentage ? `${percentage}%` : formatter(value, max)}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
