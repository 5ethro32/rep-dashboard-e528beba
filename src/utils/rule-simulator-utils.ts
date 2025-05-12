
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
      rule2a: {
        group1_2: number;
        group3_4: number;
        group5_6: number;
      };
      rule2b: {
        group1_2: number;
        group3_4: number;
        group5_6: number;
      };
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

// Apply pricing rules to calculate a new price
const applyPricingRules = (item: any, ruleConfig: RuleConfig) => {
  // Extract needed values
  const cost = Math.max(0, Number(item.avgCost) || 0);
  const marketLow = Math.max(0, Number(item.trueMarketLow) || 0);
  const usageRank = Math.max(1, Math.min(6, Number(item.usageRank) || 1));
  
  // Handle no market price case
  const noMarketPrice = item.noMarketPrice || !marketLow || marketLow <= 0;
  
  // Determine which usage group this item belongs to
  const usageGroup = determineUsageGroup(usageRank);
  
  let newPrice = 0;
  let ruleApplied = 'none';
  
  // If no market price, fall back to cost-based pricing with appropriate markup
  if (noMarketPrice) {
    // Use rule 1b markup by usage group if no market price
    const markup = ruleConfig.rule1.markups.rule1b[usageGroup as keyof typeof ruleConfig.rule1.markups.rule1b] / 100;
    newPrice = cost * (1 + markup);
    ruleApplied = 'rule1b_no_market';
  } 
  // Rule 1: Above market low price
  else if (cost > marketLow) {
    // Rule 1a: Cost is above market
    const markup = ruleConfig.rule1.markups.rule1a[usageGroup as keyof typeof ruleConfig.rule1.markups.rule1a] / 100;
    newPrice = cost * (1 + markup);
    ruleApplied = 'rule1a';
  } 
  else {
    // Cost is below market low
    const costToMarketRatio = marketLow > 0 ? cost / marketLow : 0;
    
    // Rule 1b: If cost is within 5% of market low
    if (costToMarketRatio >= 0.95) {
      const markup = ruleConfig.rule1.markups.rule1b[usageGroup as keyof typeof ruleConfig.rule1.markups.rule1b] / 100;
      newPrice = cost * (1 + markup);
      ruleApplied = 'rule1b';
    } 
    // Rule 2a: If cost is between 5-10% below market low
    else if (costToMarketRatio >= 0.90) {
      const discount = ruleConfig.rule2.markups.rule2a[usageGroup as keyof typeof ruleConfig.rule2.markups.rule2a] / 100;
      newPrice = marketLow * (1 - discount);
      ruleApplied = 'rule2a';
    } 
    // Rule 2b: If cost is more than 10% below market low
    else {
      const discount = ruleConfig.rule2.markups.rule2b[usageGroup as keyof typeof ruleConfig.rule2.markups.rule2b] / 100;
      newPrice = marketLow * (1 - discount);
      ruleApplied = 'rule2b';
    }
  }
  
  // Apply margin caps from rule config based on usage group
  const marginCap = ruleConfig.rule1.marginCaps[usageGroup as keyof typeof ruleConfig.rule1.marginCaps] / 100;
  const maxPriceByMarginCap = cost / (1 - marginCap);
  
  // Cap the price based on maximum allowed margin
  if (newPrice > maxPriceByMarginCap) {
    newPrice = maxPriceByMarginCap;
    ruleApplied += '_capped';
  }
  
  // Enforce global margin floor
  const newMargin = newPrice > 0 ? (newPrice - cost) / newPrice : 0;
  const minMargin = ruleConfig.globalMarginFloor / 100;
  
  if (newMargin < minMargin && cost > 0) {
    newPrice = cost / (1 - minMargin);
    ruleApplied += '_floor';
  }
  
  return {
    originalPrice: item.currentREVAPrice || 0,
    newPrice: Math.max(cost, newPrice), // Never price below cost
    cost: cost,
    marketLow: marketLow,
    originalMargin: item.currentREVAMargin || 0,
    newMargin: newPrice > 0 ? ((newPrice - cost) / newPrice) * 100 : 0,
    marginDiff: newPrice > 0 ? ((newPrice - cost) / newPrice) * 100 - (item.currentREVAMargin || 0) : 0,
    ruleApplied: ruleApplied,
    usageGroup: usageGroup,
    usageRank: usageRank
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
      usageGroup: simulationResult.usageGroup
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
    const groupItems = simulatedItems.filter(
      (item: any) => group.usageRanks.includes(Number(item.usageRank || 0))
    );
    
    // Calculate metrics for original prices in this group
    const originalGroupItems = groupItems.map((item: any) => ({
      ...item,
      currentREVAPrice: item.originalPrice,
      currentREVAMargin: item.originalMargin
    }));
    
    const originalGroupMetrics = calculateUsageWeightedMetrics(originalGroupItems);
    
    // Calculate metrics for simulated prices in this group
    const simulatedGroupItems = groupItems.map((item: any) => ({
      ...item,
      currentREVAPrice: item.simulatedPrice,
      currentREVAMargin: item.simulatedMargin
    }));
    
    const simulatedGroupMetrics = calculateUsageWeightedMetrics(simulatedGroupItems);
    
    // Calculate differences
    const marginDiff = simulatedGroupMetrics.weightedMargin - originalGroupMetrics.weightedMargin;
    const profitDiff = simulatedGroupMetrics.totalProfit - originalGroupMetrics.totalProfit;
    const profitDiffPercent = originalGroupMetrics.totalProfit > 0 
      ? (profitDiff / originalGroupMetrics.totalProfit) * 100 
      : 0;
    const revenueDiff = simulatedGroupMetrics.totalRevenue - originalGroupMetrics.totalRevenue;
    
    return {
      name: group.name,
      displayName: group.displayName,
      margin: {
        current: originalGroupMetrics.weightedMargin,
        simulated: simulatedGroupMetrics.weightedMargin,
        diff: marginDiff
      },
      profit: {
        current: originalGroupMetrics.totalProfit,
        simulated: simulatedGroupMetrics.totalProfit,
        diff: profitDiff,
        diffPercent: profitDiffPercent
      },
      revenue: {
        current: originalGroupMetrics.totalRevenue,
        simulated: simulatedGroupMetrics.totalRevenue,
        diff: revenueDiff
      },
      itemCount: groupItems.length
    };
  });
  
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
      count: simulatedItems.length
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
