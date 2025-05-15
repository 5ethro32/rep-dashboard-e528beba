
import { formatCurrency, calculateUsageWeightedMetrics } from './formatting-utils';

// Define the rule config type
export interface RuleConfig {
  // Simplified rule configuration to match new structure
  rule1: {
    // For when AVC < ML
    marketLowUplift: number; // Standard 3% uplift for ML
    costMarkup: number; // Standard 12% markup for cost
    marginCaps: {
      group1_2: number;
      group3_4: number;
      group5_6: number;
    };
  };
  rule2: {
    // For when AVC >= ML
    marketLowUplift: number; // Standard 3% uplift for ML
    costMarkup: number; // Standard 12% markup for cost
  };
  globalMarginFloor: number;
}

// Helper function to determine usage group
const determineUsageGroup = (usageRank: number) => {
  if (usageRank <= 2) return 'group1_2';
  if (usageRank <= 4) return 'group3_4';
  return 'group5_6';
};

// Helper function to get the usage-based uplift percentage
const getUsageBasedUplift = (usageRank: number): number => {
  if (usageRank <= 2) return 0; // 0% uplift for ranks 1-2
  if (usageRank <= 4) return 1; // 1% uplift for ranks 3-4
  return 2; // 2% uplift for ranks 5-6
};

