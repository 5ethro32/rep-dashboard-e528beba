import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface RevaMetricsChartProps {
  data: any[];
}

const RevaMetricsChartUpdated: React.FC<RevaMetricsChartProps> = ({ data }) => {
  // Add toggle state for chart display - modified to have separate rule toggles
  const [displayOptions, setDisplayOptions] = useState<string[]>(["margin", "profit"]);
  const [showRule1, setShowRule1] = useState<boolean>(false);
  const [showRule2, setShowRule2] = useState<boolean>(false);
  const [showCombined, setShowCombined] = useState<boolean>(false);

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
        
        // For proposed metrics (Rules 1 & 2)
        let totalProposedRevenue = 0;
        let totalProposedProfit = 0;
        let totalProposedRule1Revenue = 0;
        let totalProposedRule1Profit = 0;
        let totalProposedRule2Revenue = 0;
        let totalProposedRule2Profit = 0;
        let totalCombinedRevenue = 0;
        let totalCombinedProfit = 0;

        groupItems.forEach(item => {
          const usage = Math.max(0, item.revaUsage || 0); // Ensure non-negative usage
          const price = Math.max(0, item.currentREVAPrice || 0); // Ensure non-negative price
          const cost = Math.max(0, item.avgCost || 0); // Ensure non-negative cost
          
          // Get proposed price values if available
          const proposedPrice = Math.max(0, item.proposedPrice || price);
          
          // Calculate proposed prices for rule 1 and rule 2 separately
          // Rule 1: Cost + 8% margin (simplified)
          const rule1Price = cost * 1.09; // Cost + ~9% markup (equivalent to 8% margin)
          
          // Rule 2: TML - 5% (simplified)
          const tml = Math.max(0, item.trueMarketLow || 0);
          const rule2Price = tml > 0 ? tml * 0.95 : proposedPrice; // 5% below TML
          
          // Calculate combined price - use whichever rule gives higher profit
          // This is a simple way of combining the rules - using the better of the two prices
          const rule1Profit = usage * (rule1Price - cost);
          const rule2Profit = usage * (rule2Price - cost);
          const combinedPrice = rule1Profit > rule2Profit ? rule1Price : rule2Price;
          
          // Only calculate profit if we have valid values
          if (usage > 0 && price > 0) {
            const revenue = usage * price;
            // CRITICAL FIX: Ensure we're using price - cost (not cost - price)
            const profit = usage * (price - cost);
            
            // Calculate proposed metrics
            const proposedRevenue = usage * proposedPrice;
            const proposedProfit = usage * (proposedPrice - cost);
            
            // Calculate Rule 1 proposed metrics
            const proposedRule1Revenue = usage * rule1Price;
            const proposedRule1Profit = usage * (rule1Price - cost);
            
            // Calculate Rule 2 proposed metrics
            const proposedRule2Revenue = usage * rule2Price;
            const proposedRule2Profit = usage * (rule2Price - cost);
            
            // Calculate Combined rules metrics
            const combinedRevenue = usage * combinedPrice;
            const combinedProfit = usage * (combinedPrice - cost);
            
            totalUsage += usage;
            totalRevenue += revenue;
            totalProfit += profit;
            
            // Add proposed totals
            totalProposedRevenue += proposedRevenue;
            totalProposedProfit += proposedProfit;
            totalProposedRule1Revenue += proposedRule1Revenue;
            totalProposedRule1Profit += proposedRule1Profit;
            totalProposedRule2Revenue += proposedRule2Revenue;
            totalProposedRule2Profit += proposedRule2Profit;
            totalCombinedRevenue += combinedRevenue;
            totalCombinedProfit += combinedProfit;
            
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
        const proposedMargin = totalProposedRevenue > 0 ? (totalProposedProfit / totalProposedRevenue) * 100 : 0;
        const proposedRule1Margin = totalProposedRule1Revenue > 0 ? (totalProposedRule1Profit / totalProposedRule1Revenue) * 100 : 0;
        const proposedRule2Margin = totalProposedRule2Revenue > 0 ? (totalProposedRule2Profit / totalProposedRule2Revenue) * 100 : 0;
        const combinedMargin = totalCombinedRevenue > 0 ? (totalCombinedProfit / totalCombinedRevenue) * 100 : 0;

        results.push({
          name: `Group ${groupNumber}`,
          shortName: `G${groupNumber}`,
          itemCount: groupItems.length,
          currentProfit: totalProfit,
          currentMargin: currentMargin,
          proposedProfit: totalProposedProfit,
          proposedMargin: proposedMargin,
          proposedRule1Profit: totalProposedRule1Profit,
          proposedRule1Margin: proposedRule1Margin,
          proposedRule2Profit: totalProposedRule2Profit,
          proposedRule2Margin: proposedRule2Margin,
          combinedProfit: totalCombinedProfit,
          combinedMargin: combinedMargin,
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
        
        // For proposed metrics
        let totalProposedRevenue = 0;
        let totalProposedProfit = 0;
        let totalProposedRule1Revenue = 0;
        let totalProposedRule1Profit = 0;
        let totalProposedRule2Revenue = 0;
        let totalProposedRule2Profit = 0;
        let totalCombinedRevenue = 0;
        let totalCombinedProfit = 0;

        remainingItems.forEach(item => {
          const usage = Math.max(0, item.revaUsage || 0); // Ensure non-negative usage
          const price = Math.max(0, item.currentREVAPrice || 0); // Ensure non-negative price
          const cost = Math.max(0, item.avgCost || 0); // Ensure non-negative cost
          
          // Get proposed price values if available
          const proposedPrice = Math.max(0, item.proposedPrice || price);
          
          // Calculate proposed prices for rule 1 and rule 2 separately
          // Rule 1: Cost + 8% margin (simplified)
          const rule1Price = cost * 1.09; // Cost + ~9% markup (equivalent to 8% margin)
          
          // Rule 2: TML - 5% (simplified)
          const tml = Math.max(0, item.trueMarketLow || 0);
          const rule2Price = tml > 0 ? tml * 0.95 : proposedPrice; // 5% below TML
          
          // Calculate combined price - use whichever rule gives higher profit
          const rule1Profit = usage * (rule1Price - cost);
          const rule2Profit = usage * (rule2Price - cost);
          const combinedPrice = rule1Profit > rule2Profit ? rule1Price : rule2Price;
          
          // Only calculate profit if we have valid values
          if (usage > 0 && price > 0) {
            const revenue = usage * price;
            // CRITICAL FIX: Ensure we're using price - cost (not cost - price)
            const profit = usage * (price - cost);
            
            // Calculate proposed metrics
            const proposedRevenue = usage * proposedPrice;
            const proposedProfit = usage * (proposedPrice - cost);
            
            // Calculate Rule 1 proposed metrics
            const proposedRule1Revenue = usage * rule1Price;
            const proposedRule1Profit = usage * (rule1Price - cost);
            
            // Calculate Rule 2 proposed metrics
            const proposedRule2Revenue = usage * rule2Price;
            const proposedRule2Profit = usage * (rule2Price - cost);
            
            // Calculate Combined rules metrics
            const combinedRevenue = usage * combinedPrice;
            const combinedProfit = usage * (combinedPrice - cost);
            
            totalUsage += usage;
            totalRevenue += revenue;
            totalProfit += profit;
            
            // Add proposed totals
            totalProposedRevenue += proposedRevenue;
            totalProposedProfit += proposedProfit;
            totalProposedRule1Revenue += proposedRule1Revenue;
            totalProposedRule1Profit += proposedRule1Profit;
            totalProposedRule2Revenue += proposedRule2Revenue;
            totalProposedRule2Profit += proposedRule2Profit;
            totalCombinedRevenue += combinedRevenue;
            totalCombinedProfit += combinedProfit;
            
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
        const proposedMargin = totalProposedRevenue > 0 ? (totalProposedProfit / totalProposedRevenue) * 100 : 0;
        const proposedRule1Margin = totalProposedRule1Revenue > 0 ? (totalProposedRule1Profit / totalProposedRule1Revenue) * 100 : 0;
        const proposedRule2Margin = totalProposedRule2Revenue > 0 ? (totalProposedRule2Profit / totalProposedRule2Revenue) * 100 : 0;
        const combinedMargin = totalCombinedRevenue > 0 ? (totalCombinedProfit / totalCombinedRevenue) * 100 : 0;

        results.push({
          name: `Group 6`,
          shortName: `G6`,
          itemCount: remainingItems.length,
          currentProfit: totalProfit,
          currentMargin: currentMargin,
          proposedProfit: totalProposedProfit,
          proposedMargin: proposedMargin,
          proposedRule1Profit: totalProposedRule1Profit,
          proposedRule1Margin: proposedRule1Margin,
          proposedRule2Profit: totalProposedRule2Profit,
          proposedRule2Margin: proposedRule2Margin,
          combinedProfit: totalCombinedProfit,
          combinedMargin: combinedMargin,
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
          return `£${(value / 1000000).toFixed(1)}m`;
        } else if (value >= 1000) {
          return `£${(value / 1000).toFixed(1)}k`;
        }
        return `£${value.toFixed(0)}`;
      };
      
      return (
        <div className="bg-gray-800 p-3 rounded shadow-lg border border-gray-700">
          <p className="font-bold text-sm">{data.name}</p>
          <p className="text-xs text-gray-400">{data.rangeDescription}</p>
          <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
            {payload.map((entry: any, index: number) => {
              const isMargin = entry.dataKey.toLowerCase().includes('margin');
              return (
                <div key={index}>
                  <p>
                    <span className="text-gray-400">{entry.name}: </span> 
                    {isMargin 
                      ? formatMargin(entry.value) 
                      : formatCurrency(entry.value)}
                  </p>
                </div>
              );
            })}
            <p className="col-span-2"><span className="text-gray-400">Items:</span> {data.itemCount}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate the maximum profit value for proper scaling
  const maxProfit = Math.max(
    ...processedData.map(item => Math.max(
      item.currentProfit || 0,
      item.proposedProfit || 0,
      item.proposedRule1Profit || 0,
      item.proposedRule2Profit || 0,
      item.combinedProfit || 0
    ))
  );
  
  // Calculate the maximum margin value
  const maxMargin = Math.max(
    ...processedData.map(item => Math.max(
      item.currentMargin || 0,
      item.proposedMargin || 0,
      item.proposedRule1Margin || 0,
      item.proposedRule2Margin || 0,
      item.combinedMargin || 0
    ))
  ); 
  
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
  const rule1Color = "#1EAEDB"; // Bright blue for Rule 1
  const rule2Color = "#8B5CF6"; // Vivid purple for Rule 2
  const combinedColor = "#10B981"; // Green for combined rules

  // Handle toggle changes
  const handleDisplayOptionsChange = (values: string[]) => {
    // Ensure we always have at least one option selected
    if (values.length === 0) return;
    setDisplayOptions(values);
  };

  // Toggle handlers for rule displays
  const toggleRule1 = () => {
    setShowRule1(!showRule1);
    // If turning on rule1, turn off "combined" if it's active
    if (!showRule1) {
      setShowCombined(false);
    }
  };
  
  const toggleRule2 = () => {
    setShowRule2(!showRule2);
    // If turning on rule2, turn off "combined" if it's active
    if (!showRule2) {
      setShowCombined(false);
    }
  };
  
  // New toggle handler for combined rules (showing optimized combination)
  const toggleCombined = () => {
    setShowCombined(!showCombined);
    // When toggling combined on, turn off individual rule toggles
    if (!showCombined) {
      setShowRule1(false);
      setShowRule2(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
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
        
        {/* Updated toggle group with three options: Rule 1, Rule 2, and Combined */}
        <ToggleGroup
          type="multiple"
          className="justify-end"
        >
          <ToggleGroupItem
            value="rule1"
            aria-label="Show Rule 1"
            className={`border-gray-700 text-xs ${showRule1 ? 'bg-blue-500/20 text-blue-400' : ''}`}
            onClick={toggleRule1}
            data-state={showRule1 ? "on" : "off"}
          >
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: rule1Color }}></span>
              <span>Rule 1</span>
            </span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="rule2"
            aria-label="Show Rule 2"
            className={`border-gray-700 text-xs ${showRule2 ? 'bg-purple-500/20 text-purple-400' : ''}`}
            onClick={toggleRule2}
            data-state={showRule2 ? "on" : "off"}
          >
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: rule2Color }}></span>
              <span>Rule 2</span>
            </span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="combined"
            aria-label="Show Combined Rules"
            className={`border-gray-700 text-xs ${showCombined ? 'bg-green-500/20 text-green-400' : ''}`}
            onClick={toggleCombined}
            data-state={showCombined ? "on" : "off"}
          >
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: combinedColor }}></span>
              <span>Combined</span>
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
            
            {/* Main data line */}
            {displayOptions.includes('margin') && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="currentMargin" 
                name="Current Margin %" 
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
                name="Current Profit" 
                stroke={profitColor} 
                strokeWidth={3} 
                dot={{ r: 4, fill: profitColor }} 
                activeDot={{ r: 5 }} 
              />
            )}
            
            {/* Rule 1 lines - controlled by showRule1 state */}
            {showRule1 && displayOptions.includes('margin') && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="proposedRule1Margin" 
                name="Rule 1 Margin %" 
                stroke={rule1Color} 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={{ r: 3, fill: rule1Color }} 
                activeDot={{ r: 4 }} 
              />
            )}
            
            {showRule1 && displayOptions.includes('profit') && (
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="proposedRule1Profit" 
                name="Rule 1 Profit" 
                stroke={rule1Color} 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={{ r: 3, fill: rule1Color }} 
                activeDot={{ r: 4 }} 
              />
            )}
            
            {/* Rule 2 lines - controlled by showRule2 state */}
            {showRule2 && displayOptions.includes('margin') && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="proposedRule2Margin" 
                name="Rule 2 Margin %" 
                stroke={rule2Color} 
                strokeWidth={2} 
                strokeDasharray="3 3"
                dot={{ r: 3, fill: rule2Color }} 
                activeDot={{ r: 4 }} 
              />
            )}
            
            {showRule2 && displayOptions.includes('profit') && (
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="proposedRule2Profit" 
                name="Rule 2 Profit" 
                stroke={rule2Color} 
                strokeWidth={2} 
                strokeDasharray="3 3"
                dot={{ r: 3, fill: rule2Color }} 
                activeDot={{ r: 4 }} 
              />
            )}
            
            {/* Combined rules (optimized combination) */}
            {showCombined && displayOptions.includes('margin') && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="combinedMargin" 
                name="Combined Margin %" 
                stroke={combinedColor} 
                strokeWidth={2}
                dot={{ r: 3, fill: combinedColor }} 
                activeDot={{ r: 4 }} 
              />
            )}
            
            {showCombined && displayOptions.includes('profit') && (
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="combinedProfit" 
                name="Combined Profit" 
                stroke={combinedColor} 
                strokeWidth={2}
                dot={{ r: 3, fill: combinedColor }} 
                activeDot={{ r: 4 }} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend for the rules - updated to show based on visibility */}
      {(showRule1 || showRule2 || showCombined) && (
        <div className="flex flex-wrap gap-4 justify-start text-xs">
          {showRule1 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-4 bg-[#1EAEDB] rounded-sm" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #1EAEDB, #1EAEDB 5px, transparent 5px, transparent 10px)' }}></span>
              <span>Rule 1 (Cost + 8% margin)</span>
            </div>
          )}
          {showRule2 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-4 bg-[#8B5CF6] rounded-sm" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8B5CF6, #8B5CF6 3px, transparent 3px, transparent 6px)' }}></span>
              <span>Rule 2 (TML - 5%)</span>
            </div>
          )}
          {showCombined && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-4 bg-[#10B981] rounded-sm"></span>
              <span>Combined (Best price of Rule 1 & 2)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RevaMetricsChartUpdated;
