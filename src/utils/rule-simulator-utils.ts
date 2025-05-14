
import { formatCurrency, calculateUsageWeightedMetrics } from './formatting-utils';

// Define the rule config type
export interface RuleConfig {
  rule1: {
    marginCaps: {
      group1_2: number;
      group3_4: number;
      group5_6: number;
    };
    markups: {
      rule1a: {
        group1_2: number;
        group3_4: number;
        group5_6: number;
      };
      rule1b: {
        group1_2: number;
        group3_4: number;
        group5_6: number;
      };
    };
  };
  rule2: {
    markups: {
      group1_2: number;
      group3_4: number;
      group5_6: number;
    };
  };
  globalMarginFloor: number;
}

// Helper function to determine usage group
const determineUsageGroup = (usageRank: number) => {
  if (usageRank <= 2) return 'group1_2';
  if (usageRank <= 4) return 'group3_4';
  return 'group5_6';
};

// Apply pricing rules to calculate a new price - Updated to match engine-excel-utils.ts logic
export const applyPricingRules = (item: any, ruleConfig: RuleConfig) => {
  // Extract needed values
  const cost = Math.max(0, Number(item.avgCost) || 0);
  const marketLow = Math.max(0, Number(item.trueMarketLow) || Number(item.marketLow) || 0);
  const usageRank = Math.max(1, Math.min(6, Number(item.usageRank) || 1));
  
  // Handle no market price case
  const noMarketPrice = item.noMarketPrice || !marketLow || marketLow <= 0;
  
  // Determine which usage group this item belongs to
  const usageGroup = determineUsageGroup(usageRank);
  
  // Get the appropriate markup values based on usage group
  const groupKey = usageGroup as keyof typeof ruleConfig.rule1.markups.rule1a;
  
  // Determine trend (from engine-excel-utils.ts logic)
  const isDownwardTrend = item.nextCost <= item.avgCost; 
  
  let newPrice = 0;
  let ruleApplied = 'none';
  
  // Apply rules based on cost vs. market price relationship
  if (!noMarketPrice) {
    // We have a market price to work with
    
    // Rule 1: AvgCost >= Market Low
    if (cost >= marketLow) {
      // Apply Rule 1a or Rule 1b based on market trend
      if (isDownwardTrend) {
        // Rule 1a - Downward Trend
        const markup = 1 + (ruleConfig.rule1.markups.rule1a[groupKey] / 100);
        newPrice = marketLow * markup;
        ruleApplied = 'rule1a';
      } else {
        // Rule 1b - Upward Trend
        const mlMarkup = 1 + (ruleConfig.rule1.markups.rule1b[groupKey] / 100);
        const costMarkup = 1 + (ruleConfig.rule2.markups[groupKey] / 100);
        
        const mlPrice = marketLow * mlMarkup;
        const costPrice = cost * costMarkup;
        
        newPrice = Math.max(mlPrice, costPrice);
        ruleApplied = newPrice === mlPrice ? 'rule1b_ml' : 'rule1b_cost';
      }
    } 
    // Rule 2: AvgCost < Market Low
    else {
      // Calculate cost to market ratio
      const costToMarketRatio = cost / marketLow;
      
      // Rule 2a: If cost is within 5-10% of market low
      if (costToMarketRatio >= 0.90 && costToMarketRatio < 0.95) {
        if (isDownwardTrend) {
          // 3%, 4%, or 5% markup depending on group
          const uplift = 1 + (3 + (Math.min(usageRank, 5) - 1) * 1) / 100;
          newPrice = marketLow * uplift;
          ruleApplied = 'rule2_downtrend';
        } else {
          // Market Low uplift (3%, 4%, or 5%)
          const mlUplift = 1 + (3 + (Math.min(usageRank, 5) - 1) * 1) / 100;
          // Cost markup (12%, 13%, or 14%)
          const costMarkup = 1 + (ruleConfig.rule2.markups[groupKey] / 100);
          
          const mlPrice = marketLow * mlUplift;
          const costPrice = cost * costMarkup;
          
          newPrice = Math.max(mlPrice, costPrice);
          ruleApplied = newPrice === mlPrice ? 'rule2_ml' : 'rule2_cost';
        }
      } 
      // Rule 2b: If cost is more than 10% below market low
      else if (costToMarketRatio < 0.90) {
        if (isDownwardTrend) {
          // 3%, 4%, or 5% markup depending on group
          const uplift = 1 + (3 + (Math.min(usageRank, 5) - 1) * 1) / 100;
          newPrice = marketLow * uplift;
          ruleApplied = 'rule2_downtrend';
        } else {
          // Market Low uplift (3%, 4%, or 5%)
          const mlUplift = 1 + (3 + (Math.min(usageRank, 5) - 1) * 1) / 100;
          // Cost markup (12%, 13%, or 14%)
          const costMarkup = 1 + (ruleConfig.rule2.markups[groupKey] / 100);
          
          const mlPrice = marketLow * mlUplift;
          const costPrice = cost * costMarkup;
          
          newPrice = Math.max(mlPrice, costPrice);
          ruleApplied = newPrice === mlPrice ? 'rule2_ml' : 'rule2_cost';
        }
      }
      // Cost is within 5% of market low - use Rule 1b
      else {
        const markup = 1 + (ruleConfig.rule1.markups.rule1b[groupKey] / 100);
        newPrice = cost * markup;
        ruleApplied = 'rule1b_near_market';
      }
    }
  } else {
    // No market price - use cost-based pricing directly
    const costMarkup = 1 + (ruleConfig.rule2.markups[groupKey] / 100);
    
    newPrice = cost * costMarkup;
    ruleApplied = 'cost_based_no_market';
  }
  
  // Apply margin caps based on usage group, but ONLY for items with avgCost <= 1.00
  const marginCap = ruleConfig.rule1.marginCaps[groupKey as keyof typeof ruleConfig.rule1.marginCaps] / 100;
  const maxPriceByMarginCap = cost > 0 ? cost / (1 - marginCap) : 0;
  
  // Cap the price based on maximum allowed margin, but only if cost is £1.00 or less
  let marginCapApplied = false;
  if (cost <= 1.00 && newPrice > maxPriceByMarginCap && maxPriceByMarginCap > 0) {
    newPrice = maxPriceByMarginCap;
    marginCapApplied = true;
    ruleApplied += '_capped';
  }
  
  // Ensure global margin floor
  let marginFloorApplied = false;
  const newMargin = newPrice > 0 ? (newPrice - cost) / newPrice : 0;
  const minMargin = ruleConfig.globalMarginFloor / 100;
  
  if (newMargin < minMargin && cost > 0) {
    newPrice = cost / (1 - minMargin);
    marginFloorApplied = true;
    ruleApplied += '_floor';
  }
  
  // Calculate flags based on actual criteria
  const flag1 = !noMarketPrice && marketLow > 0 && newPrice >= marketLow * 1.10; // Price ≥10% above TRUE MARKET LOW
  const flag2 = newMargin <= 0; // UPDATED: Margin <= 0% (changed from < 5%)
  
  return {
    originalPrice: item.currentREVAPrice || 0,
    newPrice: Math.max(cost, newPrice), // Never price below cost
    cost: cost,
    marketLow: marketLow,
    originalMargin: item.currentREVAMargin || 0,
    newMargin: newPrice > 0 ? (newPrice - cost) / newPrice : 0, // Store as decimal, not percentage
    marginDiff: newPrice > 0 ? ((newPrice - cost) / newPrice) - (item.currentREVAMargin || 0) : 0, // Store difference as decimal
    ruleApplied: ruleApplied,
    usageGroup: usageGroup,
    usageRank: usageRank,
    flag1: flag1,
    flag2: flag2,
    marginCapApplied: marginCapApplied,
    marginFloorApplied: marginFloorApplied
  };
};

