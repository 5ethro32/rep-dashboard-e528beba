
import React from 'react';
import { ChevronUp, ChevronDown, Loader2, Minus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface RepMarginComparisonProps {
  displayData: any[];
  repChanges: Record<string, any>;
  formatPercent: (value: number) => string;
  isLoading?: boolean;
  showChangeIndicators?: boolean;
}

const RepMarginComparison: React.FC<RepMarginComparisonProps> = ({ 
  displayData, 
  repChanges, 
  formatPercent, 
  isLoading,
  showChangeIndicators = true
}) => {
  const isMobile = useIsMobile();
  
  // Sort by margin (highest to lowest)
  const sortedData = [...displayData].sort((a, b) => b.margin - a.margin);
  
  // Only show top 8 on mobile, top 12 otherwise
  const limitedData = sortedData.slice(0, isMobile ? 8 : 12);
  
  // Calculate the average margin across all reps
  const averageMargin = displayData.length > 0 ? 
    displayData.reduce((sum, item) => sum + item.margin, 0) / displayData.length : 0;
  
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
          <div className="w-full h-full flex items-end justify-center overflow-x-auto px-1">
            <div className={`flex items-end ${isMobile ? 'space-x-1' : 'space-x-2'} pb-1`}>
              {limitedData.map(item => {
                const repInitials = item.rep.split(' ').map((name: string) => name[0]).join('');
                const maxMargin = displayData.reduce((max, item) => Math.max(max, item.margin), 0);
                const maxHeight = isMobile ? 120 : 150;
                const barHeight = Math.max(20, (item.margin / maxMargin) * maxHeight);
                const change = repChanges[item.rep] ? repChanges[item.rep].margin : 0;
                const barColor = 'from-blue-500 to-blue-600/70'; // Keep the blue color
                const previousValue = item.margin - (change || 0);
                
                return (
                  <TooltipProvider key={item.rep}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            {showChangeIndicators && Math.abs(change) >= 0.1 ? (
                              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                                {change > 0 ? 
                                  <ChevronUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" /> : 
                                  <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-finance-red" />
                                }
                              </div>
                            ) : showChangeIndicators ? (
                              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                                <Minus className="h-4 w-4 md:h-5 md:w-5 text-finance-gray font-bold" />
                              </div>
                            ) : null}
                            <div 
                              className={`w-6 md:w-8 bg-gradient-to-t ${barColor} rounded-t-lg transition-all duration-500 ease-in-out hover:opacity-80 cursor-pointer`}
                              style={{ height: `${barHeight}px` }}
                            />
                          </div>
                          <div className="mt-2 text-2xs md:text-xs font-bold text-white/80">{repInitials}</div>
                          <div className="text-2xs md:text-xs text-finance-gray">{formatPercent(item.margin)}</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-white/10 text-white">
                        <div className="p-1">
                          <p className="font-medium">{item.rep}</p>
                          <p>Margin: {formatPercent(item.margin)}</p>
                          {showChangeIndicators && Math.abs(change) >= 0.1 ? (
                            <p className={change > 0 ? "text-emerald-400" : "text-finance-red"}>
                              Change: {change > 0 ? "+" : ""}{formatPercent(change).replace("%", "")}%
                            </p>
                          ) : showChangeIndicators ? (
                            <p className="text-finance-gray">No change</p>
                          ) : null}
                          {showChangeIndicators && (
                            <p className="text-finance-gray mt-1 text-xs">
                              Previous: {formatPercent(previousValue)}
                            </p>
                          )}
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

export default RepMarginComparison;
