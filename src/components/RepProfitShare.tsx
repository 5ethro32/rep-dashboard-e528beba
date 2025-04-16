
import React from 'react';
import DonutChart from './DonutChart';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RepProfitShareProps {
  displayData: any[];
  repChanges: Record<string, any>;
  isLoading?: boolean;
  showChangeIndicators?: boolean;
  totalProfit?: number;
}

const RepProfitShare: React.FC<RepProfitShareProps> = ({ 
  displayData, 
  repChanges, 
  isLoading,
  showChangeIndicators = true,
  totalProfit: providedTotalProfit
}) => {
  const isMobile = useIsMobile();
  
  // Calculate total profit from displayData or use the provided value
  const totalProfit = providedTotalProfit !== undefined 
    ? providedTotalProfit 
    : displayData.reduce((sum, item) => sum + item.profit, 0);
  
  // Colors for the chart - refined gradient of reds
  const colors = [
    "#ef4444", "#f87171", "#fca5a5", "#fee2e2", "#b91c1c",
    "#dc2626", "#991b1b", "#7f1d1d", "#ef4444", "#dc2626"
  ];
  
  // Prepare data for the pie chart
  const chartData = displayData.map((item, index) => {
    const percentage = (item.profit / totalProfit) * 100;
    const prevProfit = item.profit / (1 + (repChanges[item.rep]?.profit || 0) / 100);
    const prevPercentage = (prevProfit / (totalProfit / (1 + (repChanges[item.rep]?.profit || 0) / 100))) * 100;
    
    return {
      name: item.rep,
      value: Math.round(percentage), // Round to 0 decimal places
      color: colors[index % colors.length],
      profit: item.profit,
      prevProfit: prevProfit,
      prevPercentage: Number(prevPercentage.toFixed(1)),
      change: repChanges[item.rep] ? repChanges[item.rep].profit : 0
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
        value: Math.round(othersValue), // Round to 0 decimal places
        color: "#6b7280",
        profit: chartData.filter(item => item.value < 1).reduce((sum, item) => sum + item.profit, 0),
        prevProfit: chartData.filter(item => item.value < 1).reduce((sum, item) => sum + item.prevProfit, 0),
        prevPercentage: chartData.filter(item => item.value < 1).reduce((sum, item) => sum + item.prevPercentage, 0),
        change: 0
      });
    }
  }
  
  // For mobile, we might want to limit the number of slices shown
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

  // Split the legend items into left and right sides for desktop
  // This creates a more balanced visual presentation
  const splitLegendItems = () => {
    if (isMobile) return { leftItems: dataToUse, rightItems: [] };
    
    const midPoint = Math.ceil(dataToUse.length / 2);
    return {
      leftItems: dataToUse.slice(0, midPoint),
      rightItems: dataToUse.slice(midPoint)
    };
  };

  const { leftItems, rightItems } = splitLegendItems();
  
  // Render a legend item - shared function for both layouts
  const renderLegendItem = (item: any, index: number) => (
    <div key={index} className="flex items-center text-2xs md:text-xs py-1">
      <div 
        className="w-2 h-2 md:w-3 md:h-3 rounded-full mr-1 flex-shrink-0" 
        style={{ backgroundColor: item.color }}
      />
      <div className="truncate">
        <span className="font-medium">{getInitials(item.name)}</span> 
        <span className="text-finance-gray ml-1">({item.value}%)</span>
        {showChangeIndicators && Math.abs(item.change) >= 1 && (
          <span className={`ml-1 ${item.change > 0 ? 'text-emerald-400' : 'text-finance-red'}`}>
            {item.change > 0 ? '↑' : '↓'}
          </span>
        )}
      </div>
    </div>
  );
  
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
        <div className="flex-1 flex flex-col h-full">
          {/* Desktop layout - side-by-side */}
          {!isMobile && (
            <div className="flex h-full">
              {/* Left side legend */}
              <div className="w-1/4 pr-2 flex flex-col justify-center">
                {leftItems.map((item, index) => renderLegendItem(item, index))}
              </div>
              
              {/* Center chart */}
              <div className="w-1/2">
                <div className="h-full">
                  <DonutChart 
                    data={dataToUse}
                    innerValue={formattedProfit}
                    innerLabel="Total Profit"
                  />
                </div>
              </div>
              
              {/* Right side legend */}
              <div className="w-1/4 pl-2 flex flex-col justify-center">
                {rightItems.map((item, index) => renderLegendItem(item, index))}
              </div>
            </div>
          )}
          
          {/* Mobile layout - legend below chart */}
          {isMobile && (
            <>
              <div className="h-48 mb-2">
                <DonutChart 
                  data={dataToUse}
                  innerValue={formattedProfit}
                  innerLabel="Total Profit"
                />
              </div>
              
              {/* Legend for mobile - scrollable */}
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

export default RepProfitShare;
