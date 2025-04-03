
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface RepProfitChartProps {
  displayData: any[];
  repChanges: Record<string, any>;
  formatCurrency: (value: number, decimals?: number) => string;
}

const RepProfitChart: React.FC<RepProfitChartProps> = ({ displayData, repChanges, formatCurrency }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-3 md:p-6">
      <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">Profit Distribution</h3>
      <div className="h-60 md:h-80 flex items-end justify-center">
        <div className="w-full h-full flex items-end justify-center">
          <div className={`flex items-end ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
            {displayData.map(item => {
              const repInitials = item.rep.split(' ').map((name: string) => name[0]).join('');
              const maxProfit = displayData.reduce((max, item) => Math.max(max, item.profit), 0);
              const barHeight = Math.max(20, (item.profit / maxProfit) * (isMobile ? 150 : 200));
              const change = repChanges[item.rep] ? repChanges[item.rep].profit : 0;
              const barColor = change > 0 ? 'from-finance-red to-finance-red/70' : 'from-finance-red/70 to-finance-red/50';
              
              return (
                <div key={item.rep} className="flex flex-col items-center">
                  <div className="relative">
                    {Math.abs(change) >= 0.1 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        {change > 0 ? 
                          <ChevronUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" /> : 
                          <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-finance-red" />
                        }
                      </div>
                    )}
                    <div 
                      className={`w-6 md:w-10 bg-gradient-to-t ${barColor} rounded-t-lg`}
                      style={{ height: `${barHeight}px` }}
                    />
                  </div>
                  <div className="mt-2 text-2xs md:text-xs font-bold">{repInitials}</div>
                  <div className="text-2xs md:text-xs text-finance-gray">{formatCurrency(item.profit, 0)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepProfitChart;
