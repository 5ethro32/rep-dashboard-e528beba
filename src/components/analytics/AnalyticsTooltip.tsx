
import React from 'react';

interface AnalyticsTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  title?: string;
  formatter?: (value: number, name: string) => [string, string];
  className?: string;
}

const AnalyticsTooltip: React.FC<AnalyticsTooltipProps> = ({
  active,
  payload,
  label,
  title,
  formatter,
  className
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gray-800/90 border border-white/10 rounded-lg p-3 shadow-lg backdrop-blur-sm ${className}`}>
      {title ? (
        <div className="font-medium text-white mb-1">{title}</div>
      ) : (
        label && <div className="font-medium text-white mb-1">{label}</div>
      )}
      
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const formattedValue = formatter 
            ? formatter(entry.value, entry.name)[0] 
            : typeof entry.value === 'number'
              ? entry.value.toLocaleString()
              : entry.value;
          
          const formattedName = formatter 
            ? formatter(entry.value, entry.name)[1] 
            : entry.name;
          
          return (
            <div 
              key={`tooltip-item-${index}`} 
              className="flex items-center text-xs md:text-sm text-white/90"
            >
              <div 
                className="w-3 h-3 mr-2 rounded-sm" 
                style={{ backgroundColor: entry.color || entry.fill || '#999' }} 
              />
              <span className="mr-2">{formattedName}:</span>
              <span className="font-medium">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalyticsTooltip;
