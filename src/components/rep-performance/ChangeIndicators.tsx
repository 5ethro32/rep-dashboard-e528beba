
import React from 'react';
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

interface RenderChangeIndicatorProps {
  changeValue: number;
  size?: "small" | "large";
}

export const RenderChangeIndicator: React.FC<RenderChangeIndicatorProps> = ({ 
  changeValue,
  size = "small"
}) => {
  const isPositive = changeValue > 0;
  
  if (Math.abs(changeValue) < 0.1) return null; // No significant change
  
  if (size === "small") {
    return (
      <span className={`inline-flex items-center ml-1 ${isPositive ? 'text-emerald-500' : 'text-finance-red'}`}>
        {isPositive ? 
          <ChevronUp className="h-4 w-4" /> : 
          <ChevronDown className="h-4 w-4" />
        }
      </span>
    );
  } else {
    return (
      <span className={`inline-flex items-center ml-1 ${isPositive ? 'text-emerald-500' : 'text-finance-red'}`}>
        {isPositive ? 
          <ArrowUp className="h-3.5 w-3.5 md:h-4 md:w-4" /> : 
          <ArrowDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
        }
        <span className="text-xs font-medium ml-0.5">{Math.abs(changeValue).toFixed(1)}%</span>
      </span>
    );
  }
};

export default RenderChangeIndicator;