// Apply pricing rules to calculate a new price - Updated to match new rule structure
export const applyPricingRules = (item: any, ruleConfig: RuleConfig) => {
  // Extract needed values
  const cost = Math.max(0, Number(item.avgCost) || 0);
  const nextCost = Math.max(0, Number(item.nextCost) || 0);
  const usageRank = Math.max(1, Math.min(6, Number(item.usageRank) || 1));
  
  // Determine market low - prioritize ETH_NET but fallback to true market low
  let marketLow = Number(item.eth_net) || 0;
  
  // Determine true market low (minimum of all competitor prices)
  let trueMarketLow = Infinity;
  let hasAnyCompetitorPrice = false;
  
  // Check each competitor price and track if any are available
  const competitorPrices = [
    Number(item.eth_net) || 0,
    Number(item.eth) || 0,
    Number(item.nupharm) || 0,
    Number(item.lexon) || 0,
    Number(item.aah) || 0
  ];
  
  for (const price of competitorPrices) {
    if (price > 0) {
      trueMarketLow = Math.min(trueMarketLow, price);
      hasAnyCompetitorPrice = true;
    }
  }
  
  // Set true market low if valid competitor prices exist
  if (hasAnyCompetitorPrice) {
    // If ETH_NET (marketLow) is missing but true market low is available, use that
    if (marketLow <= 0) {
      marketLow = trueMarketLow;
    }
    // Set the true market low value
    trueMarketLow = trueMarketLow !== Infinity ? trueMarketLow : 0;
  } else {
    // No competitor prices available
    trueMarketLow = 0;
    marketLow = 0;
  }
  
  // Flag if no market price is available
  const noMarketPrice = marketLow <= 0;
  
  // Determine which usage group this item belongs to
  const usageGroup = determineUsageGroup(usageRank);
  
  // Determine if next buying price is lower than or equal to avg cost (downward trend)
  // Also treat as downward if next cost is missing
  const isDownwardTrend = nextCost <= cost || nextCost === 0;
  
  // Get usage-based uplift percentage based on usage rank
  const usageUplift = getUsageBasedUplift(usageRank) / 100; // Convert to decimal (0%, 1%, or 2%)
  
  // Special handling for zero cost items
  const isZeroCost = cost === 0;
  
  // Debug logging to help identify issues
  console.log('Processing item:', item.description, {
    cost, marketLow, trueMarketLow, nextCost, usageRank, noMarketPrice, isZeroCost, isDownwardTrend,
    usageUplift: usageUplift * 100 + '%'
  });
  
  let newPrice = 0;
  let ruleApplied = 'none';
  let marginCapApplied = false;
  let marginFloorApplied = false;
  
  // UPDATED RULE STRUCTURE
  
  // Special handling for zero cost items
  if (isZeroCost) {
    console.log(`ZERO COST ITEM DETECTED: ${item.description}`);
    
    // If market price is available, use it
    if (!noMarketPrice) {
      console.log(`Market price available for zero cost item: ${marketLow}`);
      
      // Standard markup for market low (3% + usage uplift)
      const standardMLMarkup = 1 + (ruleConfig.rule1.marketLowUplift / 100) + usageUplift;
      newPrice = marketLow * standardMLMarkup;
      ruleApplied = 'zero_cost_market';
    }
    // No market price but we have next cost
    else if (nextCost > 0) {
      // Apply standard rule2 markup to next cost (12%)
      const costMarkup = 1 + (ruleConfig.rule1.costMarkup / 100) + usageUplift;
      newPrice = nextCost * costMarkup;
      ruleApplied = 'zero_cost_nextcost';
    }
    // No market price and no next cost, but we have current price
    else if (item.currentREVAPrice > 0) {
      // Use current price directly
      newPrice = item.currentREVAPrice;
      ruleApplied = 'zero_cost_currentprice';
    }
    // Absolute fallback - minimum price
    else {
      newPrice = 0.01; // Minimum price
      ruleApplied = 'zero_cost_minimum';
    }
  }
  // RULE 1: AVC < ML - Average Cost is less than Market Low
  else if (!noMarketPrice && cost < marketLow) {
    console.log(`RULE 1: AVC < ML - ${cost} < ${marketLow}`);
    
    // Standard markup for market low (3% + usage uplift)
    const standardMLMarkup = 1 + (ruleConfig.rule1.marketLowUplift / 100) + usageUplift;
    
    // For downward trends (NBP ≤ AVC)
    if (isDownwardTrend) {
      // Set price to ML + uplift (usage based)
      const mlMarkup = 1 + usageUplift; // Just the usage uplift (0%, 1%, or 2%)
      newPrice = marketLow * mlMarkup;
      ruleApplied = `rule1_downward_ml_uplift_${(usageUplift * 100).toFixed(0)}`;
    } 
    // For upward trends (NBP > AVC)
    else {
      // Set price to higher of:
      // - ML + 3% + uplift
      // - AVC + 12%
      const mlPrice = marketLow * standardMLMarkup;
      
      // Cost markup (12%)
      const costMarkup = 1 + (ruleConfig.rule1.costMarkup / 100);
      const costPrice = cost * costMarkup;
      
      newPrice = Math.max(mlPrice, costPrice);
      ruleApplied = newPrice === mlPrice ? 'rule1_upward_ml' : 'rule1_upward_cost';
    }
    
    // Apply margin cap for items with cost ≤ £1.00
    if (cost <= 1.00) {
      // Get the appropriate margin cap percentage for this usage group
      const marginCapKey = usageGroup as keyof typeof ruleConfig.rule1.marginCaps;
      const marginCap = ruleConfig.rule1.marginCaps[marginCapKey] / 100; // Convert to decimal
      
      // Calculate max price based on margin cap
      const maxPriceByMarginCap = cost / (1 - marginCap);
      
      if (newPrice > maxPriceByMarginCap && maxPriceByMarginCap > 0) {
        newPrice = maxPriceByMarginCap;
        marginCapApplied = true;
        ruleApplied += '_capped';
      }
    }
  }
  // RULE 2: AVC ≥ ML - Average Cost is greater than or equal to Market Low
  else if (!noMarketPrice && cost >= marketLow) {
    console.log(`RULE 2: AVC ≥ ML - ${cost} ≥ ${marketLow}`);
    
    // Standard markup for market low (3% + usage uplift)
    const standardMLMarkup = 1 + (ruleConfig.rule1.marketLowUplift / 100) + usageUplift;
    
    // Standard markup for cost (12% + usage uplift)
    const standardCostMarkup = 1 + (ruleConfig.rule2.costMarkup / 100) + usageUplift;
    
    // ML price with standard markup
    const mlPrice = marketLow * standardMLMarkup;
    
    // Cost price with standard markup
    const costPrice = cost * standardCostMarkup;
    
    // For downward trends (NBP ≤ AVC)
    if (isDownwardTrend) {
      // Set price to lower of:
      // - ML + 3% + uplift
      // - AVC + 12% + uplift
      newPrice = Math.min(mlPrice, costPrice);
      ruleApplied = newPrice === mlPrice ? 'rule2_downward_ml' : 'rule2_downward_cost';
    } 
    // For upward trends (NBP > AVC)
    else {
      // Set price to higher of:
      // - ML + 3% + uplift
      // - AVC + 12% + uplift
      newPrice = Math.max(mlPrice, costPrice);
      ruleApplied = newPrice === mlPrice ? 'rule2_upward_ml' : 'rule2_upward_cost';
    }
  }
  // FALLBACKS: No Market Low (ML) available
  else {
    console.log(`FALLBACK: No Market Low - ${cost}`);
    
    // Use AVC + 12% + uplift
    const standardCostMarkup = 1 + (ruleConfig.rule2.costMarkup / 100) + usageUplift;
    newPrice = cost * standardCostMarkup;
    ruleApplied = 'fallback_cost_based';
  }
  
  // Ensure we never have zero or negative price
  if (newPrice <= 0) {
    // Emergency fallback - better than returning zero
    if (marketLow > 0) {
      newPrice = marketLow * 1.05;
      ruleApplied += '_emergency_fallback';
    } else if (nextCost > 0) {
      newPrice = nextCost * 1.15;
      ruleApplied += '_emergency_fallback_nextcost';
    } else if (item.currentREVAPrice > 0) {
      newPrice = item.currentREVAPrice;
      ruleApplied += '_emergency_fallback_currentprice';
    } else {
      // Absolute last resort - set a minimum price of £0.01
      newPrice = 0.01;
      ruleApplied += '_minimum_price_enforced';
    }
  }
  
  // Apply global margin floor if configured
  if (!isZeroCost && cost > 0 && ruleConfig.globalMarginFloor > 0) {
    const newMargin = newPrice > 0 ? (newPrice - cost) / newPrice : 0;
    const minMargin = ruleConfig.globalMarginFloor / 100;
    
    if (newMargin < minMargin) {
      newPrice = cost / (1 - minMargin);
      marginFloorApplied = true;
      ruleApplied += '_floor';
    }
  }
  
  // Calculate margin for the item
  const newMargin = newPrice > 0 ? (newPrice - cost) / newPrice : 0;
  
  // Calculate flags based on actual criteria
  const flag1 = !noMarketPrice && trueMarketLow > 0 && newPrice >= trueMarketLow * 1.10; // Price ≥10% above TRUE MARKET LOW
  const flag2 = newMargin <= 0; // Margin <= 0%
  
  return {
    originalPrice: item.currentREVAPrice || 0,
    newPrice: newPrice,
    cost: cost,
    marketLow: marketLow,
    originalMargin: item.currentREVAMargin || 0,
    newMargin: newMargin, // Store as decimal, not percentage
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
