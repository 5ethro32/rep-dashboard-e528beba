
import React from 'react';
import DonutChart from './DonutChart';

interface RepProfitShareProps {
  displayData: any[];
  repChanges: Record<string, any>;
}

const RepProfitShare: React.FC<RepProfitShareProps> = ({ displayData, repChanges }) => {
  // Calculate total profit
  const totalProfit = displayData.reduce((sum, item) => sum + item.profit, 0);
  
  // Colors for the chart
  const colors = [
    "#ef4444", "#f87171", "#fca5a5", "#fee2e2", "#b91c1c",
    "#dc2626", "#991b1b", "#7f1d1d", "#ef4444", "#dc2626"
  ];
  
  // Prepare data for the pie chart
  const chartData = displayData.map((item, index) => {
    const percentage = (item.profit / totalProfit) * 100;
    return {
      name: item.rep,
      value: Number(percentage.toFixed(1)),
      color: colors[index % colors.length]
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
        color: "#6b7280"
      });
    }
  }
  
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-6">
      <h3 className="text-lg font-medium mb-4">Profit Share</h3>
      <div className="h-80">
        <DonutChart 
          data={filteredData}
          innerValue={`${totalProfit.toFixed(0)}`}
          innerLabel="Total Profit"
        />
      </div>
    </div>
  );
};

export default RepProfitShare;
