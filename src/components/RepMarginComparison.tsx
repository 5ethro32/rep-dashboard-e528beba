
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface RepMarginComparisonProps {
  displayData: any[];
  repChanges: Record<string, any>;
  formatPercent: (value: number) => string;
}

const RepMarginComparison: React.FC<RepMarginComparisonProps> = ({ 
  displayData, 
  repChanges, 
  formatPercent 
}) => {
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-6">
      <h3 className="text-lg font-medium mb-4">Margin Comparison</h3>
      <div className="h-80 flex items-end justify-center">
        <div className="w-full h-full flex items-end justify-center">
          <div className="flex items-end space-x-2">
            {displayData.map(item => {
              const repInitials = item.rep.split(' ').map((name: string) => name[0]).join('');
              const barHeight = Math.max(20, (item.margin / 32) * 200);
              const change = repChanges[item.rep] ? repChanges[item.rep].margin : 0;
              const barColor = change > 0 ? 'from-blue-500 to-blue-700' : 'from-blue-400 to-blue-600';
              
              return (
                <div key={item.rep} className="flex flex-col items-center">
                  <div className="relative">
                    {Math.abs(change) >= 0.1 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        {change > 0 ? 
                          <ChevronUp className="h-5 w-5 text-emerald-500" /> : 
                          <ChevronDown className="h-5 w-5 text-finance-red" />
                        }
                      </div>
                    )}
                    <div 
                      className={`w-10 bg-gradient-to-t ${barColor} rounded-t-lg`}
                      style={{ height: `${barHeight}px` }}
                    />
                  </div>
                  <div className="mt-2 text-xs font-bold">{repInitials}</div>
                  <div className="text-xs text-finance-gray">{formatPercent(item.margin)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepMarginComparison;
