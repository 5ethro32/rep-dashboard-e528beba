
import React from 'react';
import { ChevronUp, ChevronDown, Loader2, Minus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface RepProfitChartProps {
  displayData: any[];
  repChanges: Record<string, any>;
  formatCurrency: (value: number, decimals?: number) => string;
  isLoading?: boolean;
}

const RepProfitChart: React.FC<RepProfitChartProps> = ({ 
  displayData, 
  repChanges, 
  formatCurrency,
  isLoading 
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-3 md:p-6 backdrop-blur-sm shadow-lg h-full flex flex-col">
      <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 text-white/90">Profit Distribution</h3>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-sm text-finance-gray">Loading data...</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-end justify-center">
          <div className="w-full h-full flex items-end justify-center overflow-x-auto px-1">
            <div className={`flex items-end ${isMobile ? 'space-x-1' : 'space-x-2'} pb-1`}>
              {displayData.slice(0, isMobile ? 8 : 12).map(item => {
                const repInitials = item.rep.split(' ').map((name: string) => name[0]).join('');
                const maxProfit = displayData.reduce((max, item) => Math.max(max, item.profit), 0);
                const maxHeight = isMobile ? 120 : 150;
                const barHeight = Math.max(20, (item.profit / maxProfit) * maxHeight);
                const change = repChanges[item.rep] ? repChanges[item.rep].profit : 0;
                const barColor = 'from-finance-red to-finance-red/70';
                
                return (
                  <TooltipProvider key={item.rep}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            {Math.abs(change) >= 0.1 ? (
                              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                                {change > 0 ? 
                                  <ChevronUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" /> : 
                                  <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-finance-red" />
                                }
                              </div>
                            ) : (
                              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                                <Minus className="h-4 w-4 md:h-5 md:w-5 text-finance-gray font-bold" />
                              </div>
                            )}
                            <div 
                              className={`w-6 md:w-8 bg-gradient-to-t ${barColor} rounded-t-lg transition-all duration-500 ease-in-out hover:opacity-80 cursor-pointer`}
                              style={{ height: `${barHeight}px` }}
                            />
                          </div>
                          <div className="mt-2 text-2xs md:text-xs font-bold text-white/80">{repInitials}</div>
                          <div className="text-2xs md:text-xs text-finance-gray">{formatCurrency(item.profit, 0)}</div>
                          {Math.abs(change) >= 0.1 && (
                            <div className="text-2xs text-finance-gray">
                              {formatCurrency(item.profit / (1 + (change || 0) / 100), 0)}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-white/10 text-white">
                        <div className="p-1">
                          <p className="font-medium">{item.rep}</p>
                          <p>Profit: {formatCurrency(item.profit)}</p>
                          {Math.abs(change) >= 0.1 ? (
                            <p className={change > 0 ? "text-emerald-400" : "text-finance-red"}>
                              Change: {change > 0 ? "+" : ""}{change.toFixed(1)}%
                            </p>
                          ) : (
                            <p className="text-finance-gray">No change</p>
                          )}
                          <p className="text-finance-gray mt-1 text-xs">
                            Previous: {formatCurrency(item.profit / (1 + (change || 0) / 100))}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepProfitChart;
