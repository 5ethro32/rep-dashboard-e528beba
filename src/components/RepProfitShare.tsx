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
  
  const colors = [
    "#dc2626",   // Bright Red
    "#ef4444",   // Red
    "#f87171",   // Light Red
    "#fca5a5",   // Soft Red
    "#fee2e2",   // Very Light Red
    "#991b1b",   // Dark Red
    "#7f1d1d",   // Darkest Red
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
    
    return name
      .split(' ')
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
          
          <div className="mt-auto overflow-y-auto max-h-40 md:max-h-44 scrollbar-none">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
              {dataToUse.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-2 bg-gray-900/50 rounded-md p-1.5 text-2xs md:text-xs"
                >
                  <div 
                    className="w-3 h-3 md:w-4 md:h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-medium truncate">{getInitials(item.name)}</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-finance-gray">({item.value}%)</span>
                      {showChangeIndicators && Math.abs(item.change) >= 1 && (
                        <span className={`${item.change > 0 ? 'text-emerald-400' : 'text-finance-red'}`}>
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