// Simulate rule changes and calculate the impact
export const simulateRuleChanges = (items: any[], ruleConfig: RuleConfig) => {
  // Create a deep copy of items to avoid mutating the original data
  const itemsCopy = JSON.parse(JSON.stringify(items || []));
  
  if (!itemsCopy || !itemsCopy.length) {
    throw new Error("No items available for simulation");
  }
  
  // Calculate baseline metrics using the original data
  const baselineMetrics = calculateUsageWeightedMetrics(itemsCopy);
  
  // Apply simulation rules to each item
  const simulatedItems = itemsCopy.map((item: any) => {
    const simulationResult = applyPricingRules(item, ruleConfig);
    
    // Update the item with the simulated price
    return {
      ...item,
      simulatedPrice: simulationResult.newPrice,
      simulatedMargin: simulationResult.newMargin,
      originalPrice: simulationResult.originalPrice,
      originalMargin: simulationResult.originalMargin,
      marginDiff: simulationResult.marginDiff,
      ruleApplied: simulationResult.ruleApplied,
      usageGroup: simulationResult.usageGroup,
      flag1: simulationResult.flag1,
      flag2: simulationResult.flag2,
      marginCapApplied: simulationResult.marginCapApplied,
      marginFloorApplied: simulationResult.marginFloorApplied
    };
  });
  
  // Calculate metrics based on the simulated prices
  const simulatedItemsForMetrics = simulatedItems.map((item: any) => ({
    ...item,
    currentREVAPrice: item.simulatedPrice,
    currentREVAMargin: item.simulatedMargin
  }));
  
  const simulatedMetrics = calculateUsageWeightedMetrics(simulatedItemsForMetrics);
  
  // Calculate differences between baseline and simulated metrics
  const revenueDiff = simulatedMetrics.totalRevenue - baselineMetrics.totalRevenue;
  const revenueDiffPercent = baselineMetrics.totalRevenue > 0 
    ? (revenueDiff / baselineMetrics.totalRevenue) * 100 
    : 0;
    
  const profitDiff = simulatedMetrics.totalProfit - baselineMetrics.totalProfit;
  const profitDiffPercent = baselineMetrics.totalProfit > 0 
    ? (profitDiff / baselineMetrics.totalProfit) * 100 
    : 0;
    
  const marginDiff = simulatedMetrics.weightedMargin - baselineMetrics.weightedMargin;
  
  // Calculate impact by usage group
  const groupImpact = [
    { name: "Group 1-2", displayName: "Low Usage", usageRanks: [1, 2] },
    { name: "Group 3-4", displayName: "Medium Usage", usageRanks: [3, 4] },
    { name: "Group 5-6", displayName: "High Usage", usageRanks: [5, 6] }
  ].map(group => {
    // Filter items for this usage group
    const groupItems = simulatedItems.filter(item => {
      const usageRank = item.usageRank || 1;
      return group.usageRanks.includes(usageRank);
    });
    
    // Calculate baseline metrics for this group
    const groupBaseItems = itemsCopy.filter(item => {
      const usageRank = item.usageRank || 1;
      return group.usageRanks.includes(usageRank);
    });
    
    // Calculate baseline revenue and profit for this group
    let baseRevenue = 0;
    let baseProfit = 0;
    let baseMargin = 0;
    let baseMarginNum = 0;
    let baseMarginDenom = 0;
    
    groupBaseItems.forEach(item => {
      const usage = Math.max(0, item.revaUsage || 0);
      const price = Math.max(0, item.currentREVAPrice || 0);
      const cost = Math.max(0, item.avgCost || 0);
      
      if (usage > 0 && price > 0) {
        const itemRevenue = usage * price;
        const itemProfit = usage * (price - cost);
        
        baseRevenue += itemRevenue;
        baseProfit += itemProfit;
        
        // For weighted margin calculation
        baseMarginNum += (price - cost) * usage;
        baseMarginDenom += price * usage;
      }
    });
    
    // Calculate weighted margin for this group
    baseMargin = baseMarginDenom > 0 ? (baseMarginNum / baseMarginDenom) * 100 : 0;
    
    // Calculate simulated metrics for this group
    let simRevenue = 0;
    let simProfit = 0;
    let simMargin = 0;
    let simMarginNum = 0;
    let simMarginDenom = 0;
    let highPriceFlags = 0;
    let lowMarginFlags = 0;
    let marginCapApplied = 0;
    let marginFloorApplied = 0;
    
    groupItems.forEach(item => {
      const usage = Math.max(0, item.revaUsage || 0);
      const price = Math.max(0, item.simulatedPrice || 0);
      const cost = Math.max(0, item.avgCost || 0);
      
      if (usage > 0 && price > 0) {
        const itemRevenue = usage * price;
        const itemProfit = usage * (price - cost);
        
        simRevenue += itemRevenue;
        simProfit += itemProfit;
        
        // For weighted margin calculation
        simMarginNum += (price - cost) * usage;
        simMarginDenom += price * usage;
      }
      
      // Count flags
      if (item.flag1) highPriceFlags++;
      if (item.flag2) lowMarginFlags++;
      if (item.marginCapApplied) marginCapApplied++;
      if (item.marginFloorApplied) marginFloorApplied++;
    });
    
    // Calculate weighted margin for this group
    simMargin = simMarginDenom > 0 ? (simMarginNum / simMarginDenom) * 100 : 0;
    
    // Calculate differences for this group
    const revenueDiff = simRevenue - baseRevenue;
    const revenueDiffPercent = baseRevenue > 0 ? (revenueDiff / baseRevenue) * 100 : 0;
    
    const profitDiff = simProfit - baseProfit;
    const profitDiffPercent = baseProfit > 0 ? (profitDiff / baseProfit) * 100 : 0;
    
    const marginDiff = simMargin - baseMargin;
    
    return {
      name: group.name,
      displayName: group.displayName,
      itemCount: groupItems.length,
      baseline: {
        revenue: baseRevenue,
        profit: baseProfit,
        margin: baseMargin
      },
      simulated: {
        revenue: simRevenue,
        profit: simProfit,
        margin: simMargin,
        highPriceFlags,
        lowMarginFlags,
        marginCapApplied,
        marginFloorApplied
      },
      changes: {
        revenueDiff,
        revenueDiffPercent,
        profitDiff,
        profitDiffPercent,
        marginDiff
      }
    };
  });
  
  // Count overall flags
  const highPriceFlags = simulatedItems.filter((item: any) => item.flag1).length;
  const lowMarginFlags = simulatedItems.filter((item: any) => item.flag2).length;
  const marginCapApplied = simulatedItems.filter((item: any) => item.marginCapApplied).length;
  const marginFloorApplied = simulatedItems.filter((item: any) => item.marginFloorApplied).length;
  
  // Return simulation results
  return {
    baseline: {
      totalRevenue: baselineMetrics.totalRevenue,
      totalProfit: baselineMetrics.totalProfit,
      weightedMargin: baselineMetrics.weightedMargin,
      count: itemsCopy.length
    },
    simulated: {
      totalRevenue: simulatedMetrics.totalRevenue,
      totalProfit: simulatedMetrics.totalProfit,
      weightedMargin: simulatedMetrics.weightedMargin,
      count: simulatedItems.length,
      highPriceFlags,
      lowMarginFlags,
      marginCapApplied,
      marginFloorApplied
    },
    changes: {
      revenueDiff,
      revenueDiffPercent,
      profitDiff,
      profitDiffPercent,
      marginDiff
    },
    config: ruleConfig,
    itemResults: simulatedItems,
    groupImpact,
  };
};
