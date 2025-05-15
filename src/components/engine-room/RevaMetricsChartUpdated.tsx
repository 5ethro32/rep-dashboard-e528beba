import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { applyPricingRules, RuleConfig } from '@/utils/rule-simulator-utils';

interface RevaMetricsChartProps {
  data: any[];
}

// Define the default rule config for our chart simulations
const defaultRuleConfig: RuleConfig = {
  rule1: {
    marketLowUplift: 3, // Standard 3% uplift for ML
    costMarkup: 12, // Standard 12% markup for cost
    marginCaps: {
      group1_2: 10, // 10% margin cap for groups 1-2
      group3_4: 20, // 20% margin cap for groups 3-4
      group5_6: 30, // 30% margin cap for groups 5-6
    }
  },
  rule2: {
    marketLowUplift: 3, // Standard 3% uplift for ML
    costMarkup: 12, // Standard 12% markup for cost
  },
  globalMarginFloor: 5, // 5% global margin floor
};

const RevaMetricsChartUpdated: React.FC<RevaMetricsChartProps> = ({ data }) => {
  // Add toggle state for chart display - modified to have separate rule toggles
  const [displayOptions, setDisplayOptions] = useState<string[]>(["margin", "profit"]);
  const [showRule1, setShowRule1] = useState<boolean>(false);
  const [showRule2, setShowRule2] = useState<boolean>(false);
  const [showRulesApplied, setShowRulesApplied] = useState<boolean>(false);

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
      
      // Define groups - 200 items per group for groups 1-5, rest in group 6
      const groupSize = 200;
      const results = [];
      
      // Create exactly 5 equal groups of 200 items each
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
        
        // For proposed metrics using real rule simulation
        let totalRulesAppliedRevenue = 0;
        let totalRulesAppliedProfit = 0;
        
        // For simplified rule calculations (for comparison)
        let totalProposedRevenue = 0;
        let totalProposedProfit = 0;
        let totalProposedRule1Revenue = 0;
        let totalProposedRule1Profit = 0;
        let totalProposedRule2Revenue = 0;
        let totalProposedRule2Profit = 0;

        groupItems.forEach(item => {
          const usage = Math.max(0, item.revaUsage || 0); // Ensure non-negative usage
          const price = Math.max(0, item.currentREVAPrice || 0); // Ensure non-negative price
          const cost = Math.max(0, item.avgCost || 0); // Ensure non-negative cost
          
          // Get proposed price values if available
          const proposedPrice = Math.max(0, item.proposedPrice || price);
          
          // IMPROVED: Apply the full pricing rules simulation for "After Rules"
          // Create a clone of the item with the minimum required properties for applyPricingRules
          const itemForRules = {
            avgCost: cost,
            trueMarketLow: Math.max(0, item.trueMarketLow || 0),
            marketLow: Math.max(0, item.trueMarketLow || item.marketLow || 0),
            nextCost: Math.max(0, item.nextCost || cost),  // Use nextCost if available, otherwise fallback to avgCost
            usageRank: Math.max(1, Math.min(6, Number(item.usageRank) || 1)),
            currentREVAPrice: price,
            currentREVAMargin: item.currentREVAMargin || 0,
            noMarketPrice: !item.trueMarketLow && !item.marketLow
          };
          
          // Use the real rule simulation logic for "After Rules"
          const rulesAppliedResult = applyPricingRules(itemForRules, defaultRuleConfig);
          const rulesAppliedPrice = rulesAppliedResult.newPrice;
          
          // Continue calculating the simplified rules for Rule 1 and Rule 2 lines
          // Rule 1: Cost + 8% margin (simplified)
          const rule1Price = cost * 1.09; // Cost + ~9% markup (equivalent to 8% margin)
          
          // Rule 2: TML - 5% (simplified)
          const tml = Math.max(0, item.trueMarketLow || 0);
          const rule2Price = tml > 0 ? tml * 0.95 : proposedPrice; // 5% below TML
          
          // Only calculate profit if we have valid values
          if (usage > 0 && price > 0) {
            const revenue = usage * price;
            const profit = usage * (price - cost);
            
            // Calculate proposed metrics
            const proposedRevenue = usage * proposedPrice;
            const proposedProfit = usage * (proposedPrice - cost);
            
            // Calculate Rule 1 proposed metrics (simplified)
            const proposedRule1Revenue = usage * rule1Price;
            const proposedRule1Profit = usage * (rule1Price - cost);
            
            // Calculate Rule 2 proposed metrics (simplified)
            const proposedRule2Revenue = usage * rule2Price;
            const proposedRule2Profit = usage * (rule2Price - cost);
            
            // Calculate "After Rules" metrics using the real simulation results
            const rulesAppliedRevenue = usage * rulesAppliedPrice;
            const rulesAppliedProfit = usage * (rulesAppliedPrice - cost);
            
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
            
            // Add totals for the real rules applied
            totalRulesAppliedRevenue += rulesAppliedRevenue;
            totalRulesAppliedProfit += rulesAppliedProfit;
            
            // Calculate margin only for valid items
            if (price > 0) {
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
        
        // Calculate the real rules applied margin using the proper simulation
        const rulesAppliedMargin = totalRulesAppliedRevenue > 0 ? (totalRulesAppliedProfit / totalRulesAppliedRevenue) * 100 : 0;

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
          // Replace the simplified "combined" with the real rules applied values
          rulesAppliedProfit: totalRulesAppliedProfit,
          rulesAppliedMargin: rulesAppliedMargin,
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
        
        // For real rule simulation results
        let totalRulesAppliedRevenue = 0;
        let totalRulesAppliedProfit = 0;
        
        // For simplified rules
        let totalProposedRevenue = 0;
        let totalProposedProfit = 0;
        let totalProposedRule1Revenue = 0;
        let totalProposedRule1Profit = 0;
        let totalProposedRule2Revenue = 0;
        let totalProposedRule2Profit = 0;

        remainingItems.forEach(item => {
          const usage = Math.max(0, item.revaUsage || 0); // Ensure non-negative usage
          const price = Math.max(0, item.currentREVAPrice || 0); // Ensure non-negative price
          const cost = Math.max(0, item.avgCost || 0); // Ensure non-negative cost
          
          // Get proposed price values if available
          const proposedPrice = Math.max(0, item.proposedPrice || price);
          
          // IMPROVED: Apply the full pricing rules simulation for "After Rules"
          // Create a clone of the item with the minimum required properties for applyPricingRules
          const itemForRules = {
            avgCost: cost,
            trueMarketLow: Math.max(0, item.trueMarketLow || 0),
            marketLow: Math.max(0, item.trueMarketLow || item.marketLow || 0),
            nextCost: Math.max(0, item.nextCost || cost),  // Use nextCost if available, otherwise fallback to avgCost
            usageRank: Math.max(1, Math.min(6, Number(item.usageRank) || 1)),
            currentREVAPrice: price,
            currentREVAMargin: item.currentREVAMargin || 0,
            noMarketPrice: !item.trueMarketLow && !item.marketLow
          };
          
          // Use the real rule simulation logic for "After Rules"
          const rulesAppliedResult = applyPricingRules(itemForRules, defaultRuleConfig);
          const rulesAppliedPrice = rulesAppliedResult.newPrice;
          
          // Continue calculating the simplified rules for Rule 1 and Rule 2 lines
          // Rule 1: Cost + 8% margin (simplified)
          const rule1Price = cost * 1.09; // Cost + ~9% markup (equivalent to 8% margin)
          
          // Rule 2: TML - 5% (simplified)
          const tml = Math.max(0, item.trueMarketLow || 0);
          const rule2Price = tml > 0 ? tml * 0.95 : proposedPrice; // 5% below TML
          
          // Only calculate profit if we have valid values
          if (usage > 0 && price > 0) {
            const revenue = usage * price;
            const profit = usage * (price - cost);
            
            // Calculate proposed metrics
            const proposedRevenue = usage * proposedPrice;
            const proposedProfit = usage * (proposedPrice - cost);
            
            // Calculate Rule 1 proposed metrics (simplified)
            const proposedRule1Revenue = usage * rule1Price;
            const proposedRule1Profit = usage * (rule1Price - cost);
            
            // Calculate Rule 2 proposed metrics (simplified)
            const proposedRule2Revenue = usage * rule2Price;
            const proposedRule2Profit = usage * (rule2Price - cost);
            
            // Calculate "After Rules" metrics using the real simulation results
            const rulesAppliedRevenue = usage * rulesAppliedPrice;
            const rulesAppliedProfit = usage * (rulesAppliedPrice - cost);
            
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
            
            // Add totals for the real rules applied
            totalRulesAppliedRevenue += rulesAppliedRevenue;
            totalRulesAppliedProfit += rulesAppliedProfit;
            
            // Calculate margin only for valid items
            if (price > 0) {
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
        
        // Calculate the real rules applied margin using the proper simulation
        const rulesAppliedMargin = totalRulesAppliedRevenue > 0 ? (totalRulesAppliedProfit / totalRulesAppliedRevenue) * 100 : 0;

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
          // Replace the simplified "combined" with the real rules applied values
          rulesAppliedProfit: totalRulesAppliedProfit,
          rulesAppliedMargin: rulesAppliedMargin,
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
      item.rulesAppliedProfit || 0
    ))
  );
  
  // Calculate the maximum margin value
  const maxMargin = Math.max(
    ...processedData.map(item => Math.max(
      item.currentMargin || 0,
      item.proposedMargin || 0,
      item.proposedRule1Margin || 0,
      item.proposedRule2Margin || 0,
      item.rulesAppliedMargin || 0
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
  const rulesAppliedColor = "#10B981"; // Green for applied rules

  // Handle toggle changes
  const handleDisplayOptionsChange = (values: string[]) => {
    // Ensure we always have at least one option selected
    if (values.length === 0) return;
    setDisplayOptions(values);
  };

  // Toggle handlers for rule displays
  const toggleRule1 = () => {
    setShowRule1(!showRule1);
    // If turning on rule1, turn off "rulesApplied" if it's active
    if (!showRule1) {
      setShowRulesApplied(false);
    }
  };
  
  const toggleRule2 = () => {
    setShowRule2(!showRule2);
    // If turning on rule2, turn off "rulesApplied" if it's active
    if (!showRule2) {
      setShowRulesApplied(false);
    }
  };
  
  // New toggle handler for applied rules (showing optimized combination)
  const toggleRulesApplied = () => {
    setShowRulesApplied(!showRulesApplied);
    // When toggling rules applied on, turn off individual rule toggles
    if (!showRulesApplied) {
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
        
        {/* Updated toggle group with three options: Rule 1, Rule 2, and After Rules */}
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
            value="rulesApplied"
            aria-label="Show Rules Applied"
            className={`border-gray-700 text-xs ${showRulesApplied ? 'bg-green-500/20 text-green-400' : ''}`}
            onClick={toggleRulesApplied}
            data-state={showRulesApplied ? "on" : "off"}
          >
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: rulesAppliedColor }}></span>
              <span>After Rules</span>
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
            
            {/* UPDATED: Changed from combinedMargin/Profit to rulesAppliedMargin/Profit */}
            {showRulesApplied && displayOptions.includes('margin') && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="rulesAppliedMargin" 
                name="After Rules Margin %" 
                stroke={rulesAppliedColor} 
                strokeWidth={2}
                dot={{ r: 3, fill: rulesAppliedColor }} 
                activeDot={{ r: 4 }} 
              />
            )}
            
            {showRulesApplied && displayOptions.includes('profit') && (
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="rulesAppliedProfit" 
                name="After Rules Profit" 
                stroke={rulesAppliedColor} 
                strokeWidth={2}
                dot={{ r: 3, fill: rulesAppliedColor }} 
                activeDot={{ r: 4 }} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Updated legend for the rules - updated to show based on visibility */}
      {(showRule1 || showRule2 || showRulesApplied) && (
        <div className="flex flex-wrap gap-4 justify-start text-xs">
          {showRule1 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-4 bg-[#1EAEDB] rounded-sm" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #1EAEDB, #1EAEDB 5px, transparent 5px, transparent 10px)' }}></span>
              <span>Rule 1 (Market Low Based Pricing)</span>
            </div>
          )}
          {showRule2 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-4 bg-[#8B5CF6] rounded-sm" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8B5CF6, #8B5CF6 3px, transparent 3px, transparent 6px)' }}></span>
              <span>Rule 2 (Cost Based Pricing)</span>
            </div>
          )}
          {showRulesApplied && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-4 bg-[#10B981] rounded-sm"></span>
              <span>After Rules Applied (Complete Rule Engine)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RevaMetricsChartUpdated;
