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
    marginCaps: {  // Added margin caps for rule2
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

// Helper function to get the usage-based uplift percentage
const getUsageBasedUplift = (usageRank: number): number => {
  if (usageRank <= 2) return 0; // 0% uplift for ranks 1-2
  if (usageRank <= 4) return 1; // 1% uplift for ranks 3-4
  return 2; // 2% uplift for ranks 5-6
};

// Helper function to get the usage-based competitor markup percentage
const getUsageBasedCompetitorMarkup = (usageRank: number): number => {
  if (usageRank <= 2) return 3; // 3% uplift for ranks 1-2
  if (usageRank <= 4) return 4; // 4% uplift for ranks 3-4
  return 5; // 5% uplift for ranks 5-6
};

// Helper function to validate if a price is valid (non-zero positive number)
// This is a new helper function to make the price validation more robust
const isValidPrice = (price: any): boolean => {
  // Convert to number if it's a string or any other type
  const numPrice = Number(price);
  // Check if it's a valid positive number
  return !isNaN(numPrice) && numPrice > 0;
};

// Helper function to treat zero values as null/undefined
const treatZeroAsNull = (value: number | undefined | null): number | null => {
  if (value === undefined || value === null || value === 0) {
    return null;
  }
  return value;
};

// Apply pricing rules to calculate a new price - Updated to match new rule structure
export const applyPricingRules = (item: any, ruleConfig: RuleConfig) => {
  // Extract needed values - treating zeros as nulls
  const rawCost = Number(item.avgCost) || 0;
  const rawNextCost = Number(item.nextCost) || 0;
  const usageRank = Math.max(1, Math.min(6, Number(item.usageRank) || 1));
  
  // Apply zero-as-null logic to cost fields
  const cost = treatZeroAsNull(rawCost) !== null ? rawCost : 0;
  const nextCost = treatZeroAsNull(rawNextCost) !== null ? rawNextCost : 0;
  const hasValidCost = treatZeroAsNull(cost) !== null;
  
  // CRITICAL FIX: Properly handle ETH_NET as the Market Low
  // This is the key change - only use ETH_NET as Market Low, don't substitute others
  const rawMarketLow = Number(item.eth_net) || 0;
  
  // Apply zero-as-null logic to market low
  const marketLow = treatZeroAsNull(rawMarketLow) !== null ? rawMarketLow : 0;
  const hasValidMarketLow = treatZeroAsNull(marketLow) !== null;
  
  // ENHANCED: Improved determination of true market low with more robust validation
  // Using explicit check of each competitor price with the new isValidPrice helper
  const competitorPrices = [];
  
  // Log all competitor price fields to diagnose issues
  console.log('RAW competitor prices for item:', item.description);
  console.log('  ETH_NET:', item.eth_net, 'type:', typeof item.eth_net);
  console.log('  ETH:', item.eth, 'type:', typeof item.eth);
  console.log('  NUPHARM:', item.nupharm, 'type:', typeof item.nupharm);
  console.log('  LEXON:', item.lexon, 'type:', typeof item.lexon);
  console.log('  AAH:', item.aah, 'type:', typeof item.aah);
  
  // Add each competitor price explicitly only if it's valid using the new isValidPrice helper
  if (isValidPrice(item.eth_net)) {
    competitorPrices.push(Number(item.eth_net));
    console.log(`  Added ETH_NET price: ${Number(item.eth_net)}`);
  }
  
  if (isValidPrice(item.eth)) {
    competitorPrices.push(Number(item.eth));
    console.log(`  Added ETH price: ${Number(item.eth)}`);
  }
  
  if (isValidPrice(item.nupharm)) {
    competitorPrices.push(Number(item.nupharm));
    console.log(`  Added NUPHARM price: ${Number(item.nupharm)}`);
  }
  
  if (isValidPrice(item.lexon)) {
    competitorPrices.push(Number(item.lexon));
    console.log(`  Added LEXON price: ${Number(item.lexon)}`);
  }
  
  if (isValidPrice(item.aah)) {
    competitorPrices.push(Number(item.aah));
    console.log(`  Added AAH price: ${Number(item.aah)}`);
  }
  
  // Find the minimum valid competitor price
  let trueMarketLow = Infinity;
  let hasValidTrueMarketLow = false;
  
  if (competitorPrices.length > 0) {
    hasValidTrueMarketLow = true;
    trueMarketLow = Math.min(...competitorPrices);
    console.log(`  True Market Low calculated as: ${trueMarketLow} from ${competitorPrices.length} competitor prices`);
  } else {
    console.log(`  No valid competitor prices found for ${item.description}`);
  }
  
  // Flag if no market price is available - specifically for ETH_NET
  const noMarketPrice = !hasValidMarketLow;
  
  // Flag if we have at least one competitor price (for fallback rules)
  const hasAnyMarketPrice = hasValidTrueMarketLow;
  
  // Determine which usage group this item belongs to
  const usageGroup = determineUsageGroup(usageRank);
  
  // Determine if next buying price is lower than or equal to avg cost (downward trend)
  // Also treat as downward if next cost is missing or zero
  const isDownwardTrend = !hasValidCost || !nextCost || nextCost <= cost;
  
  // Get usage-based uplift percentage based on usage rank
  const usageUplift = getUsageBasedUplift(usageRank) / 100; // Convert to decimal (0%, 1%, or 2%)
  
  // Get usage-based competitor markup for when no market low is available
  const competitorMarkupPercent = getUsageBasedCompetitorMarkup(usageRank);
  const competitorMarkup = 1 + (competitorMarkupPercent / 100);
  
  // Special handling for zero/null cost items
  const isZeroCost = !hasValidCost;
  
  // Special debug for Diltiazem product
  const isDiltiazem = item.description && item.description.includes("Diltiazem");
  if (isDiltiazem) {
    console.log('DILTIAZEM PRODUCT DETECTED:', item.description);
    console.log('Raw pricing data:', {
      eth_net: item.eth_net,
      eth: item.eth,
      nupharm: item.nupharm,
      lexon: item.lexon,
      aah: item.aah,
      avgCost: item.avgCost,
    });
    console.log('Competitor prices array:', competitorPrices);
    console.log('Processed flags:', {
      hasValidMarketLow,
      hasValidTrueMarketLow,
      trueMarketLow,
      noMarketPrice,
      hasAnyMarketPrice,
      usageRank,
      usageUplift: usageUplift * 100 + '%',
    });
  }
  
  // Enhanced debug logging to help identify issues
  console.log('Processing item:', item.description, {
    cost, 
    marketLow, 
    trueMarketLow, 
    nextCost, 
    usageRank, 
    noMarketPrice, 
    hasAnyMarketPrice,
    isZeroCost, 
    isDownwardTrend,
    hasValidCost, 
    hasValidMarketLow, 
    hasValidTrueMarketLow,
    usageUplift: usageUplift * 100 + '%',
    competitorMarkup: competitorMarkupPercent + '%',
    currentPrice: item.currentREVAPrice,
    competitorPrices,
    competitorPricesCount: competitorPrices.length
  });
  
  let newPrice = 0;
  let ruleApplied = 'none';
  let marginCapApplied = false;
  let marginFloorApplied = false;
  
  // NEW OVERARCHING RULE: When there is no Market Low (ETH_NET), immediately apply pricing rule
  if (noMarketPrice) {
    console.log(`NEW RULE: No Market Low (ETH_NET) detected for ${item.description}`);
    
    // FIXED: If TrueMarketLow exists (any other competitor pricing), use that with 3% + uplift
    // This is the critical fix - ensuring we use TrueMarketLow when it exists
    if (hasValidTrueMarketLow && trueMarketLow !== Infinity) {
      // Apply the 3% standard markup plus usage-based uplift to TrueMarketLow
      const marketLowMarkup = 1 + (ruleConfig.rule1.marketLowUplift / 100) + usageUplift;
      newPrice = trueMarketLow * marketLowMarkup;
      ruleApplied = `no_market_low_use_true_market_low_plus_${ruleConfig.rule1.marketLowUplift + (usageUplift * 100)}`;
      
      console.log(`IMMEDIATE RULE APPLIED: Using TrueMarketLow (${trueMarketLow}) + ${ruleConfig.rule1.marketLowUplift}% + ${usageUplift * 100}% uplift = ${newPrice}`);
    }
    // If no competitor pricing at all, use Cost + 12% + uplift
    else if (hasValidCost) {
      const costMarkup = 1 + (ruleConfig.rule2.costMarkup / 100) + usageUplift;
      newPrice = cost * costMarkup;
      ruleApplied = `no_market_low_use_cost_plus_${ruleConfig.rule2.costMarkup + (usageUplift * 100)}`;
      
      console.log(`IMMEDIATE RULE APPLIED: Using Cost (${cost}) + ${ruleConfig.rule2.costMarkup}% + ${usageUplift * 100}% uplift = ${newPrice}`);
    }
    // ... keep existing code (fallback handling for no valid cost or TML)
  }
  // ... keep existing code (ZERO/NULL COST ITEM HANDLING)
  
  // ... keep existing code (RULE 1: AVC < ML)
  
  // ... keep existing code (RULE 2: AVC ≥ ML)
  
  // ... keep existing code (ENHANCED FALLBACK RULES)
  
  // ... keep existing code (zero or negative price handling)
  
  // ... keep existing code (global margin floor application)
  
  // ... keep existing code (final sanity check)
  
  // ... keep existing code (calculate margin and flags for the item)
  
  return {
    originalPrice: item.currentREVAPrice || 0,
    newPrice: newPrice,
    cost: cost,
    marketLow: marketLow,
    trueMarketLow: hasValidTrueMarketLow ? trueMarketLow : null,
    originalMargin: item.currentREVAMargin || 0,
    newMargin: newMargin, // Store as decimal, not percentage
    marginDiff: newPrice > 0 ? ((newPrice - cost) / newPrice) - (item.currentREVAMargin || 0) : 0, // Store difference as decimal
    ruleApplied: ruleApplied,
    usageGroup: usageGroup,
    usageRank: usageRank,
    flag1: flag1,
    flag2: flag2,
    marginCapApplied: marginCapApplied,
    marginFloorApplied: marginFloorApplied,
    noMarketLow: !hasValidMarketLow,
    hasTrueMarketLow: hasValidTrueMarketLow,
    // Add additional diagnostic info for debugging
    competitorPricesCount: competitorPrices.length,
    competitorPrices: competitorPrices.length > 0 ? competitorPrices : null
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
