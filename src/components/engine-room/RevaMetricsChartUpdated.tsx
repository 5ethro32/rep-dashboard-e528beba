
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface RevaMetricsChartProps {
  data: any[];
}

const RevaMetricsChartUpdated: React.FC<RevaMetricsChartProps> = ({ data }) => {
  // Add toggle state for chart display
  const [displayOptions, setDisplayOptions] = useState<string[]>(["margin", "profit"]);

  if (!data || data.length === 0) {
    return <div className="flex justify-center items-center h-64 bg-gray-800/30 rounded-lg">No data available</div>;
  }

  // Process the raw data to create usage-based grouping
  const processedData = useMemo(() => {
    // Function to group items by usage volume
    const groupItemsByUsage = (items: any[]) => {
      // First, sort all items by usage in descending order
      const sortedItems = [...items].sort((a, b) => {
        // Safely handle cases where revaUsage might be undefined
        const usageA = a.revaUsage || 0;
        const usageB = b.revaUsage || 0;
        return usageB - usageA; // Descending order
      });

      const totalItems = sortedItems.length;
      
      // Define groups - 250 items per group for groups 1-5, rest in group 6
      const groupSize = 250;
      const results = [];
      
      // Create exactly 5 equal groups of 250 items each
      for (let i = 0; i < 5; i++) {
        const startIndex = i * groupSize;
        const endIndex = startIndex + groupSize;
        const groupItems = sortedItems.slice(startIndex, Math.min(endIndex, totalItems));
        
        if (groupItems.length === 0) break; // No more items to group
        
        // Calculate metrics for this group with validation
        let totalUsage = 0;
        let totalRevenue = 0;
        let totalProfit = 0;
        let totalUsageWeightedMargin = 0;
        let validMarginItems = 0;

        groupItems.forEach(item => {
          const usage = Math.max(0, item.revaUsage || 0); // Ensure non-negative usage
          const price = Math.max(0, item.currentREVAPrice || 0); // Ensure non-negative price
          const cost = Math.max(0, item.avgCost || 0); // Ensure non-negative cost
          
          // Only calculate profit if we have valid values
          if (usage > 0 && price > 0) {
            const revenue = usage * price;
            // CRITICAL FIX: Ensure we're using price - cost (not cost - price)
            const profit = usage * (price - cost);
            
            totalUsage += usage;
            totalRevenue += revenue;
            totalProfit += profit;
            
            // Calculate margin only for valid items
            if (price > 0) {
              // CRITICAL FIX: Ensure correct formula: (price - cost) / price * 100
              const margin = (price - cost) / price * 100; // Convert to percentage
              totalUsageWeightedMargin += margin * usage;
              validMarginItems += 1;
            }
          }
        });

        // Determine the range description
        const groupNumber = i + 1;
        const rangeStart = startIndex + 1;
        const rangeEnd = Math.min(endIndex, totalItems);

        // Calculate usage-weighted margin
        // Use revenue-based method for consistency
        const currentMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        results.push({
          name: `Group ${groupNumber}`,
          shortName: `G${groupNumber}`,
          itemCount: groupItems.length,
          currentProfit: totalProfit,
          currentMargin: currentMargin,
          rangeDescription: `SKUs ${rangeStart}-${rangeEnd}`
        });
      }

      // If there are remaining items after the first 5 groups, add them as group 6
      const remainingStartIndex = 5 * groupSize;
      if (remainingStartIndex < totalItems) {
        const remainingItems = sortedItems.slice(remainingStartIndex);
        let totalUsage = 0;
        let totalRevenue = 0;
        let totalProfit = 0;
        let totalUsageWeightedMargin = 0;
        let validMarginItems = 0;

        remainingItems.forEach(item => {
          const usage = Math.max(0, item.revaUsage || 0); // Ensure non-negative usage
          const price = Math.max(0, item.currentREVAPrice || 0); // Ensure non-negative price
          const cost = Math.max(0, item.avgCost || 0); // Ensure non-negative cost
          
          // Only calculate profit if we have valid values
          if (usage > 0 && price > 0) {
            const revenue = usage * price;
            // CRITICAL FIX: Ensure we're using price - cost (not cost - price)
            const profit = usage * (price - cost);
            
            totalUsage += usage;
            totalRevenue += revenue;
            totalProfit += profit;
            
            // Calculate margin only for valid items
            if (price > 0) {
              // CRITICAL FIX: Ensure correct formula: (price - cost) / price * 100
              const margin = (price - cost) / price * 100; // Convert to percentage
              totalUsageWeightedMargin += margin * usage;
              validMarginItems += 1;
            }
          }
        });

        const rangeStart = remainingStartIndex + 1;
        const rangeEnd = totalItems;

        // Calculate usage-weighted margin
        // Use revenue-based method for consistency
        const currentMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        results.push({
          name: `Group 6`,
          shortName: `G6`,
          itemCount: remainingItems.length,
          currentProfit: totalProfit,
          currentMargin: currentMargin,
          rangeDescription: `SKUs ${rangeStart}-${rangeEnd}`
        });
      }

      return results;
    };

    // Process the provided chart data or raw items
    if (Array.isArray(data) && data.length > 0) {
      // Check if data is raw items or already processed chart data
      if (data[0].revaUsage !== undefined) {
        // Raw items data
        return groupItemsByUsage(data);
      } else if (data[0].name && data[0].name.includes('Group')) {
        // Data is already in chart format, but we need to regroup by usage
        console.log('Regrouping pre-processed chart data is not supported. Please provide raw item data.');
        return data; // Return as-is for now
      }
    }
    
    return [];
  }, [data]);

  // Custom tooltip to show more details
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Format numbers with better precision
      const formatMargin = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "N/A";
        return `${value.toFixed(1)}%`;
      };
      
      const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "N/A";
        
        if (value >= 1000000) {
          return `£${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `£${(value / 1000).toFixed(1)}K`;
        }
        return `£${value.toFixed(0)}`;
      };
      
      return (
        <div className="bg-gray-800 p-3 rounded shadow-lg border border-gray-700">
          <p className="font-bold text-sm">{data.name}</p>
          <p className="text-xs text-gray-400">{data.rangeDescription}</p>
          <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
            {payload.map((entry: any, index: number) => (
              <div key={index}>
                <p>
                  <span className="text-gray-400">{entry.name}: </span> 
                  {entry.dataKey === 'currentMargin' 
                    ? formatMargin(entry.value) 
                    : formatCurrency(entry.value)}
                </p>
              </div>
            ))}
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
  
  // Format Y-axis labels for profit - with cleaner formatting
  const formatProfitAxis = (value: number) => {
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `£${(value / 1000).toFixed(1)}K`;
    }
    return `£${value}`;
  };
  
  // Format Y-axis labels for margin - with cleaner formatting
  const formatMarginAxis = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Define colors for the lines - updated to use brand colors
  const marginColor = "#f97316"; // Orange for margin
  const profitColor = "#ef4444"; // Finance red for profit

  // Handle toggle changes
  const handleDisplayOptionsChange = (values: string[]) => {
    // Ensure we always have at least one option selected
    if (values.length === 0) return;
    setDisplayOptions(values);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-start">
        <ToggleGroup 
          type="multiple" 
          value={displayOptions} 
          onValueChange={handleDisplayOptionsChange}
          className="justify-start"
        >
          <ToggleGroupItem 
            value="margin" 
            aria-label="Show margin" 
            className="data-[state=on]:bg-orange-500/20 data-[state=on]:text-orange-400 border-gray-700"
          >
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500"></span>
              <span className="text-xs">Margin</span>
            </span>
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="profit" 
            aria-label="Show profit" 
            className="data-[state=on]:bg-finance-red/20 data-[state=on]:text-finance-red border-gray-700"
          >
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-finance-red"></span>
              <span className="text-xs">Profit</span>
            </span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{
              top: 5,
              right: 20,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="shortName" 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              tickFormatter={formatMarginAxis}
              domain={[0, Math.max(maxMargin * 1.1, 30)]}
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tickFormatter={formatProfitAxis}
              domain={[0, maxProfit * 1.1]}
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Line for current margin */}
            {displayOptions.includes('margin') && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="currentMargin" 
                name="Margin %" 
                stroke={marginColor} 
                strokeWidth={3} 
                dot={{ r: 4, fill: marginColor }} 
                activeDot={{ r: 5 }} 
              />
            )}
            
            {/* Line for current profit */}
            {displayOptions.includes('profit') && (
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="currentProfit" 
                name="Profit" 
                stroke={profitColor} 
                strokeWidth={3} 
                dot={{ r: 4, fill: profitColor }} 
                activeDot={{ r: 5 }} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevaMetricsChartUpdated;
