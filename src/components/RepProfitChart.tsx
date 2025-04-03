
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface RepProfitChartProps {
  displayData: any[];
  repChanges: Record<string, any>;
  formatCurrency: (value: number, decimals?: number) => string;
}

const RepProfitChart: React.FC<RepProfitChartProps> = ({ displayData, repChanges, formatCurrency }) => {
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-6">
      <h3 className="text-lg font-medium mb-4">Profit Distribution</h3>
      <div className="h-80 flex items-end justify-center">
        <div className="w-full h-full flex items-end justify-center">
          <div className="flex items-end space-x-2">
            {displayData.map(item => {
              const repInitials = item.rep.split(' ').map((name: string) => name[0]).join('');
              const maxProfit = displayData.reduce((max, item) => Math.max(max, item.profit), 0);
              const barHeight = Math.max(20, (item.profit / maxProfit) * 200);
              const change = repChanges[item.rep] ? repChanges[item.rep].profit : 0;
              const barColor = change > 0 ? 'from-finance-red to-finance-red/70' : 'from-finance-red/70 to-finance-red/50';
              
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
                  <div className="text-xs text-finance-gray">{formatCurrency(item.profit, 0)}</div>
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
