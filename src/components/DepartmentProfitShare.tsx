
import React from 'react';
import DonutChart from './DonutChart';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

interface DepartmentProfitShareProps {
  retailProfit: number;
  revaProfit: number;
  wholesaleProfit: number;
  totalProfit: number;
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
  isLoading?: boolean;
}

const DepartmentProfitShare: React.FC<DepartmentProfitShareProps> = ({ 
  retailProfit,
  revaProfit,
  wholesaleProfit,
  totalProfit,
  includeRetail,
  includeReva,
  includeWholesale,
  isLoading
}) => {
  const isMobile = useIsMobile();
  
  // Updated colors to match the red theme from Profit Share By Rep chart
  const colors = {
    retail: "#ef4444",   // Primary red (same as in rep chart)
    reva: "#f87171",     // Light red/pink shade - similar to rep chart secondary colors
    wholesale: "#dc2626" // Darker red shade - similar to rep chart tertiary colors
  };
  
  // Prepare data for the pie chart
  const chartData = [];
  
  if (includeRetail && retailProfit > 0) {
    const retailPercentage = (retailProfit / totalProfit) * 100;
    chartData.push({
      name: "Retail",
      value: Math.round(retailPercentage),
      color: colors.retail,
      profit: retailProfit
    });
  }
  
  if (includeReva && revaProfit > 0) {
    const revaPercentage = (revaProfit / totalProfit) * 100;
    chartData.push({
      name: "REVA",
      value: Math.round(revaPercentage),
      color: colors.reva,
      profit: revaProfit
    });
  }
  
  if (includeWholesale && wholesaleProfit > 0) {
    const wholesalePercentage = (wholesaleProfit / totalProfit) * 100;
    chartData.push({
      name: "Wholesale",
      value: Math.round(wholesalePercentage),
      color: colors.wholesale,
      profit: wholesaleProfit
    });
  }
  
  // Sort data to show largest first
  chartData.sort((a, b) => b.value - a.value);
  
  // Format the total profit for display
  const formattedProfit = totalProfit.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  });
  
  // Split the legend items into left and right sides for desktop
  const splitLegendItems = () => {
    if (isMobile) return { leftItems: chartData, rightItems: [] };
    
    const midPoint = Math.ceil(chartData.length / 2);
    return {
      leftItems: chartData.slice(0, midPoint),
      rightItems: chartData.slice(midPoint)
    };
  };

  const { leftItems, rightItems } = splitLegendItems();
  
  // Render a legend item
  const renderLegendItem = (item: any, index: number) => (
    <div key={index} className="flex items-center text-2xs md:text-xs py-1">
      <div 
        className="w-2 h-2 md:w-3 md:h-3 rounded-full mr-1 flex-shrink-0" 
        style={{ backgroundColor: item.color }}
      />
      <div className="truncate">
        <span className="font-medium">{item.name}</span> 
        <span className="text-finance-gray ml-1">({item.value}%)</span>
      </div>
    </div>
  );
  
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-3 md:p-6 backdrop-blur-sm shadow-lg h-full flex flex-col">
      <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 text-white/90">Profit Share By Department</h3>
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
                    data={chartData}
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
                  data={chartData}
                  innerValue={formattedProfit}
                  innerLabel="Total Profit"
                />
              </div>
              
              {/* Legend for mobile */}
              <div className="mt-auto overflow-y-auto max-h-40 scrollbar-none">
                <div className="grid grid-cols-2 gap-2">
                  {chartData.map((item, index) => renderLegendItem(item, index))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DepartmentProfitShare;
