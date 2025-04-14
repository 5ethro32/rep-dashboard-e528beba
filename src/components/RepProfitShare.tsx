
import React from 'react';
import DonutChart from './DonutChart';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

interface RepProfitShareProps {
  displayData: any[];
  repChanges: Record<string, any>;
  isLoading?: boolean;
  showChangeIndicators?: boolean;
}

const RepProfitShare: React.FC<RepProfitShareProps> = ({ 
  displayData, 
  repChanges, 
  isLoading,
  showChangeIndicators = true
}) => {
  const isMobile = useIsMobile();
  
  const totalProfit = displayData.reduce((sum, item) => sum + item.profit, 0);
  
  // Enhanced color palette with better contrast
  const colors = [
    "#ef4444",   // Red
    "#f97316",   // Orange
    "#eab308",   // Yellow
    "#10b981",   // Green
    "#0ea5e9",   // Light Blue
    "#6366f1",   // Indigo
    "#8b5cf6",   // Purple
    "#ec4899",   // Pink
    "#14b8a6",   // Teal
    "#f43f5e",   // Rose
    "#d946ef",   // Fuchsia
    "#a855f7",   // Violet
  ];
  
  const chartData = displayData.map((item, index) => {
    const percentage = (item.profit / totalProfit) * 100;
    const prevProfit = item.profit / (1 + (repChanges[item.rep]?.profit || 0) / 100);
    const prevPercentage = (prevProfit / (totalProfit / (1 + (repChanges[item.rep]?.profit || 0) / 100))) * 100;
    
    return {
      name: item.rep,
      value: Math.round(percentage),
      color: colors[index % colors.length],
      profit: item.profit,
      prevProfit: prevProfit,
      prevPercentage: Number(prevPercentage.toFixed(1)),
      change: repChanges[item.rep] ? repChanges[item.rep].profit : 0
    };
  });
  
  chartData.sort((a, b) => b.value - a.value);
  
  const filteredData = chartData.filter(item => item.value >= 1);
  
  if (filteredData.length < chartData.length) {
    const othersValue = chartData
      .filter(item => item.value < 1)
      .reduce((sum, item) => sum + item.value, 0);
      
    if (othersValue > 0) {
      filteredData.push({
        name: "Others",
        value: Math.round(othersValue),
        color: "#6b7280",
        profit: chartData.filter(item => item.value < 1).reduce((sum, item) => sum + item.profit, 0),
        prevProfit: chartData.filter(item => item.value < 1).reduce((sum, item) => sum + item.prevProfit, 0),
        prevPercentage: chartData.filter(item => item.value < 1).reduce((sum, item) => sum + item.prevPercentage, 0),
        change: 0
      });
    }
  }
  
  const mobileData = isMobile && filteredData.length > 5 
    ? [
        ...filteredData.slice(0, 4), 
        {
          name: "Others",
          value: filteredData.slice(4).reduce((sum, item) => sum + item.value, 0),
          color: "#6b7280",
          profit: filteredData.slice(4).reduce((sum, item) => sum + item.profit, 0),
          prevProfit: filteredData.slice(4).reduce((sum, item) => sum + item.prevProfit, 0),
          prevPercentage: filteredData.slice(4).reduce((sum, item) => sum + item.prevPercentage, 0),
          change: 0
        }
      ]
    : filteredData;
  
  const dataToUse = isMobile ? mobileData : filteredData;

  const formattedProfit = totalProfit.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  });
  
  const getInitials = (name: string): string => {
    if (name === "Others") return "OT";
    
    // Split by spaces or hyphens to handle hyphenated names
    const parts = name.split(/[\s-]+/);
    
    // Get first letter of each part, up to 3 letters
    return parts
      .slice(0, 3)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-3 md:p-6 backdrop-blur-sm shadow-lg h-full flex flex-col">
      <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 text-white/90">Profit Share</h3>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-sm text-finance-gray">Loading data...</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <div className="h-48 md:h-64 w-full mb-2 md:mb-4">
              <DonutChart 
                data={dataToUse}
                innerValue={formattedProfit}
                innerLabel="Total Profit"
              />
            </div>
          </div>
          
          <div className="mt-auto overflow-y-auto max-h-48 md:max-h-52 scrollbar-none px-1">
            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5'} gap-2 md:gap-3`}>
              {dataToUse.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-800/80 transition-colors rounded-md p-2 text-xs md:text-sm border border-white/5"
                >
                  <div 
                    className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 flex justify-between items-center min-w-0">
                    <span className="font-medium truncate mr-1" title={item.name}>{getInitials(item.name)}</span>
                    <div className="flex items-center">
                      <span className="text-finance-gray whitespace-nowrap">{item.value}%</span>
                      {showChangeIndicators && Math.abs(item.change) >= 1 && (
                        <span className={`${item.change > 0 ? 'text-emerald-400' : 'text-finance-red'} ml-1`}>
                          {item.change > 0 ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepProfitShare;
