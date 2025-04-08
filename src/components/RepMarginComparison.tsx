
import React from 'react';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface RepMarginComparisonProps {
  displayData: any[];
  repChanges: Record<string, any>;
  formatPercent: (value: number) => string;
  isLoading?: boolean;
}

const RepMarginComparison: React.FC<RepMarginComparisonProps> = ({ 
  displayData, 
  repChanges, 
  formatPercent,
  isLoading
}) => {
  const isMobile = useIsMobile();
  
  // Filter out any reps with zero values across all metrics
  const filteredData = displayData.filter(item => 
    item.margin > 0 || 
    item.profit > 0 || 
    item.spend > 0 || 
    item.packs > 0 ||
    item.activeAccounts > 0
  );
  
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-3 md:p-6 backdrop-blur-sm shadow-lg h-full flex flex-col">
      <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 text-white/90">Margin Comparison</h3>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-sm text-finance-gray">Loading data...</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-end justify-center">
          <div className="w-full h-full flex items-end justify-center overflow-x-auto overflow-y-hidden px-1">
            <div className={`flex items-end ${isMobile ? 'space-x-1' : 'space-x-2'} pb-1`}>
              {filteredData.slice(0, isMobile ? 8 : 12).map(item => {
                const repInitials = item.rep.split(' ').map((name: string) => name[0]).join('');
                const maxHeight = isMobile ? 120 : 150;
                const barHeight = Math.max(20, (item.margin / 32) * maxHeight);
                const change = repChanges[item.rep] ? repChanges[item.rep].margin : 0;
                const barColor = 'from-blue-600 to-blue-400';
                
                return (
                  <div key={item.rep} className="flex flex-col items-center">
                    <div className="relative">
                      {Math.abs(change) >= 0.1 && (
                        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                          {change > 0 ? 
                            <ChevronUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" /> : 
                            <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-finance-red" />
                          }
                        </div>
                      )}
                      <div 
                        className={`w-6 md:w-8 bg-gradient-to-t ${barColor} rounded-t-lg transition-all duration-500 ease-in-out`}
                        style={{ height: `${barHeight}px` }}
                      />
                    </div>
                    <div className="mt-2 text-2xs md:text-xs font-bold text-white/80">{repInitials}</div>
                    <div className="text-2xs md:text-xs text-finance-gray">{formatPercent(item.margin)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepMarginComparison;
