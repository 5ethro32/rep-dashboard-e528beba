
import React from 'react';
import DonutChart from './DonutChart';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

interface RepProfitShareProps {
  displayData: any[];
  repChanges: Record<string, any>;
  isLoading?: boolean;
}

const RepProfitShare: React.FC<RepProfitShareProps> = ({ displayData, repChanges, isLoading }) => {
  const isMobile = useIsMobile();
  
  // Calculate total profit
  const totalProfit = displayData.reduce((sum, item) => sum + item.profit, 0);
  
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
      value: Number(percentage.toFixed(1)),
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
        value: Number(othersValue.toFixed(1)),
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
  
  // Enhanced CustomTooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-gray-800 p-2 border border-white/10 rounded-md text-xs md:text-sm shadow-lg backdrop-blur-sm">
          <p className="text-white font-medium">{item.name}</p>
          <p className="text-white/80">Current: {item.value}% ({item.profit.toLocaleString('en-GB', {
            style: 'currency',
            currency: 'GBP',
            maximumFractionDigits: 0
          })})</p>
          {Math.abs(item.change) >= 0.1 ? (
            <p className={item.change > 0 ? "text-emerald-400 text-xs" : "text-finance-red text-xs"}>
              Change: {item.change > 0 ? "+" : ""}{item.change.toFixed(1)}%
            </p>
          ) : (
            <p className="text-finance-gray text-xs">No change</p>
          )}
          <p className="text-finance-gray text-xs mt-1">
            Previous: {item.prevPercentage}% ({item.prevProfit.toLocaleString('en-GB', {
              style: 'currency',
              currency: 'GBP',
              maximumFractionDigits: 0
            })})
          </p>
        </div>
      );
    }
    return null;
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
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="w-full h-full max-h-52 md:max-h-64 overflow-hidden">
            <DonutChart 
              data={dataToUse}
              innerValue={formattedProfit}
              innerLabel="Total Profit"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RepProfitShare;
