
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';

interface RevaMetricsChartProps {
  data: any[];
}

const RevaMetricsChartUpdated: React.FC<RevaMetricsChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex justify-center items-center h-64 bg-gray-800/30 rounded-lg">No data available</div>;
  }

  // Process the raw data to create usage-based grouping
  const processDataByUsage = (rawData: any[]) => {
    // Function to group items by usage volume
    const groupItemsByUsage = (items: any[]) => {
      // First, sort all items by usage in descending order
      const sortedItems = [...items].sort((a, b) => {
        // Safely handle cases where revaUsage might be undefined
        const usageA = a.revaUsage || 0;
        const usageB = b.revaUsage || 0;
        return usageB - usageA; // Descending order
      });

      // Define group sizes
      const groupSizes = [250, 250, 500, 500, 1000]; // Group 1: 1-250, Group 2: 251-500, etc.
      const results = [];

      let startIndex = 0;
      for (let i = 0; i < groupSizes.length; i++) {
        const endIndex = startIndex + groupSizes[i];
        const groupItems = sortedItems.slice(startIndex, Math.min(endIndex, sortedItems.length));
        
        if (groupItems.length === 0) break; // No more items to group
        
        // Calculate metrics for this group
        let totalUsage = 0;
        let totalProfit = 0;
        let totalUsageWeightedMargin = 0;

        groupItems.forEach(item => {
          const usage = item.revaUsage || 0;
          const price = item.currentREVAPrice || 0;
          const cost = item.avgCost || 0;
          const profit = usage * (price - cost);
          const margin = price > 0 ? (price - cost) / price : 0;
          
          totalUsage += usage;
          totalProfit += profit;
          totalUsageWeightedMargin += margin * usage;
        });

        // Determine the range description
        const groupNumber = i + 1;
        const rangeStart = startIndex + 1;
        const rangeEnd = Math.min(endIndex, sortedItems.length);

        results.push({
          name: `Group ${groupNumber}`,
          shortName: `G${groupNumber}`,
          itemCount: groupItems.length,
          currentProfit: totalProfit,
          currentMargin: totalUsage > 0 ? (totalUsageWeightedMargin / totalUsage) * 100 : 0,
          rangeDescription: `SKUs ${rangeStart}-${rangeEnd}`
        });

        startIndex = endIndex;
        if (startIndex >= sortedItems.length) break; // No more items to process
      }

      // If there are remaining items, add them as a final group
      if (startIndex < sortedItems.length) {
        const remainingItems = sortedItems.slice(startIndex);
        let totalUsage = 0;
        let totalProfit = 0;
        let totalUsageWeightedMargin = 0;

        remainingItems.forEach(item => {
          const usage = item.revaUsage || 0;
          const price = item.currentREVAPrice || 0;
          const cost = item.avgCost || 0;
          const profit = usage * (price - cost);
          const margin = price > 0 ? (price - cost) / price : 0;
          
          totalUsage += usage;
          totalProfit += profit;
          totalUsageWeightedMargin += margin * usage;
        });

        const groupNumber = groupSizes.length + 1;
        const rangeStart = startIndex + 1;
        const rangeEnd = sortedItems.length;

        results.push({
          name: `Group ${groupNumber}`,
          shortName: `G${groupNumber}`,
          itemCount: remainingItems.length,
          currentProfit: totalProfit,
          currentMargin: totalUsage > 0 ? (totalUsageWeightedMargin / totalUsage) * 100 : 0,
          rangeDescription: `SKUs ${rangeStart}-${rangeEnd}`
        });
      }

      return results;
    };

    // Process the provided chart data or raw items
    if (Array.isArray(rawData) && rawData.length > 0) {
      // Check if data is raw items or already processed chart data
      if (rawData[0].revaUsage !== undefined) {
        // Raw items data
        return groupItemsByUsage(rawData);
      } else if (rawData[0].name && rawData[0].name.includes('Group')) {
        // Data is already in chart format, but we need to regroup by usage
        console.log('Regrouping pre-processed chart data is not supported. Please provide raw item data.');
        return rawData; // Return as-is for now
      }
    }
    
    return [];
  };

  // Process data with usage-based grouping
  const processedData = processDataByUsage(data);

  // Custom tooltip to show more details
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Safely format numbers with null/undefined checks
      const formatValue = (value: number | null | undefined) => {
        if (value === null || value === undefined) {
          return "N/A";
        }
        return value.toFixed(1);
      };
      
      // Safely format currency with null/undefined checks
      const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined) {
          return "N/A";
        }
        return `£${value.toLocaleString()}`;
      };
      
      return (
        <div className="bg-gray-800 p-3 rounded shadow-lg border border-gray-700">
          <p className="font-bold text-sm">{data.name}</p>
          <p className="text-xs text-gray-400">{data.rangeDescription}</p>
          <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
            <div>
              <p><span className="text-blue-400">Current Margin:</span> {formatValue(data.currentMargin)}%</p>
            </div>
            <div>
              <p><span className="text-blue-400">Current Profit:</span> {formatCurrency(data.currentProfit)}</p>
            </div>
            <p className="col-span-2"><span className="text-gray-400">Items:</span> {data.itemCount}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate the maximum profit value for proper scaling
  const maxProfit = Math.max(...processedData.map(item => item.currentProfit || 0));
  
  // Calculate the maximum margin value
  const maxMargin = Math.max(...processedData.map(item => item.currentMargin || 0)); 
  
  // Format Y-axis labels for profit
  const formatProfitAxis = (value: number) => {
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `£${(value / 1000).toFixed(1)}K`;
    }
    return `£${value}`;
  };
  
  // Format Y-axis labels for margin
  const formatMarginAxis = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="w-full h-72 md:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={processedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="shortName" />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            tickFormatter={formatMarginAxis}
            domain={[0, Math.max(maxMargin * 1.1, 30)]} // Set domain with padding, minimum 30%
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tickFormatter={formatProfitAxis}
            domain={[0, maxProfit * 1.1]} // Set domain with 10% padding
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Bar for current profit */}
          <Bar 
            yAxisId="right" 
            dataKey="currentProfit" 
            name="Current Profit" 
            fill="#3b82f6" 
            opacity={0.6}
          />
          
          {/* Line for current margin */}
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="currentMargin" 
            name="Current Margin %" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={{ r: 5, fill: "#3b82f6" }} 
            activeDot={{ r: 6 }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevaMetricsChartUpdated;
