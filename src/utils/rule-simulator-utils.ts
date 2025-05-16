
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

// Helper function to get the usage-based competitor markup percentage
const getUsageBasedCompetitorMarkup = (usageRank: number): number => {
  if (usageRank <= 2) return 3; // 3% uplift for ranks 1-2
  if (usageRank <= 4) return 4; // 4% uplift for ranks 3-4
  return 5; // 5% uplift for ranks 5-6
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
  
  // CRITICAL FIX: Improved determination of true market low (minimum of all competitor prices)
  // Using explicit check of each competitor price and finding the minimum
  const competitorPrices = [];
  
  // Add each competitor price explicitly only if it's valid (> 0)
  if (item.eth_net > 0) competitorPrices.push(item.eth_net);
  if (item.eth > 0) competitorPrices.push(item.eth);
  if (item.nupharm > 0) competitorPrices.push(item.nupharm);
  if (item.lexon > 0) competitorPrices.push(item.lexon);
  if (item.aah > 0) competitorPrices.push(item.aah);
  
  // Find the minimum valid competitor price
  let trueMarketLow = Infinity;
  let hasValidTrueMarketLow = false;
  
  if (competitorPrices.length > 0) {
    hasValidTrueMarketLow = true;
    trueMarketLow = Math.min(...competitorPrices);
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
  
  // Special debug for Symbicort product
  const isSymbicort = item.description && item.description.includes("Symbicort");
  if (isSymbicort) {
    console.log('SYMBICORT PRODUCT DETECTED:', item.description);
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
    eth_net: item.eth_net,
    eth: item.eth,
    nupharm: item.nupharm,
    lexon: item.lexon,
    aah: item.aah,
    competitorPrices,
  });
  
  let newPrice = 0;
  let ruleApplied = 'none';
  let marginCapApplied = false;
  let marginFloorApplied = false;
  
  // ZERO/NULL COST ITEM HANDLING - Priority order for calculation
  if (isZeroCost) {
    console.log(`ZERO/NULL COST ITEM DETECTED: ${item.description}`);
    
    // Define standard markups - we'll need these multiple times
    const standardMLMarkup = 1 + (ruleConfig.rule1.marketLowUplift / 100) + usageUplift;
    const standardCostMarkup = 1 + (ruleConfig.rule2.costMarkup / 100) + usageUplift;
    
    // If market low is available, use it with standard markup
    if (hasValidMarketLow) {
      newPrice = marketLow * standardMLMarkup;
      ruleApplied = 'zero_cost_market';
      
      console.log(`Set zero cost item price based on market low (${marketLow}) * ${standardMLMarkup} = ${newPrice}`);
    }
    // UPDATED: If market low isn't available but trueMarketLow is (other competitor prices), use that
    else if (hasValidTrueMarketLow) {
      // Use standard ML markup (3% + usage uplift) for true market low
      const trueMarketLowMarkup = 1 + (ruleConfig.rule1.marketLowUplift / 100) + usageUplift;
      newPrice = trueMarketLow * trueMarketLowMarkup;
      ruleApplied = `zero_cost_true_market_low_plus_${ruleConfig.rule1.marketLowUplift + (usageUplift * 100)}`;
      
      console.log(`Using True Market Low fallback with ${ruleConfig.rule1.marketLowUplift}% + ${usageUplift * 100}% uplift: ${trueMarketLow} * ${trueMarketLowMarkup} = ${newPrice}`);
    }
    // No market price but we have next cost
    else if (treatZeroAsNull(nextCost) !== null) {
      newPrice = nextCost * standardCostMarkup;
      ruleApplied = 'zero_cost_nextcost';
      
      console.log(`Set zero cost item price based on next cost (${nextCost}) * ${standardCostMarkup} = ${newPrice}`);
    }
    // No market price and no next cost, but we have current price
    else if (treatZeroAsNull(item.currentREVAPrice) !== null) {
      newPrice = item.currentREVAPrice;
      ruleApplied = 'zero_cost_currentprice';
      
      console.log(`Set zero cost item price based on current price: ${newPrice}`);
    }
    // Absolute fallback - minimum price
    else {
      newPrice = 0.01; // Minimum price
      ruleApplied = 'zero_cost_minimum';
      
      console.log(`Set zero cost item to minimum price: ${newPrice}`);
    }
  }
  // RULE 1: AVC < ML - Average Cost is less than Market Low
  else if (hasValidMarketLow && hasValidCost && cost < marketLow) {
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
    // FIXED: Only apply margin cap when cost is greater than 0
    if (cost <= 1.00 && cost > 0) {
      // Get the appropriate margin cap percentage for this usage group
      const marginCapKey = usageGroup as keyof typeof ruleConfig.rule1.marginCaps;
      const marginCap = ruleConfig.rule1.marginCaps[marginCapKey] / 100; // Convert to decimal
      
      // Calculate max price based on margin cap
      const maxPriceByMarginCap = cost / (1 - marginCap);
      
      console.log(`Margin cap check: Cost=${cost}, Cap=${marginCap}, MaxPrice=${maxPriceByMarginCap}, CurrentPrice=${newPrice}`);
      
      if (newPrice > maxPriceByMarginCap && maxPriceByMarginCap > 0) {
        console.log(`Applying margin cap: Reducing price from ${newPrice} to ${maxPriceByMarginCap}`);
        newPrice = maxPriceByMarginCap;
        marginCapApplied = true;
        ruleApplied += '_capped';
      }
    } else if (cost <= 0) {
      console.log(`Skipping margin cap for zero-cost item: ${item.description}`);
    }
  }
  // RULE 2: AVC ≥ ML - Average Cost is greater than or equal to Market Low
  else if (hasValidMarketLow && hasValidCost && cost >= marketLow) {
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
  // ENHANCED FALLBACK RULES: No Market Low (ETH_NET) available - CRITICAL FIX HERE
  else {
    console.log(`ENHANCED FALLBACK: No ETH_NET Market Low for ${item.description} - ${cost}`);
    
    // CRITICAL FIX: Implement proper fallback hierarchy with double-checks
    // We check first for the presence of competitor prices (trueMarketLow)
    // Only if no competitor prices exist do we use cost-based pricing
    
    // FALLBACK 1: If any competitor prices exist (TML is available)
    // IMPROVED: Double check both hasValidTrueMarketLow flag and direct check on trueMarketLow
    if (hasValidTrueMarketLow && competitorPrices.length > 0 && trueMarketLow !== Infinity) {
      // Use standard ML markup (3% + usage uplift) for true market low
      const trueMarketLowMarkup = 1 + (ruleConfig.rule1.marketLowUplift / 100) + usageUplift;
      newPrice = trueMarketLow * trueMarketLowMarkup;
      ruleApplied = `fallback_true_market_low_plus_${ruleConfig.rule1.marketLowUplift + (usageUplift * 100)}`;
      
      if (isSymbicort) {
        console.log(`SYMBICORT FALLBACK 1: Using True Market Low ${trueMarketLow} with ${ruleConfig.rule1.marketLowUplift}% + ${usageUplift * 100}% uplift = ${newPrice}`);
        console.log(`Expected calculation: ${trueMarketLow} * (1 + ${ruleConfig.rule1.marketLowUplift/100} + ${usageUplift}) = ${trueMarketLow * (1 + ruleConfig.rule1.marketLowUplift/100 + usageUplift)}`);
        console.log('Competitor prices used for TML:', competitorPrices);
      }
      
      console.log(`Using True Market Low fallback with ${ruleConfig.rule1.marketLowUplift}% + ${usageUplift * 100}% uplift: ${trueMarketLow} * ${trueMarketLowMarkup} = ${newPrice}`);
    }
    // FALLBACK 2: Only use cost-based pricing when no competitor prices exist
    else if (hasValidCost) {
      const standardCostMarkup = 1 + (ruleConfig.rule2.costMarkup / 100) + usageUplift;
      newPrice = cost * standardCostMarkup;
      ruleApplied = 'fallback_cost_based';
      
      if (isSymbicort) {
        console.log(`SYMBICORT FALLBACK 2: Using Cost ${cost} with ${ruleConfig.rule2.costMarkup}% + ${usageUplift * 100}% uplift = ${newPrice}`);
        console.log('No valid competitor prices found, competitor prices array:', competitorPrices);
        console.log('hasValidTrueMarketLow =', hasValidTrueMarketLow);
        console.log('trueMarketLow =', trueMarketLow);
      }
      
      console.log(`Using AVC fallback: ${cost} * ${standardCostMarkup} = ${newPrice}`);
    }
    // No valid cost, try next cost
    else if (treatZeroAsNull(nextCost) !== null) {
      const standardCostMarkup = 1 + (ruleConfig.rule2.costMarkup / 100) + usageUplift;
      newPrice = nextCost * standardCostMarkup;
      ruleApplied = 'fallback_nextcost_based';
      
      console.log(`Using Next Cost fallback: ${nextCost} * ${standardCostMarkup} = ${newPrice}`);
    }
    // No cost or next cost, use current price
    else if (treatZeroAsNull(item.currentREVAPrice) !== null) {
      newPrice = item.currentREVAPrice;
      ruleApplied = 'fallback_current_price';
      
      console.log(`Using Current Price fallback: ${item.currentREVAPrice}`);
    }
    // Absolute fallback - minimum price
    else {
      newPrice = 0.01;
      ruleApplied = 'fallback_minimum';
      
      console.log(`Using minimum price fallback: ${newPrice}`);
    }
  }
  
  // Ensure we never have zero or negative price
  if (newPrice <= 0) {
    console.log(`WARNING: Zero or negative price calculated for ${item.description}. Applying emergency fallbacks.`);
    
    // Emergency fallback - better than returning zero
    if (hasValidMarketLow) {
      newPrice = marketLow * 1.05;
      ruleApplied += '_emergency_fallback';
      console.log(`Emergency fallback to market price: ${newPrice}`);
    } else if (hasValidTrueMarketLow) {
      // Try true market low if regular market low isn't available
      // UPDATED: Use standard 3% + usage uplift for emergency fallback from true market low
      const trueMarketLowMarkup = 1 + (ruleConfig.rule1.marketLowUplift / 100) + usageUplift;
      newPrice = trueMarketLow * trueMarketLowMarkup;
      ruleApplied += '_emergency_fallback_true_market_low';
      console.log(`Emergency fallback to true market price with ${ruleConfig.rule1.marketLowUplift}% + ${usageUplift * 100}% markup: ${newPrice}`);
    } else if (treatZeroAsNull(nextCost) !== null) {
      newPrice = nextCost * 1.15;
      ruleApplied += '_emergency_fallback_nextcost';
      console.log(`Emergency fallback to next cost: ${newPrice}`);
    } else if (treatZeroAsNull(item.currentREVAPrice) !== null) {
      newPrice = item.currentREVAPrice;
      ruleApplied += '_emergency_fallback_currentprice';
      console.log(`Emergency fallback to current price: ${newPrice}`);
    } else {
      // Absolute last resort - set a minimum price of £0.01
      newPrice = 0.01;
      ruleApplied += '_minimum_price_enforced';
      console.log(`Emergency minimum price enforced: ${newPrice}`);
    }
  }
  
  // Apply global margin floor if configured
  if (!isZeroCost && treatZeroAsNull(cost) !== null && cost > 0 && ruleConfig.globalMarginFloor > 0) {
    const newMargin = newPrice > 0 ? (newPrice - cost) / newPrice : 0;
    const minMargin = ruleConfig.globalMarginFloor / 100;
    
    if (newMargin < minMargin) {
      newPrice = cost / (1 - minMargin);
      marginFloorApplied = true;
      ruleApplied += '_floor';
    }
  }
  
  // Final sanity check - never return zero price
  if (newPrice <= 0) {
    console.log(`WARNING: Price still zero after all rules for ${item.description}. Setting minimum price.`);
    newPrice = 0.01;
    ruleApplied += '_final_minimum_enforced';
  }
  
  // Calculate margin for the item
  const newMargin = newPrice > 0 && hasValidCost ? (newPrice - cost) / newPrice : 0;
  
  // Calculate flags based on actual criteria
  const flag1 = hasValidTrueMarketLow && newPrice >= trueMarketLow * 1.10; // Price ≥10% above TRUE MARKET LOW
  const flag2 = newMargin <= 0; // Margin <= 0%
  
  console.log(`Final price for ${item.description}: ${newPrice}, Rule Applied: ${ruleApplied}`);
  
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
    hasTrueMarketLow: hasValidTrueMarketLow
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
