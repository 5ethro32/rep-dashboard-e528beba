import React from 'react';
import DonutChart from '@/components/DonutChart';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DailyRepProfitShareProps {
  data: any[];
  isLoading?: boolean;
  showChangeIndicators?: boolean;
  totalProfit?: number;
}

const DailyRepProfitShare: React.FC<DailyRepProfitShareProps> = ({ 
  data, 
  isLoading,
  showChangeIndicators = false, // Daily view typically doesn't show changes
  totalProfit: providedTotalProfit
}) => {
  const isMobile = useIsMobile();
  
  // Calculate total profit from data or use provided value
  const totalProfit = providedTotalProfit !== undefined 
    ? providedTotalProfit 
    : data.reduce((sum, item) => sum + item.profit, 0);
  
  // Colors for the chart - refined gradient of reds to match original
  const colors = [
    "#ef4444", "#f87171", "#fca5a5", "#fee2e2", "#b91c1c",
    "#dc2626", "#991b1b", "#7f1d1d", "#ef4444", "#dc2626"
  ];
  
  // Prepare data for the donut chart
  const chartData = data.map((item, index) => {
    const percentage = totalProfit > 0 ? (item.profit / totalProfit) * 100 : 0;
    
    return {
      name: item.rep,
      value: Math.round(percentage),
      color: colors[index % colors.length],
      profit: item.profit,
      prevProfit: 0, // No comparison in daily view
      prevPercentage: 0,
      change: 0
    };
  });
  
  // Sort data to show largest first
  chartData.sort((a, b) => b.value - a.value);
  
  // Filter out very small values (less than 1%)
  const filteredData = chartData.filter(item => item.value >= 1);
  
  // Group small values into "Others" if needed
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
        prevProfit: 0,
        prevPercentage: 0,
        change: 0
      });
    }
  }
  
  // For mobile, limit the number of slices shown
  const mobileData = isMobile && filteredData.length > 5 
    ? [
        ...filteredData.slice(0, 4), 
        {
          name: "Others",
          value: filteredData.slice(4).reduce((sum, item) => sum + item.value, 0),
          color: "#6b7280",
          profit: filteredData.slice(4).reduce((sum, item) => sum + item.profit, 0),
          prevProfit: 0,
          prevPercentage: 0,
          change: 0
        }
      ]
    : filteredData;
  
  const dataToUse = isMobile ? mobileData : filteredData;

  // Format the total profit for display
  const formattedProfit = totalProfit.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  });
  
  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    if (name === "Others") return "OT";
    
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('');
  };

  // Render a legend item
  const renderLegendItem = (item: any, index: number) => (
    <div key={index} className="flex items-center text-2xs md:text-xs py-1">
      <div 
        className="w-2 h-2 md:w-3 md:h-3 rounded-full mr-1 flex-shrink-0" 
        style={{ backgroundColor: item.color }}
      />
      <div className="truncate">
        <span className="font-medium">{getInitials(item.name)}</span> 
        <span className="text-finance-gray ml-1">({item.value}%)</span>
      </div>
    </div>
  );
  
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-3 md:p-6 backdrop-blur-sm shadow-lg h-full flex flex-col">
      <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 text-white/90">Profit Share By Rep</h3>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-sm text-finance-gray">Loading data...</span>
          </div>
        </div>
      ) : dataToUse.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-finance-gray">No data available</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full">
          {/* Desktop layout */}
          {!isMobile && (
            <div className="flex h-full">
              {/* Left side legend */}
              <div className="w-1/3 pr-2 flex flex-col justify-center">
                <ScrollArea className="h-full">
                  <div className="pr-2 space-y-1">
                    {dataToUse.map((item, index) => renderLegendItem(item, index))}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Right side chart */}
              <div className="w-2/3">
                <div className="h-full">
                  <DonutChart 
                    data={dataToUse}
                    innerValue={formattedProfit}
                    innerLabel="Total Profit"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile layout */}
          {isMobile && (
            <>
              <div className="h-48 mb-2">
                <DonutChart 
                  data={dataToUse}
                  innerValue={formattedProfit}
                  innerLabel="Total Profit"
                />
              </div>
              
              {/* Legend for mobile */}
              <div className="mt-auto overflow-y-auto max-h-40 scrollbar-none">
                <div className="grid grid-cols-2 gap-2">
                  {dataToUse.map((item, index) => renderLegendItem(item, index))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyRepProfitShare;